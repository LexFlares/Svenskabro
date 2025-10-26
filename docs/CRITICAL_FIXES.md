# KRITISKA FIXAR OCH FÖRBÄTTRINGAR

## 🔴 Högsta Prioritet

### 1. WebRTC-samtal - Stabilitet och Felhantering
**Problem:**
- Peer connection kan tappa koppling vid nätverksbyten
- ICE candidates samlas inte in korrekt
- Ingen automatisk återanslutning vid disconnect

**Lösning:**
```typescript
// Lägg till i webRTCService.ts
private handleConnectionStateChange() {
  if (this.peer) {
    this.peer.on('connectionstatechange', (state) => {
      console.log('Connection state:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        // Försök återansluta
        this.reconnectCall();
      }
    });
  }
}

private async reconnectCall() {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    // Skapa ny peer connection
    await this.initiatePeerConnection();
  } else {
    this.onError?.(new Error('Max reconnect attempts reached'));
    this.endCall();
  }
}
```

### 2. Push-notifikationer - Deduplicering och Rich Actions
**Problem:**
- Samma trafikhändelse kan trigga flera notiser
- Notiser saknar åtgärdsknappar
- Ingen throttling för notis-spam

**Lösning:**
```typescript
// Skapa ny fil: src/lib/notificationDeduplication.ts
export class NotificationDeduplicator {
  private recentNotifications = new Map<string, number>();
  private readonly COOLDOWN_MS = 300000; // 5 minuter

  shouldShowNotification(incidentId: string): boolean {
    const lastShown = this.recentNotifications.get(incidentId);
    const now = Date.now();

    if (lastShown && (now - lastShown) < this.COOLDOWN_MS) {
      return false; // Skip duplicate
    }

    this.recentNotifications.set(incidentId, now);
    this.cleanupOldEntries();
    return true;
  }

  private cleanupOldEntries() {
    const now = Date.now();
    for (const [id, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.COOLDOWN_MS) {
        this.recentNotifications.delete(id);
      }
    }
  }
}
```

### 3. WebSocket-anslutning för Realtidsuppdateringar
**Problem:**
- REST API polling är ineffektivt
- Fördröjda trafikuppdateringar
- Ingen persistent connection

**Lösning:**
```typescript
// Uppdatera trafikverketService.ts
export class TrafficWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  connect(onMessage: (data: TrafficIncident) => void) {
    this.ws = new WebSocket('wss://api.trafikinfo.trafikverket.se/ws');

    this.ws.onopen = () => {
      console.log('🟢 WebSocket connected');
      this.startHeartbeat();
      this.subscribeToTrafficUpdates();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'traffic_update') {
        onMessage(data.payload);
      }
    };

    this.ws.onclose = () => {
      console.log('🔴 WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(onMessage), this.reconnectInterval);
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30s
  }
}
```

### 4. Kartfunktion - Offline-stöd och Klusterering
**Problem:**
- Ingen offline-cache av kartdata
- Många markers renderas individuellt (performance)
- Saknar geofencing för notiser

**Lösning:**
```typescript
// Skapa ny fil: src/lib/mapClustering.ts
import { MarkerClusterer } from '@googlemaps/markerclusterer';

export class TrafficMapManager {
  private map: google.maps.Map;
  private clusterer: MarkerClusterer;
  private offlineCache: Map<string, CachedIncident> = new Map();

  initializeMap(element: HTMLElement) {
    this.map = new google.maps.Map(element, {
      center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
      zoom: 8,
      styles: [], // Custom style
    });

    // Initialisera marker clusterer
    this.clusterer = new MarkerClusterer({ map: this.map });
  }

  addIncidents(incidents: TrafficIncident[]) {
    const markers = incidents.map(incident => {
      // Cache för offline
      this.cacheIncident(incident);

      return new google.maps.Marker({
        position: { 
          lat: incident.coordinates.lat, 
          lng: incident.coordinates.lng 
        },
        title: incident.title,
        icon: this.getIconForSeverity(incident.severity),
      });
    });

    // Lägg till markers i clusterer för performance
    this.clusterer.addMarkers(markers);
  }

  private cacheIncident(incident: TrafficIncident) {
    this.offlineCache.set(incident.id, {
      ...incident,
      cachedAt: Date.now(),
    });

    // Spara i localStorage för offline access
    localStorage.setItem(
      'cached_incidents',
      JSON.stringify(Array.from(this.offlineCache.values()))
    );
  }

  loadOfflineCache(): TrafficIncident[] {
    const cached = localStorage.getItem('cached_incidents');
    return cached ? JSON.parse(cached) : [];
  }
}
```

## 🟡 Medelhög Prioritet

### 5. Chatt - Gruppfunktioner och Fildelning
**Nuvarande status:** Grundläggande 1-on-1 chatt fungerar
**Saknas:**
- Gruppchatt-UI
- Filuppladdning och preview
- Typing indicators
- Read receipts

### 6. Samtal - Inkommande notiser
**Problem:**
- IncomingCallNotification renderas inte alltid
- Ringtone spelas inte upp korrekt
- Missed calls loggas inte

### 7. Performance-optimeringar
**Implementera:**
- React.memo för tungt renderade komponenter
- useMemo för dyra beräkningar
- Code splitting för stora sidor
- Image lazy loading

## ✅ Redan Implementerat (Enligt analys)
- Supabase Realtime för chat messages
- WebRTC med SimplePeer
- Basic notification system
- Traffic data från Trafikverket API
- Database schema för calls och messaging

## 🚀 Nästa Steg
1. Fixa WebRTC reconnection logic
2. Implementera notification deduplication
3. Lägg till WebSocket för traffic updates
4. Optimera kartan med clustering
5. Förbättra error handling överallt
6. Lägg till comprehensive logging
7. Skriv integration tests
