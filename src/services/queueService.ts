/**
 * SmartProcure - Live Queue Service
 * 
 * CORE RESPONSIBILITIES:
 * 1. Physical live queue tracking for checked-in farmers (excluding pending BOOKED appointments).
 * 2. Real-time queue ordering based on actual check-in timestamps (never token strings).
 * 3. Dynamic waiting time calculation using rolling averages of actual completed durations.
 * 4. Operational state handling (Delays, Lunch pauses, Carrying over to next operating day).
 * 5. Supabase Realtime subscriptions + in-memory reactive event broadcast.
 * 6. Administrative queue lifecycle actions (Check-in, Start Processing, Complete, Delay, Pause, Resume).
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { QueueEventType } from '../types/database';
import { ProcurementBooking } from '../types';
import { calculateAverageProcessingTime, estimateWaitTimeForWaitingPosition } from './queueEtaService';
import { notificationService } from './notificationService';
import {
  computeQueueIntelligence,
  QueueIntelligenceResult,
  ActiveDelayInfo,
  OperationalDelayReason,
  BASELINE_PROCESSING_MINUTES,
} from './queueIntelligence';

export type FarmerTelemetryStatus = 'BOOKED' | 'CHECKED_IN' | 'WAITING' | 'PROCESSING' | 'COMPLETED';

export interface FarmerLiveTelemetry {
  status: FarmerTelemetryStatus;
  token: string;
  centreId: string;
  centreName: string;
  cropName: string;
  quantityQuintals: number;
  position: number | null;
  farmersAhead: number;
  estimatedWaitMinutes: number;
  formattedWaitTime: string;
  etaLabel: string;
  isBaselineEta: boolean;
  activeDelay: {
    isActive: boolean;
    delayMinutes: number;
    reason: string;
    notes?: string;
  } | null;
  startedProcessingTime?: string;
  elapsedMinutes: number;
  completedAt?: string;
  lastUpdated: string;
}

export interface LiveQueueEntry {
  bookingId: string;
  token: string;
  position: number; // 1-based order in physical line
  status: 'WAITING' | 'PROCESSING';
  farmerId?: string;
  farmerNameHint: string;
  crop: string;
  quantityQuintals: number;
  checkInTimestamp: string; // ISO string used for queue ordering
  startedProcessingTimestamp?: string;
  isCurrentUser: boolean;
  stageName: string;
}

export interface CentreOperationalQueueState {
  centreId: string;
  activeProcessingToken: string | null;
  totalWaitingCount: number;
  totalCheckedInCount: number;
  entries: LiveQueueEntry[];
  activeDelay: ActiveDelayInfo;
  isPaused: boolean;
  pauseReason?: string;
  recentCompletedDurations: number[];
  lastUpdated: string;
}

// In-memory simulation state for offline fallback and immediate reactive updates
interface LocalQueueStore {
  checkedInEntries: LiveQueueEntry[];
  completedDurations: number[];
  activeDelay: ActiveDelayInfo;
  isPaused: boolean;
  pauseReason?: string;
}

class QueueService {
  private localStores: Map<string, LocalQueueStore> = new Map();
  private subscribers: Map<string, Set<(state: CentreOperationalQueueState) => void>> = new Map();
  private realtimeChannels: Map<string, any> = new Map();

  constructor() {
    // Seed initial realistic operational data for the primary test mandi
    // Note: SP7K3M is currently processing, SP7K3N and SP7K3P are waiting.
    const defaultStore: LocalQueueStore = {
      checkedInEntries: [
        {
          bookingId: 'book-seed-01',
          token: 'SP7K3M',
          position: 1,
          status: 'PROCESSING',
          farmerNameHint: 'Gurdeep S.',
          crop: 'Wheat (30 Q)',
          quantityQuintals: 30,
          checkInTimestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          startedProcessingTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isCurrentUser: false,
          stageName: 'Electronic Weighbridge Verification',
        },
        {
          bookingId: 'book-seed-02',
          token: 'SP7K3N',
          position: 2,
          status: 'WAITING',
          farmerNameHint: 'Balwinder K.',
          crop: 'Wheat (20 Q)',
          quantityQuintals: 20,
          checkInTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isCurrentUser: false,
          stageName: 'Waiting for Weighbridge',
        },
        {
          bookingId: 'book-seed-03',
          token: 'SP7K3P',
          position: 3,
          status: 'WAITING',
          farmerNameHint: 'Harpreet S.',
          crop: 'Wheat (40 Q)',
          quantityQuintals: 40,
          checkInTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isCurrentUser: false,
          stageName: 'Waiting for Weighbridge',
        },
      ],
      // Recent completed processing durations (e.g. 24 mins, 31 mins, 27 mins)
      completedDurations: [24, 31, 27],
      activeDelay: {
        isActive: false,
        reason: 'NONE',
        delayMinutes: 0,
      },
      isPaused: false,
    };

    // Ludhiana Central Mandi Yard 4 ID
    this.localStores.set('b0000001-0000-0000-0000-000000000001', defaultStore);
  }

  private getStore(centreId: string): LocalQueueStore {
    if (!this.localStores.has(centreId)) {
      this.localStores.set(centreId, {
        checkedInEntries: [],
        completedDurations: [26, 28, 25], // initial sample durations
        activeDelay: { isActive: false, reason: 'NONE', delayMinutes: 0 },
        isPaused: false,
      });
    }
    return this.localStores.get(centreId)!;
  }

  /**
   * Retrieves the physical live queue entries for a centre.
   * STRICT RULE: Only farmers who have checked in at the gate appear in the live queue.
   */
  async getLiveQueueEntries(centreId: string): Promise<LiveQueueEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Query bookings that are in progress (checked in) or have checked-in queue events
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            token,
            farmer_id,
            quantity,
            booking_status,
            created_at,
            crops (name),
            profiles (full_name)
          `)
          .eq('centre_id', centreId)
          .in('booking_status', ['in_progress', 'confirmed'])
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Check processing_started queue events to determine if any are currently PROCESSING
          const { data: events } = await supabase
            .from('queue_events')
            .select('booking_id, event_type, event_time')
            .eq('centre_id', centreId)
            .in('event_type', ['checked_in', 'processing_started', 'processing_completed'])
            .order('event_time', { ascending: false });

          const processingMap = new Set<string>();
          const completedMap = new Set<string>();
          const checkinTimeMap = new Map<string, string>();

          if (events) {
            events.forEach((ev) => {
              if (!ev.booking_id) return;
              if (ev.event_type === 'processing_completed') {
                completedMap.add(ev.booking_id);
              }
              if (ev.event_type === 'processing_started' && !completedMap.has(ev.booking_id)) {
                processingMap.add(ev.booking_id);
              }
              if (ev.event_type === 'checked_in' && !checkinTimeMap.has(ev.booking_id)) {
                checkinTimeMap.set(ev.booking_id, ev.event_time);
              }
            });
          }

          // Filter out completed and un-checked-in bookings:
          // A booking alone must NOT create a physical queue position.
          // Only checked-in farmers belong to the physical queue.
          const activeList = data.filter(
            (b) => !completedMap.has(b.id) && (checkinTimeMap.has(b.id) || b.booking_status === 'in_progress')
          );

          activeList.sort((a, b) => {
            const timeA = checkinTimeMap.get(a.id) || a.created_at;
            const timeB = checkinTimeMap.get(b.id) || b.created_at;
            return timeA.localeCompare(timeB);
          });

          if (activeList.length > 0) {
            return activeList.map((b, idx) => {
              // Strictly rely on processingMap (explicit processing_started event)
              const isProcessing = processingMap.has(b.id);
              const fullName = (b as any).profiles?.full_name || 'Farmer';
              const nameParts = fullName.split(' ');
              const nameHint = `${nameParts[0]} ${nameParts[1]?.[0] ? nameParts[1][0] + '.' : ''}`.trim();
              const cropName = (b as any).crops?.name || 'Wheat';

              return {
                bookingId: b.id,
                token: b.token,
                position: idx + 1,
                status: isProcessing ? 'PROCESSING' : 'WAITING',
                farmerId: b.farmer_id,
                farmerNameHint: nameHint,
                crop: `${cropName} (${b.quantity} Q)`,
                quantityQuintals: Number(b.quantity),
                checkInTimestamp: checkinTimeMap.get(b.id) || b.created_at,
                isCurrentUser: user ? b.farmer_id === user.id : false,
                stageName: isProcessing ? 'Electronic Weighbridge Verification' : 'Waiting in Mandi Yard',
              };
            });
          }
        }
      } catch (err) {
        console.warn('Live queue Supabase lookup fell back to operational store:', err);
      }
    }

    // Local operational store fallback
    const store = this.getStore(centreId);
    return [...store.checkedInEntries];
  }

  /**
   * Retrieves recent actual completed weighbridge durations (in minutes).
   */
  async getRecentCompletedDurations(centreId: string): Promise<number[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('queue_events')
          .select('estimated_processing_minutes')
          .eq('centre_id', centreId)
          .eq('event_type', 'processing_completed')
          .gt('estimated_processing_minutes', 0)
          .order('event_time', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          const durations = data
            .map((d) => Number(d.estimated_processing_minutes))
            .filter((m) => m >= 5 && m <= 120);

          if (durations.length > 0) {
            return durations;
          }
        }
      } catch (err) {
        console.warn('Supabase historical velocity lookup fallback:', err);
      }
    }

    const store = this.getStore(centreId);
    return store.completedDurations.length > 0 ? store.completedDurations : [24, 31, 27];
  }

  /**
   * Retrieves current active delays or pauses for the centre.
   */
  async getActiveDelayInfo(centreId: string): Promise<{ delay: ActiveDelayInfo; isPaused: boolean; pauseReason?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('queue_events')
          .select('*')
          .eq('centre_id', centreId)
          .in('event_type', ['delayed', 'procurement_paused', 'procurement_resumed'])
          .gte('event_time', todayStart.toISOString())
          .order('event_time', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const latest = data[0];
          if (latest.event_type === 'procurement_paused') {
            return {
              delay: { isActive: false, reason: 'PROCUREMENT_PAUSED', delayMinutes: 0 },
              isPaused: true,
              pauseReason: latest.notes || 'Procurement intake temporarily paused',
            };
          }
          if (latest.event_type === 'delayed') {
            return {
              delay: {
                isActive: true,
                reason: latest.notes || 'PROCESSING_DELAY',
                delayMinutes: Number(latest.delay_minutes) || 30,
                notes: latest.notes || undefined,
                startedAt: latest.event_time,
              },
              isPaused: false,
            };
          }
          if (latest.event_type === 'procurement_resumed') {
            return {
              delay: { isActive: false, reason: 'NONE', delayMinutes: 0 },
              isPaused: false,
            };
          }
        }
      } catch (err) {
        console.warn('Supabase active delay lookup fallback:', err);
      }
    }

    const store = this.getStore(centreId);
    return {
      delay: store.activeDelay,
      isPaused: store.isPaused,
      pauseReason: store.pauseReason,
    };
  }

  /**
   * Complete Operational Queue State for a centre.
   */
  async getOperationalQueueState(centreId: string): Promise<CentreOperationalQueueState> {
    const entries = await this.getLiveQueueEntries(centreId);
    const recentDurations = await this.getRecentCompletedDurations(centreId);
    const { delay, isPaused, pauseReason } = await this.getActiveDelayInfo(centreId);

    const serving = entries.find((e) => e.status === 'PROCESSING');

    return {
      centreId,
      activeProcessingToken: serving ? serving.token : null,
      totalWaitingCount: entries.filter((e) => e.status === 'WAITING').length,
      totalCheckedInCount: entries.length,
      entries,
      activeDelay: delay,
      isPaused,
      pauseReason,
      recentCompletedDurations: recentDurations,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * CALCULATES FULL QUEUE INTELLIGENCE FOR A SPECIFIC TOKEN OR BOOKING:
   * Translates real check-in position, rolling processing durations, and working hours
   * into clean, accurate UI telemetry.
   */
  async getQueueIntelligenceForBooking(
    bookingIdOrToken: string,
    centreId: string
  ): Promise<QueueIntelligenceResult> {
    const cleanId = bookingIdOrToken.trim().toUpperCase();
    const state = await this.getOperationalQueueState(centreId);

    // Map entries to simplified format for computeQueueIntelligence
    const checkedInQueue = state.entries.map((e) => ({
      bookingId: e.bookingId,
      token: e.token,
      status: e.status,
      checkInTimestamp: e.checkInTimestamp,
      farmerNameHint: e.farmerNameHint,
      crop: e.crop,
    }));

    return computeQueueIntelligence({
      bookingIdOrToken: cleanId,
      checkedInQueue,
      recentCompletedDurations: state.recentCompletedDurations,
      activeDelay: state.activeDelay,
      isProcurementPaused: state.isPaused,
      pauseReason: state.pauseReason,
      currentTime: new Date(),
    });
  }

  /**
   * Checks whether a booking has already checked in at the gate.
   */
  async isBookingCheckedIn(bookingIdOrToken: string, centreId: string): Promise<boolean> {
    const clean = bookingIdOrToken.trim().toUpperCase();
    const entries = await this.getLiveQueueEntries(centreId);
    return entries.some((e) => e.token.toUpperCase() === clean || e.bookingId === clean);
  }

  // =========================================================================
  // ADMIN & OPERATIONAL SOURCE OF TRUTH ACTIONS
  // =========================================================================

  /**
   * GATE INGRESS CHECK-IN:
   * Transitions a booked farmer from pending arrival to active physical queue.
   */
  async checkInFarmer(params: {
    bookingId: string;
    token: string;
    centreId: string;
    farmerNameHint?: string;
    cropName?: string;
    quantityQuintals?: number;
  }): Promise<boolean> {
    const { bookingId, token, centreId, farmerNameHint = 'Farmer', cropName = 'Wheat', quantityQuintals = 25 } = params;

    // 1. In Supabase: update booking status and record checked_in event
    if (isSupabaseConfigured()) {
      try {
        const clean = token.trim().toUpperCase();
        let validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)
          ? bookingId
          : null;

        if (!validUuid) {
          const { data: bRow } = await supabase.from('bookings').select('id').eq('token', clean).maybeSingle();
          if (bRow?.id) validUuid = bRow.id;
        }

        await supabase
          .from('bookings')
          .update({ booking_status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('token', clean);

        await supabase.from('queue_events').insert({
          booking_id: validUuid,
          centre_id: centreId,
          event_type: 'checked_in',
          notes: `Gate ingress verified for Token ${clean}`,
          event_time: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase checkin error (non-fatal):', err);
      }
    }

    // 2. Update in-memory store
    const store = this.getStore(centreId);
    const existingIndex = store.checkedInEntries.findIndex((e) => e.token === token);

    if (existingIndex === -1) {
      const isFirst = store.checkedInEntries.length === 0;
      store.checkedInEntries.push({
        bookingId,
        token: token.trim().toUpperCase(),
        position: store.checkedInEntries.length + 1,
        status: isFirst ? 'PROCESSING' : 'WAITING',
        farmerNameHint,
        crop: `${cropName} (${quantityQuintals} Q)`,
        quantityQuintals,
        checkInTimestamp: new Date().toISOString(),
        isCurrentUser: true,
        stageName: isFirst ? 'Electronic Weighbridge Verification' : 'Waiting in Mandi Yard',
      });
    }

    this.notifySubscribers(centreId);
    return true;
  }

  /**
   * START PROCESSING:
   * Moves a checked-in farmer to active weighbridge processing.
   */
  async startProcessing(token: string, centreId: string): Promise<boolean> {
    const clean = token.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data: b } = await supabase.from('bookings').select('id').eq('token', clean).maybeSingle();
        if (b?.id) {
          await supabase
            .from('bookings')
            .update({ booking_status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', b.id);
        }
        await supabase.from('queue_events').insert({
          booking_id: b?.id || null,
          centre_id: centreId,
          event_type: 'processing_started',
          notes: `Weighment processing started for Token ${clean}`,
          event_time: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase startProcessing notice:', err);
      }
    }

    const store = this.getStore(centreId);
    store.checkedInEntries = store.checkedInEntries.map((entry) => {
      if (entry.token === clean) {
        return {
          ...entry,
          status: 'PROCESSING',
          startedProcessingTimestamp: new Date().toISOString(),
          stageName: 'Electronic Weighbridge Verification',
        };
      }
      return entry;
    });

    this.notifySubscribers(centreId);
    return true;
  }

  /**
   * COMPLETE PROCESSING:
   * Finishes procurement for the currently processing farmer.
   * - Records actual completed duration for rolling average calculation.
   * - Moves next farmer up (#2 becomes #1, #3 becomes #2).
   */
  async completeProcessing(token: string, centreId: string, customDurationMinutes?: number): Promise<boolean> {
    const clean = token.trim().toUpperCase();
    const store = this.getStore(centreId);

    // Calculate actual elapsed duration or use realistic random duration around 25m
    let duration = customDurationMinutes;
    const entry = store.checkedInEntries.find((e) => e.token === clean);

    if (!duration) {
      if (entry?.startedProcessingTimestamp) {
        const elapsed = (Date.now() - new Date(entry.startedProcessingTimestamp).getTime()) / 60000;
        duration = Math.max(15, Math.round(elapsed));
      } else {
        duration = Math.floor(22 + Math.random() * 8); // 22-30 mins
      }
    }

    // 1. Record in Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('bookings')
          .update({ booking_status: 'completed', updated_at: new Date().toISOString() })
          .eq('token', clean);

        const { data: b } = await supabase
          .from('bookings')
          .select('id, farmer_id, quantity, crops(name), procurement_centres(name)')
          .eq('token', clean)
          .maybeSingle();

        await supabase.from('queue_events').insert({
          booking_id: b?.id || null,
          centre_id: centreId,
          event_type: 'processing_completed',
          estimated_processing_minutes: duration,
          notes: `Weighment completed in ${duration} minutes for Token ${clean}`,
          event_time: new Date().toISOString(),
        });

        if (b?.farmer_id) {
          const centreName = (b as any)?.procurement_centres?.name || 'Mandi Centre';
          const cropName = (b as any)?.crops?.name || 'Wheat';
          const qty = b.quantity || 0;
          await notificationService.createNotification({
            farmerId: b.farmer_id,
            bookingId: b.id,
            type: 'procurement',
            title: 'Procurement Completed',
            message: `Your procurement has been successfully completed.\n\nToken: ${clean}\nCentre: ${centreName}\nCrop: ${cropName}\nQuantity: ${qty} Quintal`,
          });
        }
      } catch (err) {
        console.warn('Supabase completeProcessing notice:', err);
      }
    }

    // 2. Add to rolling durations
    store.completedDurations.unshift(duration);
    if (store.completedDurations.length > 10) {
      store.completedDurations = store.completedDurations.slice(0, 10);
    }

    // 3. Remove completed entry and advance remaining queue
    store.checkedInEntries = store.checkedInEntries
      .filter((e) => e.token !== clean)
      .map((e, idx) => ({
        ...e,
        position: idx + 1,
        status: 'WAITING',
        stageName: 'Waiting in Mandi Yard',
      }));

    this.notifySubscribers(centreId);
    return true;
  }

  /**
   * MARK OPERATIONAL DELAY:
   * Logs observable delay reason (Weighbridge calibration, moisture check, power outage).
   */
  async markDelay(params: {
    centreId: string;
    delayMinutes: number;
    reason: OperationalDelayReason | string;
    notes?: string;
  }): Promise<boolean> {
    const { centreId, delayMinutes, reason, notes } = params;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('queue_events').insert({
          centre_id: centreId,
          event_type: 'delayed',
          delay_minutes: delayMinutes,
          notes: notes || reason,
          event_time: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase delay log error:', err);
      }
    }

    const store = this.getStore(centreId);
    store.activeDelay = {
      isActive: true,
      reason,
      delayMinutes,
      notes: notes || `Operational delay: ${reason.replace(/_/g, ' ').toLowerCase()} (+${delayMinutes} mins)`,
      startedAt: new Date().toISOString(),
    };

    this.notifySubscribers(centreId);
    return true;
  }

  /**
   * PAUSE INTAKE:
   */
  async pauseProcurement(centreId: string, reason: string = 'Mandatory operational inspection'): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('queue_events').insert({
          centre_id: centreId,
          event_type: 'procurement_paused',
          notes: reason,
          event_time: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase pause log error:', err);
      }
    }

    const store = this.getStore(centreId);
    store.isPaused = true;
    store.pauseReason = reason;

    this.notifySubscribers(centreId);
    return true;
  }

  /**
   * RESUME INTAKE / CLEAR DELAYS:
   */
  async resumeProcurement(centreId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('queue_events').insert({
          centre_id: centreId,
          event_type: 'procurement_resumed',
          notes: 'Standard queue operations resumed',
          event_time: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase resume log error:', err);
      }
    }

    const store = this.getStore(centreId);
    store.isPaused = false;
    store.activeDelay = { isActive: false, reason: 'NONE', delayMinutes: 0 };
    store.pauseReason = undefined;

    this.notifySubscribers(centreId);
    return true;
  }

  // =========================================================================
  // SUPABASE REALTIME & IN-MEMORY EVENT BROADCAST
  // =========================================================================

  private notifySubscribers(centreId: string) {
    const subs = this.subscribers.get(centreId);
    if (subs && subs.size > 0) {
      this.getOperationalQueueState(centreId).then((state) => {
        subs.forEach((cb) => {
          try {
            cb(state);
          } catch (e) {
            console.error('Subscriber notification error:', e);
          }
        });
      });
    }
  }

  /**
   * Subscribes to live queue state changes.
   * Combines Supabase Realtime channel + local reactive notification.
   * Ensures only ONE Realtime channel is active per centre, with all listeners
   * registered before subscribe() is called.
   */
  subscribeToCentreQueue(
    centreId: string,
    callback: (state: CentreOperationalQueueState) => void
  ): () => void {
    if (!this.subscribers.has(centreId)) {
      this.subscribers.set(centreId, new Set());
    }
    this.subscribers.get(centreId)!.add(callback);

    // Initial state trigger
    this.getOperationalQueueState(centreId).then(callback);

    if (isSupabaseConfigured() && !this.realtimeChannels.has(centreId)) {
      try {
        const channel = supabase
          .channel(`mandi-queue-${centreId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'queue_events', filter: `centre_id=eq.${centreId}` },
            () => {
              this.notifySubscribers(centreId);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings', filter: `centre_id=eq.${centreId}` },
            () => {
              this.notifySubscribers(centreId);
            }
          )
          .subscribe();

        this.realtimeChannels.set(centreId, channel);
      } catch (err) {
        console.warn('Supabase Realtime subscription notice:', err);
      }
    }

    return () => {
      const subs = this.subscribers.get(centreId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(centreId);
          const ch = this.realtimeChannels.get(centreId);
          if (ch && isSupabaseConfigured()) {
            try {
              supabase.removeChannel(ch);
            } catch {
              /* noop */
            }
          }
          this.realtimeChannels.delete(centreId);
        }
      }
    };
  }

  /**
   * Subscribes strictly to local in-memory store changes.
   */
  subscribeToLocalEvents(
    centreId: string,
    callback: (state: CentreOperationalQueueState) => void
  ): () => void {
    if (!this.subscribers.has(centreId)) {
      this.subscribers.set(centreId, new Set());
    }
    this.subscribers.get(centreId)!.add(callback);

    return () => {
      const subs = this.subscribers.get(centreId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(centreId);
        }
      }
    };
  }

  /**
   * Evaluates the comprehensive live queue telemetry for a specific farmer's booking.
   * Strictly respects Supabase RLS and derives queue position solely from actual check-in order.
   */
  async getFarmerLiveTelemetry(booking: ProcurementBooking): Promise<FarmerLiveTelemetry> {
    const cleanToken = (booking.token || '').trim().toUpperCase();
    const centreId = booking.centreId;
    let bookingDbId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.id)
      ? booking.id
      : null;

    // Default baseline initializers
    let status: FarmerTelemetryStatus = 'BOOKED';
    let position: number | null = null;
    let farmersAhead = 0;
    let estimatedWaitMinutes = 20;
    let formattedWaitTime = '~20 min';
    let etaLabel = '20 min — Baseline estimate';
    let isBaselineEta = true;
    let activeDelay: { isActive: boolean; delayMinutes: number; reason: string; notes?: string } | null = null;
    let startedProcessingTime: string | undefined = undefined;
    let elapsedMinutes = 0;
    let completedAt: string | undefined = undefined;

    if (isSupabaseConfigured()) {
      try {
        if (!bookingDbId) {
          const { data: bRow } = await supabase
            .from('bookings')
            .select('id, booking_status')
            .eq('token', cleanToken)
            .maybeSingle();
          if (bRow?.id) {
            bookingDbId = bRow.id;
          }
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 1. Direct booking status verification
        if (bookingDbId) {
          const { data: bRow } = await supabase
            .from('bookings')
            .select('booking_status, updated_at')
            .eq('id', bookingDbId)
            .maybeSingle();
          if (bRow?.booking_status === 'completed') {
            status = 'COMPLETED';
            completedAt = bRow.updated_at || new Date().toISOString();
          }
        }

        // 2. Query centre queue_events for today (allowed by RLS for farmers with active centre bookings)
        const { data: centreEvents, error: eventsErr } = await supabase
          .from('queue_events')
          .select('*')
          .eq('centre_id', centreId)
          .gte('event_time', todayStart.toISOString())
          .order('event_time', { ascending: true });

        if (!eventsErr && centreEvents) {
          // Check events specifically relating to this farmer's booking
          const myEvents = centreEvents.filter(
            (e) => (bookingDbId && e.booking_id === bookingDbId) || (e.notes && e.notes.includes(cleanToken))
          );

          const myCheckedInEvent = myEvents.find((e) => e.event_type === 'checked_in');
          const myStartedEvent = [...myEvents].reverse().find((e) => e.event_type === 'processing_started');
          const myCompletedEvent = [...myEvents].reverse().find((e) => e.event_type === 'processing_completed');

          if (myCompletedEvent || status === 'COMPLETED' || booking.workflowStatus === 'PROCUREMENT_COMPLETED' || booking.workflowStatus === 'PAYMENT_PROCESSING' || booking.workflowStatus === 'PAYMENT_COMPLETED') {
            status = 'COMPLETED';
            completedAt = myCompletedEvent?.event_time || completedAt || new Date().toISOString();
          } else if (myStartedEvent) {
            status = 'PROCESSING';
            startedProcessingTime = myStartedEvent.event_time;
            elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(myStartedEvent.event_time).getTime()) / 60000));
            position = 1;
            farmersAhead = 0;
          } else if (myCheckedInEvent || booking.workflowStatus === 'QR_VERIFIED' || (booking as any).booking_status === 'in_progress') {
            status = 'WAITING';
          }

          // Active Delay lookup from queue_events
          const latestDelayEvent = [...centreEvents]
            .reverse()
            .find((e) => e.event_type === 'delayed' || e.event_type === 'procurement_resumed');
          if (latestDelayEvent && latestDelayEvent.event_type === 'delayed') {
            activeDelay = {
              isActive: true,
              delayMinutes: Number(latestDelayEvent.delay_minutes) || 30,
              reason: latestDelayEvent.notes || 'Operational Delay',
              notes: latestDelayEvent.notes || undefined,
            };
          }

          // Historical velocity durations for ETA calculation
          const completedDurations = centreEvents
            .filter((e) => e.event_type === 'processing_completed' && Number(e.estimated_processing_minutes) > 0)
            .map((e) => Number(e.estimated_processing_minutes))
            .filter((m) => m >= 5 && m <= 120);

          const etaSummary = calculateAverageProcessingTime(completedDurations);
          isBaselineEta = etaSummary.isBaseline;
          etaLabel = etaSummary.isBaseline
            ? '20 min — Baseline estimate'
            : `${etaSummary.averageProcessingMinutes} min (Avg of ${etaSummary.sampleCount} today)`;

          // If WAITING in the physical queue, calculate exact position and farmers ahead
          if (status === 'WAITING') {
            const bookingMap = new Map<string, { checkInTime: string; isProcessing: boolean; isCompleted: boolean }>();

            for (const ev of centreEvents) {
              const bKey = ev.booking_id || (ev.notes ? ev.notes.replace(/[^A-Z0-9]/g, '') : null);
              if (!bKey) continue;
              if (!bookingMap.has(bKey)) {
                bookingMap.set(bKey, { checkInTime: '', isProcessing: false, isCompleted: false });
              }
              const rec = bookingMap.get(bKey)!;
              if (ev.event_type === 'checked_in') {
                if (!rec.checkInTime || ev.event_time < rec.checkInTime) {
                  rec.checkInTime = ev.event_time;
                }
              } else if (ev.event_type === 'processing_started') {
                rec.isProcessing = true;
              } else if (ev.event_type === 'processing_completed') {
                rec.isProcessing = false;
                rec.isCompleted = true;
              }
            }

            const myKey = bookingDbId || cleanToken;
            const myCheckInTime = myCheckedInEvent?.event_time || new Date().toISOString();

            let someoneProcessing = false;
            let processingStartTime: string | undefined = undefined;
            let earlierWaitingCount = 0;

            for (const [key, bData] of bookingMap.entries()) {
              if (key === myKey) continue;
              if (bData.isCompleted) continue;
              if (bData.isProcessing) {
                someoneProcessing = true;
                const startedEv = [...centreEvents].reverse().find(
                  (e) => (e.booking_id === key || (e.notes && e.notes.includes(key))) && e.event_type === 'processing_started'
                );
                if (startedEv) processingStartTime = startedEv.event_time;
              } else if (bData.checkInTime && bData.checkInTime < myCheckInTime) {
                earlierWaitingCount++;
              }
            }

            farmersAhead = (someoneProcessing ? 1 : 0) + earlierWaitingCount;
            position = farmersAhead + 1;

            const currentProcessingElapsed = processingStartTime
              ? Math.max(0, Math.floor((Date.now() - new Date(processingStartTime).getTime()) / 60000))
              : 0;

            const waitMinutes = estimateWaitTimeForWaitingPosition(
              position,
              etaSummary.averageProcessingMinutes,
              currentProcessingElapsed,
              activeDelay ? activeDelay.delayMinutes : 0
            );

            estimatedWaitMinutes = waitMinutes;
            formattedWaitTime = waitMinutes <= 3 ? '< 5 min' : `~${waitMinutes} min`;
          }
        }
      } catch (err) {
        console.warn('Supabase farmer telemetry error, checking local store:', err);
      }
    }

    // Blend with local operational store if offline or local simulation is running
    if (status === 'BOOKED' || status === 'WAITING') {
      const store = this.getStore(centreId);
      const storeEntry = store.checkedInEntries.find((e) => e.token === cleanToken);
      if (storeEntry) {
        if (storeEntry.status === 'PROCESSING') {
          status = 'PROCESSING';
          position = 1;
          farmersAhead = 0;
          startedProcessingTime = storeEntry.startedProcessingTimestamp || new Date().toISOString();
          elapsedMinutes = Math.max(
            0,
            Math.floor((Date.now() - new Date(startedProcessingTime).getTime()) / 60000)
          );
        } else {
          status = 'WAITING';
          const idx = store.checkedInEntries.findIndex((e) => e.token === cleanToken);
          if (idx >= 0) {
            farmersAhead = idx;
            position = idx + 1;
            const waitMins = Math.max(10, farmersAhead * 22);
            estimatedWaitMinutes = waitMins;
            formattedWaitTime = `~${waitMins} min`;
          }
        }
      }
    }

    return {
      status,
      token: cleanToken,
      centreId,
      centreName: booking.centreName,
      cropName: booking.cropName,
      quantityQuintals: booking.quantityQuintals,
      position: (status === 'WAITING' || status === 'PROCESSING') ? position : null,
      farmersAhead: status === 'WAITING' ? farmersAhead : 0,
      estimatedWaitMinutes,
      formattedWaitTime,
      etaLabel,
      isBaselineEta,
      activeDelay,
      startedProcessingTime,
      elapsedMinutes,
      completedAt,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Subscribes to live telemetry updates for a specific farmer's booking.
   * Reuses the managed centre queue listener (combines Supabase Realtime + local store).
   */
  subscribeToFarmerLiveTelemetry(
    booking: ProcurementBooking,
    callback: (telemetry: FarmerLiveTelemetry) => void
  ): () => void {
    const centreId = booking.centreId;

    // Trigger immediate evaluation
    this.getFarmerLiveTelemetry(booking).then(callback);

    // Subscribe via the singleton centre queue listener
    return this.subscribeToCentreQueue(centreId, () => {
      this.getFarmerLiveTelemetry(booking).then(callback);
    });
  }
}

export const queueService = new QueueService();
