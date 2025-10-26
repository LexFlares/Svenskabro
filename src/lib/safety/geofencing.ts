import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/pwa/hapticFeedback';

export interface GeoFence {
  id: string;
  name: string;
  center: { lat: number; lon: number };
  radius: number;
  type: 'danger' | 'restricted' | 'work' | 'safety';
  alertMessage: string;
  active: boolean;
  createdAt: Date;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  userId: string;
}

export class GeofencingService {
  private fences: Map<string, GeoFence> = new Map();
  private watchId: number | null = null;
  private currentLocation: LocationUpdate | null = null;
  private alertedFences: Set<string> = new Set();
  private onEnterCallback?: (fence: GeoFence) => void;
  private onExitCallback?: (fence: GeoFence) => void;

  async initialize(userId: string) {
    await this.loadFences();
    this.startTracking(userId);
    console.log('✅ Geofencing initialized with', this.fences.size, 'fences');
  }

  private async loadFences() {
    const { data: fencesData } = await supabase
      .from('geofences')
      .select('*')
      .eq('active', true);

    if (fencesData) {
      fencesData.forEach((fence: any) => {
        this.fences.set(fence.id, {
          id: fence.id,
          name: fence.name,
          center: { lat: fence.lat, lon: fence.lon },
          radius: fence.radius,
          type: fence.type,
          alertMessage: fence.alert_message,
          active: fence.active,
          createdAt: new Date(fence.created_at)
        });
      });
    }

    const defaultFences = this.createDefaultDangerZones();
    defaultFences.forEach(fence => {
      if (!this.fences.has(fence.id)) {
        this.fences.set(fence.id, fence);
      }
    });
  }

  private createDefaultDangerZones(): GeoFence[] {
    return [
      {
        id: 'danger_traffic_1',
        name: 'Trafikerad väg',
        center: { lat: 59.3293, lon: 18.0686 },
        radius: 50,
        type: 'danger',
        alertMessage: 'VARNING: Du närmar dig trafikerad väg. Använd varningsväst och säkerhetsutrustning.',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'danger_height_1',
        name: 'Höjdarbete',
        center: { lat: 59.3293, lon: 18.0686 },
        radius: 30,
        type: 'danger',
        alertMessage: 'VARNING: Höjdarbetszon. Säkerhetssele och fallskydd krävs.',
        active: true,
        createdAt: new Date()
      }
    ];
  }

  private startTracking(userId: string) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not available');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationUpdate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          userId
        };

        this.currentLocation = location;
        this.checkFences(location);
        this.broadcastLocation(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    console.log('📍 Location tracking started');
  }

  private checkFences(location: LocationUpdate) {
    const currentlyInside = new Set<string>();

    this.fences.forEach((fence, fenceId) => {
      if (!fence.active) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        fence.center.lat,
        fence.center.lon
      );

      const isInside = distance <= fence.radius;

      if (isInside) {
        currentlyInside.add(fenceId);

        if (!this.alertedFences.has(fenceId)) {
          this.triggerEnterAlert(fence);
          this.alertedFences.add(fenceId);

          if (this.onEnterCallback) {
            this.onEnterCallback(fence);
          }
        }
      }
    });

    this.alertedFences.forEach(fenceId => {
      if (!currentlyInside.has(fenceId)) {
        const fence = this.fences.get(fenceId);
        if (fence) {
          this.triggerExitAlert(fence);

          if (this.onExitCallback) {
            this.onExitCallback(fence);
          }
        }
        this.alertedFences.delete(fenceId);
      }
    });
  }

  private triggerEnterAlert(fence: GeoFence) {
    console.warn('⚠️ Entered geofence:', fence.name);

    hapticFeedback.playCriticalAlert();

    if (Notification.permission === 'granted') {
      new Notification(`⚠️ ${fence.name}`, {
        body: fence.alertMessage,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        tag: `geofence_${fence.id}`
      });
    }

    if ('speechSynthesis' in window && fence.type === 'danger') {
      const utterance = new SpeechSynthesisUtterance(fence.alertMessage);
      utterance.lang = 'sv-SE';
      utterance.rate = 1.2;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    this.logFenceEvent(fence.id, 'enter');
  }

  private triggerExitAlert(fence: GeoFence) {
    console.log('✅ Exited geofence:', fence.name);
    hapticFeedback.success();
    this.logFenceEvent(fence.id, 'exit');
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async createFence(fence: Omit<GeoFence, 'id' | 'createdAt'>): Promise<string> {
    const id = `fence_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newFence: GeoFence = {
      ...fence,
      id,
      createdAt: new Date()
    };

    this.fences.set(id, newFence);

    await supabase
      .from('geofences')
      .insert({
        id,
        name: fence.name,
        lat: fence.center.lat,
        lon: fence.center.lon,
        radius: fence.radius,
        type: fence.type,
        alert_message: fence.alertMessage,
        active: fence.active
      });

    console.log('✅ Created geofence:', fence.name);
    return id;
  }

  async removeFence(fenceId: string): Promise<void> {
    this.fences.delete(fenceId);
    this.alertedFences.delete(fenceId);

    await supabase
      .from('geofences')
      .delete()
      .eq('id', fenceId);

    console.log('🗑️ Removed geofence:', fenceId);
  }

  async toggleFence(fenceId: string, active: boolean): Promise<void> {
    const fence = this.fences.get(fenceId);
    if (fence) {
      fence.active = active;

      await supabase
        .from('geofences')
        .update({ active })
        .eq('id', fenceId);
    }
  }

  onEnter(callback: (fence: GeoFence) => void) {
    this.onEnterCallback = callback;
  }

  onExit(callback: (fence: GeoFence) => void) {
    this.onExitCallback = callback;
  }

  getCurrentLocation(): LocationUpdate | null {
    return this.currentLocation;
  }

  getFences(): GeoFence[] {
    return Array.from(this.fences.values());
  }

  getActiveFences(): GeoFence[] {
    return Array.from(this.fences.values()).filter(f => f.active);
  }

  getAlertedFences(): GeoFence[] {
    return Array.from(this.alertedFences)
      .map(id => this.fences.get(id))
      .filter((f): f is GeoFence => f !== undefined);
  }

  private async broadcastLocation(location: LocationUpdate) {
    await supabase
      .from('user_presence')
      .upsert({
        user_id: location.userId,
        last_seen: location.timestamp.toISOString(),
        online: true,
        updated_at: location.timestamp.toISOString()
      });
  }

  private async logFenceEvent(fenceId: string, eventType: 'enter' | 'exit') {
    await supabase
      .from('geofence_events')
      .insert({
        fence_id: fenceId,
        event_type: eventType,
        user_id: this.currentLocation?.userId,
        timestamp: new Date().toISOString()
      });
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('🛑 Location tracking stopped');
    }
  }

  destroy() {
    this.stop();
    this.fences.clear();
    this.alertedFences.clear();
    this.currentLocation = null;
  }
}

export const geofencing = new GeofencingService();
