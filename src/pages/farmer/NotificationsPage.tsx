import * as React from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { notificationService } from '../../services/notificationService';
import { SystemNotification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = React.useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const items = await notificationService.getNotifications();
      setNotifications(items || []);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();

    const unsubscribe = notificationService.subscribeToNotifications(() => {
      fetchNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) {
        notificationService.markAsRead(n.id);
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Operational Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Arrival updates, weighbridge speed advisories, and procurement completion notices
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5 text-xs">
          <Check className="h-3.5 w-3.5" />
          <span>Mark all as read</span>
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const isWarning = n.type === 'DELAY_ALERT' || (n as any).type === 'DELAY' || (n as any).type === 'LUNCH_BREAK';
          const isSuccess = n.type === 'PAYMENT_CREDIT' || (n as any).type === 'PAYMENT' || n.title.includes('Completed');

          return (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                !n.isRead
                  ? 'bg-white border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : isSuccess
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                      {!n.isRead && (
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line">{n.message}</p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0">{n.createdAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
