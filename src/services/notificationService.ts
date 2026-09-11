/**
 * Notification Service - Retrieves and updates operational alerts and queue notices.
 * Prepared for clean Supabase 'notifications' table integration.
 */

import { SystemNotification } from '../types';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
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
  private notifications: SystemNotification[] = [...MOCK_NOTIFICATIONS];

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

          if (!error && data && data.length > 0) {
            return data.map(mapDbNotificationToUi);
          }
        }
      } catch (err) {
        console.warn('Supabase notifications lookup fallback', err);
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
}

export const notificationService = new NotificationService();
