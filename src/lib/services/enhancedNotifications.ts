// Enhanced Push Notification System with Deduplication
import { io, Socket } from 'socket.io-client';

interface TrafficIncident {
  id: string;
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: { lat: number; lng: number };
  timestamp: string;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: any;
}

class EnhancedNotificationService {
  private socket: Socket | null = null;
  private notificationCache: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private userId: string | null = null;
  private userLocation: { lat: number; lng: number } | null = null;
  private notificationRadius = 50; // km

  // Callbacks
  public onTrafficUpdate?: (incident: TrafficIncident) => void;
  public onNotificationClick?: (data: any) => void;

  constructor() {
    this.startCacheCleanup();
  }

  async initialize(userId: string, userLocation?: { lat: number; lng: number }) {
    this.userId = userId;
    this.userLocation = userLocation || null;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Setup WebSocket connection
    await this.setupWebSocket();

    // Setup service worker for background notifications
    await this.setupServiceWorker();

    console.log('✅ Enhanced Notification Service initialized');
  }

  private async setupWebSocket() {
    try {
      // Connect to WebSocket server for real-time traffic updates
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://your-websocket-server.com';
      
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('🚀 WebSocket connected for traffic updates');
        
        // Subscribe to traffic events in user's area
        if (this.userLocation) {
          this.socket?.emit('subscribe', {
            userId: this.userId,
            location: this.userLocation,
            radius: this.notificationRadius
          });
        }
      });

      this.socket.on('traffic-incident', (incident: TrafficIncident) => {
        this.handleTrafficIncident(incident);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        // Fallback to REST API polling
        this.startRESTPolling();
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      // Fallback to REST API polling
      this.startRESTPolling();
    }
  }

  private startRESTPolling() {
    // Fallback: Poll REST API every 30 seconds
    const pollInterval = setInterval(async () => {
      if (this.socket?.connected) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(`/api/traffic/incidents?userId=${this.userId}`);
        const incidents = await response.json();
        
        incidents.forEach((incident: TrafficIncident) => {
          this.handleTrafficIncident(incident);
        });
      } catch (error) {
        console.error('REST polling failed:', error);
      }
    }, 30000);
  }

  private handleTrafficIncident(incident: TrafficIncident) {
    // Check if notification should be shown
    if (!this.shouldShowNotification(incident.id)) {
      console.log('⏭️ Skipping duplicate notification:', incident.id);
      return;
    }

    // Check if incident is within user's notification radius
    if (this.userLocation && !this.isWithinRadius(incident.coordinates)) {
      console.log('📍 Incident outside notification radius');
      return;
    }

    // Show notification based on severity
    this.showRichNotification({
      title: this.getNotificationTitle(incident),
      body: incident.description,
      icon: this.getIconForSeverity(incident.severity),
      badge: '/icons/traffic-badge.png',
      tag: `traffic-${incident.id}`,
      requireInteraction: incident.severity === 'critical',
      actions: [
        { action: 'view-map', title: '🗺️ Visa på karta' },
        { action: 'get-route', title: '🚗 Alternativ rutt' },
        { action: 'dismiss', title: '❌ Stäng' }
      ],
      data: {
        incidentId: incident.id,
        coordinates: incident.coordinates,
        type: incident.type
      }
    });

    // Mark notification as shown
    this.markNotificationShown(incident.id);

    // Trigger callback
    this.onTrafficUpdate?.(incident);
  }

  private shouldShowNotification(incidentId: string): boolean {
    const lastShown = this.notificationCache.get(incidentId);
    
    if (!lastShown) {
      return true;
    }

    // Check if enough time has passed
    const timeSinceLastShown = Date.now() - lastShown;
    return timeSinceLastShown > this.DEDUP_WINDOW;
  }

  private markNotificationShown(incidentId: string) {
    this.notificationCache.set(incidentId, Date.now());
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const entriesToDelete: string[] = [];

      this.notificationCache.forEach((timestamp, incidentId) => {
        if (now - timestamp > this.DEDUP_WINDOW) {
          entriesToDelete.push(incidentId);
        }
      });

      entriesToDelete.forEach(id => this.notificationCache.delete(id));
      
      if (entriesToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${entriesToDelete.length} old notification entries`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  private isWithinRadius(coordinates: { lat: number; lng: number }): boolean {
    if (!this.userLocation) return true;

    const distance = this.calculateDistance(
      this.userLocation.lat,
      this.userLocation.lng,
      coordinates.lat,
      coordinates.lng
    );

    return distance <= this.notificationRadius;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async showRichNotification(options: NotificationOptions) {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Use service worker if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/notification-icon.png',
          badge: options.badge,
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          data: options.data
        });
      } else {
        // Fallback to regular notification
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/notification-icon.png',
          tag: options.tag,
          data: options.data
        });

        notification.onclick = () => {
          this.onNotificationClick?.(options.data);
          notification.close();
        };
      }

      console.log('🔔 Notification shown:', options.title);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);

        // Handle notification clicks
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'notification-click') {
            this.onNotificationClick?.(event.data.data);
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private getNotificationTitle(incident: TrafficIncident): string {
    const emoji = this.getEmojiForType(incident.type);
    const severityText = incident.severity === 'critical' ? 'KRITISK' : 
                         incident.severity === 'high' ? 'HÖG' : '';
    
    return `${emoji} ${severityText ? severityText + ': ' : ''}${incident.type} - ${incident.location}`;
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      'accident': '🚑',
      'roadwork': '🚧',
      'congestion': '🚗',
      'weather': '⛈️',
      'closure': '🚫',
      'hazard': '⚠️'
    };
    return emojiMap[type.toLowerCase()] || '🚨';
  }

  private getIconForSeverity(severity: string): string {
    const iconMap: Record<string, string> = {
      'low': '/icons/traffic-low.png',
      'medium': '/icons/traffic-medium.png',
      'high': '/icons/traffic-high.png',
      'critical': '/icons/traffic-critical.png'
    };
    return iconMap[severity] || '/icons/traffic-default.png';
  }

  // Public methods
  updateUserLocation(location: { lat: number; lng: number }) {
    this.userLocation = location;
    
    // Update subscription with new location
    if (this.socket?.connected) {
      this.socket.emit('update-location', {
        userId: this.userId,
        location,
        radius: this.notificationRadius
      });
    }
  }

  setNotificationRadius(radiusKm: number) {
    this.notificationRadius = radiusKm;
  }

  disconnect() {
    this.socket?.disconnect();
    this.notificationCache.clear();
  }

  async testNotification() {
    await this.showRichNotification({
      title: '📡 Test Notification',
      body: 'Svenska Bro App notifications are working!',
      icon: '/icons/notification-icon.png',
      tag: 'test',
      actions: [
        { action: 'ok', title: 'OK' }
      ]
    });
  }
}

export default EnhancedNotificationService;
export type { TrafficIncident, NotificationOptions };
