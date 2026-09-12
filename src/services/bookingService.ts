/**
 * SmartProcure - Booking Service
 * Handles farmer procurement slot booking, deterministic slot assignment,
 * cryptographically strong random token issuance, and Supabase database persistence.
 *
 * Interfaces with 'bookings', 'procurement_centres', 'crops', 'crop_prices',
 * 'profiles', and 'queue_events' PostgreSQL tables in Supabase.
 */

import {
  ProcurementBooking,
  IndianState,
  CropName,
  TimeSlotPreference,
  ProcurementWorkflowStatus,
} from '../types';
import {
  generateProcurementToken,
  generateOpaqueQrPayload,
  calculateEstimatedProcurementValue,
} from '../lib/utils';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { cropService } from './cropService';
import { centreService } from './centreService';
import { notificationService } from './notificationService';

/**
 * Next feasible appointment window recommendation
 */
export interface FeasibleAppointmentWindow {
  date: string; // YYYY-MM-DD e.g. "2026-09-08"
  formattedDate: string; // "8 September 2026"
  slotTime: string; // "10:00 AM – 11:00 AM"
  slotStartTime: string;
  slotEndTime: string;
  period: 'morning' | 'afternoon';
}

/**
 * Centre availability check result
 */
export interface CentreAvailabilityResult {
  isAvailable: boolean;
  capacityQuintals: number;
  bookedQuintals: number;
  remainingQuintals: number;
  operatingStatus: string;
  message: string;
  nextFeasibleSlot?: FeasibleAppointmentWindow;
}

/**
 * Standard operating slot definition
 * Operating hours:
 * Morning:   09:00 AM – 02:00 PM (14:00) -> 5 discrete 1-hour slots
 * Lunch:     02:00 PM – 03:00 PM (15:00) -> MANDATORY PAUSE; NEVER ASSIGNED
 * Afternoon: 03:00 PM – 06:00 PM (18:00) -> 3 discrete 1-hour slots
 */
export interface OperatingSlotDefinition {
  slotId: string;
  startTime: string; // '09:00:00'
  endTime: string;   // '10:00:00'
  formattedDisplay: string; // '09:00 AM – 10:00 AM'
  period: 'morning' | 'afternoon';
}

export interface AvailableSlotInfo {
  slotId: string;
  startTime: string;
  endTime: string;
  formattedDisplay: string;
  period: 'morning' | 'afternoon';
  slotCapacityQuintals: number;
  bookedQuintals: number;
  remainingQuintals: number;
  bookedFarmersCount: number;
  isAvailable: boolean;
}

export const OFFICIAL_OPERATING_SLOTS: OperatingSlotDefinition[] = [
  // Morning appointment windows (09:00 AM - 02:00 PM)
  {
    slotId: 'slot-m-1',
    startTime: '09:00:00',
    endTime: '10:00:00',
    formattedDisplay: '09:00 AM – 10:00 AM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-2',
    startTime: '10:00:00',
    endTime: '11:00:00',
    formattedDisplay: '10:00 AM – 11:00 AM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-3',
    startTime: '11:00:00',
    endTime: '12:00:00',
    formattedDisplay: '11:00 AM – 12:00 PM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-4',
    startTime: '12:00:00',
    endTime: '13:00:00',
    formattedDisplay: '12:00 PM – 01:00 PM',
    period: 'morning',
  },
  {
    slotId: 'slot-m-5',
    startTime: '13:00:00',
    endTime: '14:00:00',
    formattedDisplay: '01:00 PM – 02:00 PM',
    period: 'morning',
  },
  // LUNCH BREAK: 14:00:00 - 15:00:00 (Mandatory centre pause. Strictly NO slots assigned)
  // Afternoon appointment windows (03:00 PM - 06:00 PM)
  {
    slotId: 'slot-a-1',
    startTime: '15:00:00',
    endTime: '16:00:00',
    formattedDisplay: '03:00 PM – 04:00 PM',
    period: 'afternoon',
  },
  {
    slotId: 'slot-a-2',
    startTime: '16:00:00',
    endTime: '17:00:00',
    formattedDisplay: '04:00 PM – 05:00 PM',
    period: 'afternoon',
  },
  {
    slotId: 'slot-a-3',
    startTime: '17:00:00',
    endTime: '18:00:00',
    formattedDisplay: '05:00 PM – 06:00 PM',
    period: 'afternoon',
  },
];

