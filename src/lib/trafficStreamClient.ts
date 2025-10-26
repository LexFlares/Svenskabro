/**
 * Traffic Stream Client - SSE-based real-time notifications
 * Connects to /api/trafikverket/stream for push-based traffic updates
 */

export interface TrafficStreamConfig {
  userId: string;
  onNewSituation: (situation: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class TrafficStreamClient {
  private eventSource: EventSource | null = null;
  private config: TrafficStreamConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionalClose = false;
  private connectionError: string | null = null;

  public start(config: TrafficStreamConfig): void {
    this.config = config;
    this.isIntentionalClose = false;
    this.connect();
  }

  public stop(): void {
    console.log("🛑 Stopping traffic stream...");
    this.isIntentionalClose = true;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.config = null;
    this.reconnectAttempts = 0;
  }

  public getConnectionError(): string | null {
    return this.connectionError;
  }

  private connect(): void {
    if (!this.config) {
      console.error("❌ Cannot connect: No config provided");
      this.connectionError = "No configuration provided";
      return;
    }

    try {
      const streamUrl = `/api/trafikverket/stream?userId=${this.config.userId}`;
      console.log("🔌 Connecting to SSE traffic stream:", streamUrl);
      
      this.connectionError = null;
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        console.log("✅ SSE Connected to traffic stream");
        this.reconnectAttempts = 0;
        this.connectionError = null;
        
        if (this.config?.onConnect) {
          this.config.onConnect();
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log("📨 SSE Received message:", data.type);

          if (data.type === "connected") {
            console.log("✅ SSE Stream connection confirmed");
          } else if (data.type === "new_situation") {
            console.log("🚨 NEW TRAFFIC SITUATION via SSE:", data.situation?.Deviation?.[0]?.Header);
            
            if (this.config?.onNewSituation) {
              this.config.onNewSituation(data.situation);
            }
          } else if (data.type === "heartbeat") {
            console.log("💓 SSE Heartbeat received");
          } else if (data.type === "error") {
            console.error("❌ SSE Stream error:", data.message);
            this.connectionError = data.message;
            
            if (this.config?.onError) {
              this.config.onError(new Error(data.message));
            }
          }
        } catch (error) {
          console.error("❌ Failed to parse SSE stream message:", error);
          this.connectionError = "Failed to parse message";
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("❌ SSE Stream error:", error);
        this.connectionError = "Stream connection failed";
        
        if (this.config?.onError) {
          this.config.onError(new Error(this.connectionError));
        }

        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        if (this.config?.onDisconnect) {
          this.config.onDisconnect();
        }

        // Attempt reconnection
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
          
          console.log(`🔄 SSE Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
          
          setTimeout(() => {
            if (!this.isIntentionalClose && this.config) {
              this.connect();
            }
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("❌ SSE Max reconnection attempts reached");
          this.connectionError = "Failed to reconnect after multiple attempts";
          
          if (this.config?.onError) {
            this.config.onError(new Error(this.connectionError));
          }
        }
      };
    } catch (error) {
      console.error("❌ Failed to create SSE EventSource:", error);
      this.connectionError = (error as Error).message;
      
      if (this.config?.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  public isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  public getConnectionState(): string {
    if (!this.eventSource) return "DISCONNECTED";
    
    const stateMap = {
      [EventSource.CONNECTING]: "CONNECTING",
      [EventSource.OPEN]: "CONNECTED",
      [EventSource.CLOSED]: "CLOSED"
    };
    
    return stateMap[this.eventSource.readyState] || "UNKNOWN";
  }
}

export const trafficStreamClient = new TrafficStreamClient();
