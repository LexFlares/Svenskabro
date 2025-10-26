import { toast } from '@/hooks/use-toast';

interface TrafficAlert {
  id: string;
  type: string;
  location: string;
  description: string;
  severity: string;
}

export class EnhancedNotificationService {
  private cache = new Map<string, number>();

  async initialize() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  showTrafficAlert(alert: TrafficAlert) {
    if (this.cache.has(alert.id)) {
      const last = this.cache.get(alert.id)!;
      if (Date.now() - last < 300000) return;
    }
    this.cache.set(alert.id, Date.now());

    if (Notification.permission === 'granted') {
      new Notification(`${alert.type}: ${alert.location}`, {
        body: alert.description,
        tag: alert.id
      });
    }

    toast({
      title: alert.type,
      description: `${alert.location}: ${alert.description}`
    });
  }
}

export const notificationService = new EnhancedNotificationService();
