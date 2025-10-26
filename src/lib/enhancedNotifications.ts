// Enhanced Push Notification System with WebSocket & Deduplication
import { toast } from '@/hooks/use-toast';

interface TrafficUpdate {
  id: string;
  type: 'accident' | 'roadwork' | 'congestion' | 'weather';
  location: string;
  description: string;
  coordinates: { lat: number; lng: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class EnhancedNotificationService {
  private notificationCache = new Map<string, number>();
  private cacheDuration = 300000;

  async initialize() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  showNotification(update: TrafficUpdate) {
    if (this.notificationCache.has(update.id)) {
      const lastShown = this.notificationCache.get(update.id)!;
      if (Date.now() - lastShown < this.cacheDuration) return;
    }
    this.notificationCache.set(update.id, Date.now());
    
    if (Notification.permission === 'granted') {
      new Notification(`🚨 ${update.type}: ${update.location}`, {
        body: update.description,
        tag: update.id
      });
    }
    
    toast({
      title: `${update.type.toUpperCase()}`,
      description: `${update.location}: ${update.description}`
    });
  }
}

export const notificationService = new EnhancedNotificationService();
