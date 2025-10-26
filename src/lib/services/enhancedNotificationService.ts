/**
 * Enhanced Notification Service för Svenska Bro App
 * Hanterar WebSocket-baserade realtidsnotiser och push-notifikationer
 */

import { createClient } from '@supabase/supabase-js';

interface TrafficUpdate {
  id: string;
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: { lat: number; lng: number };
  timestamp: string;
}

interface NotificationDedup {
  [key: string]: number;
}

export class EnhancedNotificationService {
  private notificationCache: NotificationDedup = {};
  private cooldownWindow = 300000; // 5 minutes
  private supabase: any;
  private channel: any;

  constructor() {
    if (typeof window !== 'undefined') {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
  }

  async initialize() {
    console.log('🚀 Initializing Enhanced Notification Service...');
    
    try {
      await this.requestNotificationPermission();
      await this.setupRealtimeSubscription();
      this.setupDedupCleanup();
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  private async setupRealtimeSubscription() {
    this.channel = this.supabase
      .channel('traffic-incidents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_incidents',
        },
        (payload: any) => {
          const incident = payload.new;
          this.handleRealTimeUpdate(incident);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to traffic incidents');
        }
      });
  }

  private handleRealTimeUpdate(incident: TrafficUpdate) {
    console.log('📡 Received traffic update:', incident);

    if (this.shouldShowNotification(incident.id)) {
      this.showRichNotification(incident);
      this.markNotificationShown(incident.id);
    } else {
      console.log('⏩ Skipping duplicate notification');
    }
  }

  private shouldShowNotification(incidentId: string): boolean {
    const now = Date.now();
    const lastShown = this.notificationCache[incidentId];

    if (!lastShown) return true;
    return (now - lastShown) > this.cooldownWindow;
  }

  private markNotificationShown(incidentId: string) {
    this.notificationCache[incidentId] = Date.now();
  }

  private async showRichNotification(incident: TrafficUpdate) {
    if (Notification.permission !== 'granted') return;

    const title = `🚨 ${this.getSeverityEmoji(incident.severity)} ${incident.type}`;
    const body = `${incident.location}\n${incident.description}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icons/traffic-warning.png',
        badge: '/icons/badge.png',
        tag: incident.id,
        requireInteraction: incident.severity === 'critical',
        data: {
          incidentId: incident.id,
          coordinates: incident.coordinates,
          url: `/dashboard/map?incident=${incident.id}`,
        },
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        const data = (event.target as Notification).data;
        if (data?.url) {
          window.location.href = data.url;
        }
        notification.close();
      };

      console.log('✅ Notification shown:', incident.id);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
    }
  }

  private getSeverityEmoji(severity: string): string {
    const emojiMap: { [key: string]: string } = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };
    return emojiMap[severity] || '⚠️';
  }

  private setupDedupCleanup() {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.notificationCache).forEach(incidentId => {
        if (now - this.notificationCache[incidentId] > this.cooldownWindow) {
          delete this.notificationCache[incidentId];
        }
      });
    }, 60000);
  }

  async sendTestNotification() {
    const testIncident: TrafficUpdate = {
      id: 'test-' + Date.now(),
      type: 'Testolycka',
      location: 'Stockholm, Sverige',
      description: 'Detta är en testnotifikation',
      severity: 'medium',
      coordinates: { lat: 59.3293, lng: 18.0686 },
      timestamp: new Date().toISOString(),
    };

    this.showRichNotification(testIncident);
  }

  showInAppNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  }

  async subscribeToIncidentTypes(types: string[]) {
    localStorage.setItem('incident_subscriptions', JSON.stringify(types));
    console.log('✅ Subscribed to incident types:', types);
  }

  getSubscriptions(): string[] {
    const stored = localStorage.getItem('incident_subscriptions');
    return stored ? JSON.parse(stored) : ['all'];
  }

  clearAll() {
    this.notificationCache = {};
    console.log('✅ Cleared notification cache');
  }

  destroy() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
    this.clearAll();
    console.log('✅ Notification service destroyed');
  }
}

let notificationServiceInstance: EnhancedNotificationService | null = null;

export const getNotificationService = (): EnhancedNotificationService => {
  if (!notificationServiceInstance && typeof window !== 'undefined') {
    notificationServiceInstance = new EnhancedNotificationService();
  }
  return notificationServiceInstance!;
};
