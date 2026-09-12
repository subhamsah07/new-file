/**
 * Notification Service - Retrieves and updates operational alerts and queue notices.
 * Prepared for clean Supabase 'notifications' table integration.
 */

import { SystemNotification } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function mapDbNotificationToUi(n: any): SystemNotification {
  let type: any = 'GENERAL_ADVISORY';
  if (n.type === 'delay') type = 'DELAY_ALERT';
  else if (n.type === 'queue' || n.type === 'booking') type = 'ETA_UPDATE';
  else if (n.type === 'payment') type = 'PAYMENT_CREDIT';
  else if (n.type === 'procurement') type = 'STATUS_CHANGE';

  return {
    id: n.id,
    recipientId: n.farmer_id,
    title: n.title,
    message: n.message,
    type,
    isRead: Boolean(n.read),
    createdAt: n.created_at,
  };
}

class NotificationService {
  private notifications: SystemNotification[] = [];
  private listeners: Set<(notif?: SystemNotification) => void> = new Set();
  private channel: any = null;

  async getNotifications(): Promise<SystemNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('farmer_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map(mapDbNotificationToUi);
          }
        }
      } catch (err) {
        console.warn('Supabase notifications lookup error:', err);
      }
    }
    return [...this.notifications];
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.isRead = true;
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('Supabase mark read fallback', err);
      }
    }
  }

  /**
   * Creates a persistent notification for a farmer.
   * Enforces idempotency via (farmer_id, booking_id, title) to prevent duplicate notifications.
   */
  async createNotification(params: {
    farmerId: string;
    bookingId?: string;
    type: 'booking' | 'queue' | 'delay' | 'procurement' | 'payment' | 'system';
    title: string;
    message: string;
  }): Promise<SystemNotification | null> {
    if (isSupabaseConfigured()) {
      try {
        // Idempotency check: avoid inserting duplicate completion notification
        if (params.bookingId) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('*')
            .eq('farmer_id', params.farmerId)
            .eq('booking_id', params.bookingId)
            .eq('title', params.title)
            .maybeSingle();

          if (existing) {
            console.info(`[NotificationService] Notification "${params.title}" already exists for booking ${params.bookingId}. Idempotency preserved.`);
            return mapDbNotificationToUi(existing);
          }
        }

        const { data, error } = await supabase
          .from('notifications')
          .insert({
            farmer_id: params.farmerId,
            booking_id: params.bookingId || null,
            type: params.type,
            title: params.title,
            message: params.message,
            read: false,
          })
          .select()
          .single();

        if (error) {
          console.error('[NotificationService] Failed to insert notification in Supabase:', error);
        } else if (data) {
          const newUiNotif = mapDbNotificationToUi(data);
          this.notifications.unshift(newUiNotif);
          return newUiNotif;
        }
      } catch (err) {
        console.warn('[NotificationService] Error creating notification:', err);
      }
    }

    // Local fallback
    const localNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientId: params.farmerId,
      title: params.title,
      message: params.message,
      type: params.type === 'procurement' ? 'STATUS_CHANGE' : 'GENERAL_ADVISORY',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(localNotif);
    return localNotif;
  }

  /**
   * Subscribes to real-time notification events in Supabase.
   * Centralized subscriber manager to avoid duplicate channel creation and
   * "cannot add postgres_changes callbacks after subscribe()" errors.
   */
  subscribeToNotifications(onNotification: (notif?: SystemNotification) => void): () => void {
    this.listeners.add(onNotification);

    if (!this.channel && isSupabaseConfigured()) {
      const channelId = `notifications-channel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      this.channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const notif = payload.new ? mapDbNotificationToUi(payload.new) : undefined;
            this.listeners.forEach((listener) => {
              try {
                listener(notif);
              } catch (err) {
                console.warn('[NotificationService] Error executing notification listener:', err);
              }
            });
          }
        )
        .subscribe();
    }

    return () => {
      this.listeners.delete(onNotification);
      if (this.listeners.size === 0 && this.channel) {
        try {
          supabase.removeChannel(this.channel);
        } catch {
          // noop
        }
        this.channel = null;
      }
    };
  }
}

export const notificationService = new NotificationService();