export interface CreateBookingParams {
  cropId?: string;
  cropName: CropName;
  quantityQuintals: number;
  ratePerQuintal?: number;
  centreId: string;
  centreName?: string;
  bookingDate: string;
  timePreference: 'morning' | 'afternoon' | 'no_preference';
  farmerName?: string;
  farmerMobile?: string;
  farmerState?: IndianState;
  farmerDistrict?: string;
}

/**
 * Converts HH:MM:SS or HH:MM to 12-hour AM/PM display string
 */
export function formatSlotTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return '09:00 AM – 10:00 AM';

  const to12Hr = (timeStr: string): string => {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? '0' + hours : '' + hours;
    return `${strHours}:${minutes} ${ampm}`;
  };

  return `${to12Hr(startTime)} – ${to12Hr(endTime)}`;
}

function formatTimePreferenceDisplay(pref: string): string {
  switch (pref?.toLowerCase()) {
    case 'morning':
      return 'Morning (09:00 AM – 02:00 PM)';
    case 'afternoon':
      return 'Afternoon (03:00 PM – 06:00 PM)';
    default:
      return 'No Preference (09:00 AM – 06:00 PM)';
  }
}

/**
 * Maps PostgreSQL 'bookings' database row to the UI ProcurementBooking interface
 */
function mapDbBookingToUi(b: any, rateLookup?: number): ProcurementBooking {
  const rate = rateLookup || 2425;
  const quantity = Number(b.quantity) || 0;
  const estimatedValue = calculateEstimatedProcurementValue(quantity, rate);

  const assignedSlotTime =
    b.assigned_start_time && b.assigned_end_time
      ? formatSlotTime(b.assigned_start_time, b.assigned_end_time)
      : '09:00 AM – 10:00 AM';

  return {
    id: b.id,
    token: b.token,
    opaqueQrIdentifier: b.qr_identifier || generateOpaqueQrPayload(b.id, b.token),
    farmerId: b.farmer_id,
    farmerName: b.profiles?.full_name || 'Farmer',
    farmerMobile: b.profiles?.mobile || '',
    farmerState: (b.procurement_centres?.state || b.profiles?.state || 'Punjab') as IndianState,
    farmerDistrict: b.procurement_centres?.district || b.profiles?.district || '',
    centreId: b.centre_id,
    centreName: b.procurement_centres?.name || 'Procurement Centre',
    cropId: b.crop_id,
    cropName: (b.crops?.name || 'Wheat') as CropName,
    quantityQuintals: quantity,
    ratePerQuintal: rate,
    estimatedValue,
    bookingDate: b.assigned_date || b.preferred_date,
    preferredTimeSlot: formatTimePreferenceDisplay(b.preferred_time_preference),
    assignedSlotTime,
    assignedDate: b.assigned_date || b.preferred_date,
    assignedStartTime: b.assigned_start_time || '09:00:00',
    assignedEndTime: b.assigned_end_time || '10:00:00',
    workflowStatus: (b.booking_status?.toUpperCase() || 'BOOKED') as ProcurementWorkflowStatus,
    // Real queue metrics start at 0 / neutral until physical gate check-in
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    estimatedArrivalTime: 'Assigned upon check-in',
    delayMinutes: 0,
    isLunchBreakCrossed: false,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

class BookingService {
  // In-memory cache for optimistic updates and testing, backed by localStorage
  private localBookings: ProcurementBooking[] = [];

  constructor() {
    this.initLocalBookings();
  }

  private initLocalBookings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('smartprocure_farmer_bookings');
        if (stored) {
          this.localBookings = JSON.parse(stored);
        }
      }
    } catch {
      this.localBookings = [];
    }
  }

  private persistLocalBookings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('smartprocure_farmer_bookings', JSON.stringify(this.localBookings));
      }
    } catch {
      /* non-blocking */
    }
  }

  /**
   * Generates a cryptographically strong, non-sequential 6-character token
   * and verifies uniqueness against the 'bookings' table in Supabase.
   * Example: "SP7K4Q", "A9X2LM"
   */
  async generateUniqueToken(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = generateProcurementToken();

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('token')
            .eq('token', candidate)
            .maybeSingle();

          if (!error && !data) {
            return candidate;
          }
        } catch (err) {
          console.warn('Error checking token collision in Supabase:', err);
          return candidate;
        }
      } else {
        const collision = this.localBookings.some((b) => b.token === candidate);
        if (!collision) return candidate;
      }
    }
    return generateProcurementToken();
  }

  /**
   * Calculates slot load and determines slot availability for a centre on a given date.
   * Deterministic rule-based slot calculations.
   */
  async getAvailableSlots(
    centreId: string,
    bookingDate: string,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference',
    requestedQuantity: number = 0
  ): Promise<AvailableSlotInfo[]> {
    // 1. Fetch real centre capacity from centreService or Supabase
    const centre = await centreService.getCentreById(centreId);
    const dailyCapacity = centre ? Number(centre.capacityPerDayQuintals) || 3000 : 3000;

    // 8 operating hours total -> slot target capacity per 1-hour window
    const slotCapacity = Math.max(100, Math.floor(dailyCapacity / OFFICIAL_OPERATING_SLOTS.length));

    // 2. Query all existing active bookings on this date for this centre
    const slotBookedQuintals: Record<string, number> = {};
    const slotBookedCount: Record<string, number> = {};
    let totalDayBooked = 0;

    OFFICIAL_OPERATING_SLOTS.forEach((s) => {
      slotBookedQuintals[s.startTime] = 0;
      slotBookedCount[s.startTime] = 0;
    });

    if (isSupabaseConfigured()) {
      try {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('quantity, assigned_start_time, preferred_date, assigned_date')
          .eq('centre_id', centreId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress']);

        if (bookingsData && bookingsData.length > 0) {
          bookingsData.forEach((b) => {
            const qty = Number(b.quantity) || 0;
            totalDayBooked += qty;
            const startTime = b.assigned_start_time ? b.assigned_start_time.substring(0, 8) : null;
            if (startTime && slotBookedQuintals[startTime] !== undefined) {
              slotBookedQuintals[startTime] += qty;
              slotBookedCount[startTime] += 1;
            } else {
              slotBookedQuintals['09:00:00'] += qty;
              slotBookedCount['09:00:00'] += 1;
            }
          });
        }
      } catch (err) {
        console.warn('Existing bookings slot load query error:', err);
      }
    }

    // Include local active bookings if any
    this.localBookings
      .filter(
        (b) =>
          b.centreId === centreId &&
          b.bookingDate === bookingDate &&
          b.workflowStatus !== 'CANCELLED' &&
          b.workflowStatus !== 'REJECTED'
      )
      .forEach((b) => {
        const qty = Number(b.quantityQuintals) || 0;
        const startTime = b.assignedStartTime ? b.assignedStartTime.substring(0, 8) : '09:00:00';
        if (slotBookedQuintals[startTime] !== undefined) {
          slotBookedQuintals[startTime] += qty;
          slotBookedCount[startTime] += 1;
        }
        totalDayBooked += qty;
      });

    const dayRemaining = Math.max(0, dailyCapacity - totalDayBooked);

    // 3. Build AvailableSlotInfo list
    const results: AvailableSlotInfo[] = OFFICIAL_OPERATING_SLOTS.map((slot) => {
      const booked = slotBookedQuintals[slot.startTime] || 0;
      const count = slotBookedCount[slot.startTime] || 0;
      const remaining = Math.max(0, slotCapacity - booked);
      // Available if slot has remaining quota OR if the daily capacity as a whole can accommodate the requested load
      const isAvailable = dayRemaining > 0 && (requestedQuantity <= 0 || requestedQuantity <= dayRemaining);

      return {
        slotId: slot.slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        formattedDisplay: slot.formattedDisplay,
        period: slot.period,
        slotCapacityQuintals: slotCapacity,
        bookedQuintals: booked,
        remainingQuintals: remaining,
        bookedFarmersCount: count,
        isAvailable,
      };
    });

    if (timePreference === 'morning') {
      return results.filter((s) => s.period === 'morning');
    }
    if (timePreference === 'afternoon') {
      return results.filter((s) => s.period === 'afternoon');
    }
    return results;
  }

  /**
   * Deterministic slot-assignment algorithm
   * Selects an available procurement slot based on:
   * 1. Centre operating hours (09:00 - 18:00, strictly excluding 14:00 - 15:00 lunch)
   * 2. Farmer's time preference ('morning', 'afternoon', or 'no_preference')
   * 3. Current booked load across slots
   * 4. Slot capacity
   */
  async findDeterministicSlot(
    centreId: string,
    bookingDate: string,
    timePreference: 'morning' | 'afternoon' | 'no_preference',
    requestedQuantity: number
  ): Promise<OperatingSlotDefinition> {
    const slots = await this.getAvailableSlots(centreId, bookingDate, timePreference, requestedQuantity);

    const availableSlots = slots.filter((s) => s.isAvailable);

    if (availableSlots.length === 0) {
      const prefLabel =
        timePreference === 'morning'
          ? 'Morning (09:00 AM – 02:00 PM)'
          : timePreference === 'afternoon'
          ? 'Afternoon (03:00 PM – 06:00 PM)'
          : 'the entire day';
      throw new Error(
        `No available procurement slots found for ${bookingDate} during ${prefLabel}. All slots have reached capacity. Please select another date or preference.`
      );
    }

    // Deterministic selection:
    // 1. Primary sort: lowest booked quintals (load balancing across mandi staff)
    // 2. Secondary sort: earliest slot time (tie breaker)
    availableSlots.sort((a, b) => {
      if (a.bookedQuintals !== b.bookedQuintals) {
        return a.bookedQuintals - b.bookedQuintals;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    const chosen = availableSlots[0];
    const match = OFFICIAL_OPERATING_SLOTS.find((s) => s.startTime === chosen.startTime);
    if (!match) {
      return OFFICIAL_OPERATING_SLOTS[0];
    }
    return match;
  }

  /**
   * Scans upcoming dates to discover the next realistically feasible appointment window.
   * Probes +1, +2, up to +14 days ahead until finding an available slot with sufficient capacity.
   */
  async findNextFeasibleAppointmentWindow(
    centreId: string,
    fromDate: string,
    requestedQuantity: number = 0,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference'
  ): Promise<FeasibleAppointmentWindow | undefined> {
    const startDate = new Date(fromDate);
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const nextDateObj = new Date(startDate);
      nextDateObj.setDate(startDate.getDate() + dayOffset);
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      try {
        const slots = await this.getAvailableSlots(centreId, nextDateStr, timePreference, requestedQuantity);
        const availableSlot = slots.find((s) => s.isAvailable);
        if (availableSlot) {
          const formattedDate = nextDateObj.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return {
            date: nextDateStr,
            formattedDate,
            slotTime: availableSlot.formattedDisplay,
            slotStartTime: availableSlot.startTime,
            slotEndTime: availableSlot.endTime,
            period: availableSlot.period,
          };
        }
      } catch {
        /* continue probing next day */
      }
    }
    return undefined;
  }

  /**
   * Checks real centre capacity and slot availability for a given date.
   */
  async checkCentreAvailability(
    centreId: string,
    bookingDate: string,
    requestedQuantity: number = 0,
    timePreference: 'morning' | 'afternoon' | 'no_preference' = 'no_preference'
  ): Promise<CentreAvailabilityResult> {
    if (!centreId || !bookingDate) {
      return {
        isAvailable: false,
        capacityQuintals: 0,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus: 'UNKNOWN',
        message: 'Invalid centre or date selected.',
      };
    }

    // 1. Resolve centre details and daily intake capacity
    const centre = await centreService.getCentreById(centreId);
    if (!centre) {
      return {
        isAvailable: false,
        capacityQuintals: 0,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus: 'UNKNOWN',
        message: 'Procurement centre not found.',
      };
    }

    const capacity = Number(centre.capacityPerDayQuintals) || 3000;
    const operatingStatus = centre.status || 'OPEN';

    if ((operatingStatus as string) === 'CLOSED' || (operatingStatus as string) === 'MAINTENANCE') {
      const nextFeasibleSlot = await this.findNextFeasibleAppointmentWindow(
        centreId,
        bookingDate,
        requestedQuantity,
        timePreference
      );
      return {
        isAvailable: false,
        capacityQuintals: capacity,
        bookedQuintals: 0,
        remainingQuintals: 0,
        operatingStatus,
        message: 'Centre is currently closed for maintenance or intake suspension.',
        nextFeasibleSlot,
      };
    }

    // 2. Sum quantity from VALID bookings for this centre and date
    let totalBooked = 0;

    if (isSupabaseConfigured()) {
      try {
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('quantity')
          .eq('centre_id', centreId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress']);

        if (!bookingsErr && bookingsData) {
          totalBooked = bookingsData.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
        }
      } catch (err) {
        console.warn('Booking availability query error:', err);
      }
    }

    // Add any active in-memory bookings
    this.localBookings
      .filter(
        (b) =>
          b.centreId === centreId &&
          b.bookingDate === bookingDate &&
          b.workflowStatus !== 'CANCELLED' &&
          b.workflowStatus !== 'REJECTED'
      )
      .forEach((b) => {
        totalBooked += Number(b.quantityQuintals) || 0;
      });

    // 3. Compute remaining daily capacity
    const remaining = Math.max(0, capacity - totalBooked);
    const dayHasRoom = remaining > 0 && (requestedQuantity <= 0 || requestedQuantity <= remaining);

    if (!dayHasRoom) {
      const nextFeasibleSlot = await this.findNextFeasibleAppointmentWindow(
        centreId,
        bookingDate,
        requestedQuantity,
        timePreference
      );
      return {
        isAvailable: false,
        capacityQuintals: capacity,
        bookedQuintals: totalBooked,
        remainingQuintals: remaining,
        operatingStatus,
        message:
          requestedQuantity > remaining
            ? `Declared lot (${requestedQuantity} Q) exceeds remaining daily capacity (${remaining} Q).`
            : `${bookingDate} is currently at capacity (${capacity} Q booked).`,
        nextFeasibleSlot,
      };
    }

    return {
      isAvailable: true,
      capacityQuintals: capacity,
      bookedQuintals: totalBooked,
      remainingQuintals: remaining,
      operatingStatus,
      message: `Slots available (${remaining.toLocaleString()} Q remaining capacity)`,
    };
  }

  /**
   * Checks if the farmer already has an active booking that conflicts with the selected date.
   */
  async checkFarmerBookingConflict(
    farmerId: string,
    bookingDate: string
  ): Promise<{ hasConflict: boolean; conflictingToken?: string }> {
    if (!farmerId || !bookingDate) return { hasConflict: false };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, token, preferred_date, assigned_date')
          .eq('farmer_id', farmerId)
          .or(`preferred_date.eq.${bookingDate},assigned_date.eq.${bookingDate}`)
          .in('booking_status', ['booked', 'confirmed', 'in_progress'])
          .maybeSingle();

        if (!error && data) {
          return { hasConflict: true, conflictingToken: data.token };
        }
      } catch (err) {
        console.warn('Error checking booking conflict:', err);
      }
    }

    return { hasConflict: false };
  }

  /**
   * Retrieves the authenticated farmer's currently active booking directly from Supabase.
   * Supabase database is the sole authoritative source of truth.
   * Returns null if no active booking exists (clean empty state).
   */
  async getActiveBooking(): Promise<ProcurementBooking | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        return null;
      }

      let { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
          crops (id, name, hindi_name),
          profiles (id, full_name, mobile, state, district)
        `)
        .eq('farmer_id', user.id)
        .in('booking_status', ['booked', 'confirmed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Supabase active booking query notice:', error);
      }

      // If no pending or in_progress booking exists, check for today's completed booking
      if (!data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: completedRow } = await supabase
          .from('bookings')
          .select(`
            *,
            procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
            crops (id, name, hindi_name),
            profiles (id, full_name, mobile, state, district)
          `)
          .eq('farmer_id', user.id)
          .eq('booking_status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (completedRow) {
          const rowUpdated = completedRow.updated_at ? completedRow.updated_at.split('T')[0] : '';
          const rowCreated = completedRow.created_at ? completedRow.created_at.split('T')[0] : '';
          const rowAssigned = completedRow.assigned_date || '';
          if (rowUpdated === todayStr || rowCreated === todayStr || rowAssigned === todayStr) {
            data = completedRow;
          }
        }
      }

      if (!data) {
        return null;
      }

      let rate = 2425;
      try {
        rate = await cropService.getCropPriceByState(
          (data.crops?.name || 'Wheat') as CropName,
          (data.procurement_centres?.state || 'Punjab') as IndianState
        );
      } catch {
        /* ignore rate lookup */
      }
      return mapDbBookingToUi(data, rate);
    } catch (err) {
      console.warn('Active booking query exception:', err);
      return null;
    }
  }

  /**
   * Alias for getActiveBooking
   */
  async getCurrentBooking(): Promise<ProcurementBooking | null> {
    return this.getActiveBooking();
  }

  /**
   * Retrieves all historical and current bookings for the authenticated farmer from Supabase.
   */
  async getMyBookings(): Promise<ProcurementBooking[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          procurement_centres (id, name, state, district),
          crops (id, name, hindi_name),
          profiles (id, full_name, mobile)
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase booking history query error:', error);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((item) => mapDbBookingToUi(item));
      }
      return [];
    } catch (err) {
      console.warn('Booking history query exception:', err);
      return [];
    }
  }

  /**
   * Alias for getMyBookings
   */
  async getBookingHistory(): Promise<ProcurementBooking[]> {
    return this.getMyBookings();
  }

  /**
   * Cancel an active booking in Supabase. Requires a successful database operation.
   */
  async cancelBooking(tokenOrId: string): Promise<boolean> {
    const clean = tokenOrId.trim().toUpperCase();
    if (!isSupabaseConfigured()) {
      throw new Error('Database service is not configured.');
    }

    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'cancelled' })
      .or(`token.eq.${clean},id.eq.${tokenOrId}`);

    if (error) {
      throw new Error(`Failed to cancel booking in database: ${error.message}`);
    }

    return true;
  }

  /**
   * Looks up a booking by its 6-character token in Supabase.
   * Token validity is verified exclusively against public.bookings.
   */
  async getBookingByToken(token: string): Promise<ProcurementBooking | null> {
    const cleanToken = token.trim().toUpperCase();
    if (!cleanToken || cleanToken.length !== 6) return null;

    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          procurement_centres (id, name, state, district, capacity_per_day_quintals, operating_status),
          crops (id, name, hindi_name),
          profiles (id, full_name, mobile, state, district)
        `)
        .eq('token', cleanToken)
        .maybeSingle();

      if (!error && data) {
        return mapDbBookingToUi(data);
      }
      return null;
    } catch (err) {
      console.warn('Error fetching booking by token from Supabase:', err);
      return null;
    }
  }

  /**
   * Creates a real procurement booking in Supabase.
   *
   * 1. Validates farmer authentication.
   * 2. Validates crop, quantity, and date.
   * 3. Validates centre availability.
   * 4. Enforces no conflicting bookings on the same date.
   * 5. Runs deterministic slot assignment (Morning: 09-14, Afternoon: 15-18; Lunch: 14-15 excluded).
   * 6. Generates unique 6-character random token.
   * 7. Creates database record in 'bookings' linked to authenticated farmer.
   * 8. Records 'booking_created' in 'queue_events'.
   */
  async createBooking(params: CreateBookingParams): Promise<ProcurementBooking> {
    // 1. Validate farmer authentication strictly via Supabase Auth
    if (!isSupabaseConfigured()) {
      throw new Error('Database service is not configured. Please ensure Supabase credentials are set.');
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      throw new Error('Please log in with your verified farmer account to book a procurement slot.');
    }

    const currentUserId = user.id;
    const authUserEmail = user.email || null;

    // 2. Validate declared quantity
    if (!params.quantityQuintals || params.quantityQuintals <= 0) {
      throw new Error('Declared harvest quantity must be greater than zero quintals.');
    }
    if (params.quantityQuintals > 500) {
      throw new Error('Declared quantity exceeds single-lot limit of 500 Quintals.');
    }

    // 3. Validate booking date
    const today = new Date().toISOString().split('T')[0];
    if (params.bookingDate < today) {
      throw new Error('Preferred procurement date cannot be in the past.');
    }

    // 4. Validate time preference
    const validPrefs = ['morning', 'afternoon', 'no_preference'];
    const timePref: TimeSlotPreference = validPrefs.includes(params.timePreference)
      ? (params.timePreference as TimeSlotPreference)
      : 'no_preference';

    // 5. Verify centre exists & check capacity availability
    const availability = await this.checkCentreAvailability(
      params.centreId,
      params.bookingDate,
      params.quantityQuintals,
      timePref
    );
    if (!availability.isAvailable) {
      throw new Error(availability.message || 'Slots are currently full for this centre and date.');
    }

    // 6. Verify no conflicting active booking for this farmer on this date
    const conflict = await this.checkFarmerBookingConflict(currentUserId, params.bookingDate);
    if (conflict.hasConflict) {
      throw new Error(
        `You already hold an active procurement booking on ${params.bookingDate} (Token: ${conflict.conflictingToken}). Multiple bookings on the same date are not permitted.`
      );
    }

    // 7. Deterministic Slot Assignment:
    // Calculates assigned_date, assigned_start_time, and assigned_end_time based on load
    const assignedSlot = await this.findDeterministicSlot(
      params.centreId,
      params.bookingDate,
      timePref,
      params.quantityQuintals
    );

    // 8. Resolve crop ID and verify existence in public.crops table
    let resolvedCropId = params.cropId;
    if (!resolvedCropId || !resolvedCropId.includes('-')) {
      try {
        const { data: matchedCrop } = await supabase
          .from('crops')
          .select('id, name')
          .ilike('name', params.cropName)
          .maybeSingle();

        if (matchedCrop) {
          resolvedCropId = matchedCrop.id;
        }
      } catch (err) {
        console.warn('Crop lookup error:', err);
      }
    }

    if (!resolvedCropId) {
      throw new Error(
        `The selected crop "${params.cropName}" is not registered in the database. Please select an active crop.`
      );
    }

    // Verify crop exists in public.crops
    const { data: verifiedCrop, error: cropCheckErr } = await supabase
      .from('crops')
      .select('id, name')
      .eq('id', resolvedCropId)
      .maybeSingle();

    if (cropCheckErr) {
      throw new Error(`Failed to verify crop in database: ${cropCheckErr.message}`);
    }

    if (!verifiedCrop) {
      throw new Error(
        `The selected crop is not registered in the database. Please select a registered crop.`
      );
    }

    // Verify centre exists in public.procurement_centres immediately before booking
    if (!params.centreId) {
      throw new Error('Please select a valid registered procurement centre.');
    }

    const { data: verifiedCentre, error: centreCheckErr } = await supabase
      .from('procurement_centres')
      .select('id, name')
      .eq('id', params.centreId)
      .maybeSingle();

    if (centreCheckErr) {
      throw new Error(`Failed to verify procurement centre in database: ${centreCheckErr.message}`);
    }

    if (!verifiedCentre) {
      throw new Error(
        'The selected procurement centre does not exist in the database. Please select a registered procurement centre.'
      );
    }

    // 9. Generate unique random 6-character token & opaque QR identifier
    const token = await this.generateUniqueToken();
    const tempId = 'book-' + Math.random().toString(36).substring(2, 9);
    const opaqueQrIdentifier = generateOpaqueQrPayload(tempId, token);

    const rate = params.ratePerQuintal || 2425;

    // 10. Persist booking into Supabase (Authoritative database source of truth)
    // Verify farmer profile exists in public.profiles for authenticated user's UUID
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, state, district')
      .eq('id', currentUserId)
      .maybeSingle();

    if (profileCheckError) {
      throw new Error(`Failed to verify farmer profile in database: ${profileCheckError.message}`);
    }

    if (!existingProfile) {
      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: currentUserId,
            full_name: params.farmerName || authUserEmail?.split('@')[0] || 'Farmer',
            email: authUserEmail || 'farmer@smartprocure.gov.in',
            mobile: params.farmerMobile || null,
            state: params.farmerState || 'Punjab',
            district: params.farmerDistrict || 'Ludhiana',
            preferred_language: 'en',
          },
          { onConflict: 'id' }
        );

      if (profileUpsertError) {
        throw new Error(`Failed to create farmer profile in database: ${profileUpsertError.message}`);
      }
    }

    // Insert record into public.bookings - decoupled from complex relational joins
    // so RLS evaluation on related tables cannot break the primary booking insert
    const { data: insertedBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        farmer_id: currentUserId,
        centre_id: params.centreId,
        crop_id: resolvedCropId,
        quantity: params.quantityQuintals,
        preferred_date: params.bookingDate,
        preferred_time_preference: timePref,
        assigned_date: params.bookingDate,
        assigned_start_time: assignedSlot.startTime,
        assigned_end_time: assignedSlot.endTime,
        token,
        qr_identifier: opaqueQrIdentifier,
        booking_status: 'booked',
      })
      .select()
      .single();

    let persistedRecord = insertedBooking;

    if (insertError) {
      // Check for uniqueness constraint violation on duplicate booking date (code 23505)
      if (insertError.code === '23505' && insertError.message?.includes('preferred_date')) {
        throw new Error(
          `You already have an active procurement booking on ${params.bookingDate}. Duplicate bookings on the same date are not allowed.`
        );
      }

      // Check for uniqueness constraint violation on token (code 23505)
      if (insertError.code === '23505') {
        // Retry once with fresh unique token
        const retryToken = await this.generateUniqueToken();
        const retryQr = generateOpaqueQrPayload(tempId, retryToken);
        const { data: retryData, error: retryErr } = await supabase
          .from('bookings')
          .insert({
            farmer_id: currentUserId,
            centre_id: params.centreId,
            crop_id: resolvedCropId,
            quantity: params.quantityQuintals,
            preferred_date: params.bookingDate,
            preferred_time_preference: timePref,
            assigned_date: params.bookingDate,
            assigned_start_time: assignedSlot.startTime,
            assigned_end_time: assignedSlot.endTime,
            token: retryToken,
            qr_identifier: retryQr,
            booking_status: 'booked',
          })
          .select()
          .single();

        if (retryErr) {
          throw new Error(`Booking creation failed: ${retryErr.message}`);
        }
        persistedRecord = retryData;
      } else {
        throw new Error(`Booking creation failed: ${insertError.message}`);
      }
    }

    if (!persistedRecord) {
      throw new Error('Booking could not be created in the database.');
    }

    // Now fetch related centre/crop/profile data separately only if SELECT policies permit it.
    // If a related entity query fails under RLS, the booking itself remains fully persisted and successful.
    let centreData = null;
    try {
      const { data: c } = await supabase
        .from('procurement_centres')
        .select('id, name, state, district')
        .eq('id', params.centreId)
        .maybeSingle();
      if (c) centreData = c;
    } catch {
      /* non-blocking */
    }

    let cropData = null;
    try {
      const { data: cr } = await supabase
        .from('crops')
        .select('id, name, hindi_name')
        .eq('id', resolvedCropId)
        .maybeSingle();
      if (cr) cropData = cr;
    } catch {
      /* non-blocking */
    }

    let profileData = null;
    try {
      const { data: pr } = await supabase
        .from('profiles')
        .select('id, full_name, mobile, state, district')
        .eq('id', currentUserId)
        .maybeSingle();
      if (pr) profileData = pr;
    } catch {
      /* non-blocking */
    }

    const completeRecord = {
      ...persistedRecord,
      procurement_centres: centreData || {
        id: params.centreId,
        name: params.centreName || 'Procurement Centre',
        state: params.farmerState || 'Punjab',
        district: params.farmerDistrict || '',
      },
      crops: cropData || {
        id: resolvedCropId,
        name: params.cropName || 'Wheat',
        hindi_name: '',
      },
      profiles: profileData || {
        id: currentUserId,
        full_name: params.farmerName || 'Farmer',
        mobile: params.farmerMobile || '',
      },
    };

    // Record initial booking_created in queue_events
    try {
      await supabase.from('queue_events').insert({
        booking_id: persistedRecord.id,
        centre_id: params.centreId,
        event_type: 'booking_created',
        notes: `Slot scheduled by farmer. Token: ${persistedRecord.token}. Assigned: ${assignedSlot.formattedDisplay}`,
        created_by: currentUserId,
      });
    } catch {
      /* non-blocking audit trail */
    }

    // Create persistent in-app notification for the farmer
    try {
      const centreName = (completeRecord.procurement_centres as any)?.name || params.centreName || 'Procurement Centre';
      await notificationService.createNotification({
        farmerId: currentUserId,
        bookingId: persistedRecord.id,
        type: 'booking',
        title: 'Procurement Slot Booked',
        message: `Your procurement slot has been confirmed for ${params.quantityQuintals} Quintal ${params.cropName || 'harvest'} at ${centreName}.\nToken: ${persistedRecord.token}\nScheduled: ${assignedSlot.formattedDisplay}`,
      });
    } catch (notifErr) {
      console.warn('[BookingService] Failed to create booking notification:', notifErr);
    }

    return mapDbBookingToUi(completeRecord, rate);
  }
}

export const bookingService = new BookingService();
