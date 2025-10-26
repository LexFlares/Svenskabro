import type { TrafikverketSituation } from "@/types";

const TRAFIKVERKET_API_KEY = "a3733860138e455c9b0f3af5da10c109";
const TRAFIKVERKET_STREAMING_URL = "wss://api.trafikinfo.trafikverket.se/v2/data.json";

export interface StreamingConfig {
  objectTypes: string[];
  schemaVersion?: string;
  onMessage: (situation: TrafikverketSituation) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class TrafikverketStreamingService {
  private ws: WebSocket | null = null;
  private config: StreamingConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private isIntentionalClose = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastMessageTime: number = Date.now();
  private connectionQuality: "excellent" | "good" | "poor" | "disconnected" = "disconnected";
  private messageBuffer: TrafikverketSituation[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private connectionError: string | null = null;

  public start(config: StreamingConfig): void {
    this.config = config;
    this.isIntentionalClose = false;
    this.connectionQuality = "disconnected";
    this.connect();
  }

  public stop(): void {
    console.log("🛑 Stopping Trafikverket streaming...");
    this.isIntentionalClose = true;
    this.connectionQuality = "disconnected";
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
    
    this.flushMessageBuffer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.config = null;
    this.reconnectAttempts = 0;
    this.messageBuffer = [];
  }

  private connect(): void {
    if (!this.config) {
      console.error("❌ Cannot connect: No config provided");
      this.connectionError = "No configuration provided";
      return;
    }

    try {
      console.log("🔌 Connecting to Trafikverket streaming API...");
      console.log("📍 WebSocket URL:", TRAFIKVERKET_STREAMING_URL);
      console.log("🔑 API Key present:", !!TRAFIKVERKET_API_KEY);
      console.log("🔑 API Key (masked):", TRAFIKVERKET_API_KEY ? `${TRAFIKVERKET_API_KEY.substring(0, 8)}...` : "MISSING");
      
      this.connectionError = null;
      this.ws = new WebSocket(TRAFIKVERKET_STREAMING_URL);

      this.ws.onopen = () => {
        console.log("✅ Connected to Trafikverket streaming API");
        console.log("📡 Connection established successfully");
        this.reconnectAttempts = 0;
        this.lastMessageTime = Date.now();
        this.connectionQuality = "excellent";
        this.connectionError = null;
        this.subscribe();
        this.startHeartbeat();
        this.startBufferFlushing();
        
        if (this.config?.onConnect) {
          this.config.onConnect();
        }
      };

      this.ws.onmessage = (event) => {
        console.log("📨 Received message from Trafikverket");
        this.lastMessageTime = Date.now();
        this.updateConnectionQuality();
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        console.error("🔍 Error details:", {
          type: error.type,
          timeStamp: error.timeStamp,
          target: error.target
        });
        
        this.connectionQuality = "poor";
        this.connectionError = "WebSocket connection failed - possible network or API key issue";
        
        if (this.config?.onError) {
          this.config.onError(new Error(this.connectionError));
        }
      };

      this.ws.onclose = (event) => {
        console.log("🔌 Disconnected from Trafikverket streaming API");
        console.log("🔍 Close event details:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        this.connectionQuality = "disconnected";
        
        if (event.code === 1006) {
          this.connectionError = "Connection failed abnormally - check network or API key";
        } else if (event.code === 1008) {
          this.connectionError = "Connection rejected - invalid API key or policy violation";
        } else if (event.code === 1011) {
          this.connectionError = "Server error - Trafikverket API issue";
        } else if (event.reason) {
          this.connectionError = event.reason;
        }
        
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        
        if (this.bufferFlushInterval) {
          clearInterval(this.bufferFlushInterval);
          this.bufferFlushInterval = null;
        }
        
        if (this.config?.onDisconnect) {
          this.config.onDisconnect();
        }

        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
          console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
          
          setTimeout(() => {
            if (!this.isIntentionalClose) {
              this.connect();
            }
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("❌ Max reconnection attempts reached");
          if (this.config?.onError) {
            this.config.onError(new Error("Failed to reconnect after multiple attempts"));
          }
        }
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      this.connectionQuality = "disconnected";
      if (this.config?.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) {
      console.error("❌ Cannot subscribe: WebSocket not ready");
      console.error("🔍 WebSocket state:", this.ws?.readyState);
      return;
    }

    const subscriptionRequest = {
      REQUEST: {
        LOGIN: {
          authenticationkey: TRAFIKVERKET_API_KEY
        },
        QUERY: this.config.objectTypes.map(objectType => ({
          objecttype: objectType,
          schemaversion: this.config?.schemaVersion || "1.5",
          limit: 100
        }))
      }
    };

    console.log("📡 Subscribing to Trafikverket data streams:", this.config.objectTypes);
    console.log("📦 Subscription request:", JSON.stringify(subscriptionRequest, null, 2));
    
    try {
      this.ws.send(JSON.stringify(subscriptionRequest));
      console.log("✅ Subscription request sent");
    } catch (error) {
      console.error("❌ Failed to send subscription request:", error);
      if (this.config?.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;
      
      if (timeSinceLastMessage > 60000 && this.ws?.readyState === WebSocket.OPEN) {
        console.warn("⚠️ No messages received for 60 seconds, checking connection...");
        this.connectionQuality = "poor";
        
        if (timeSinceLastMessage > 120000) {
          console.error("❌ Connection appears dead, reconnecting...");
          this.ws?.close();
        }
      } else if (timeSinceLastMessage < 30000) {
        this.connectionQuality = "excellent";
      } else if (timeSinceLastMessage < 60000) {
        this.connectionQuality = "good";
      }
    }, 10000);
  }

  private startBufferFlushing(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    this.bufferFlushInterval = setInterval(() => {
      this.flushMessageBuffer();
    }, 2000);
  }

  private flushMessageBuffer(): void {
    if (this.messageBuffer.length === 0 || !this.config?.onMessage) return;

    const uniqueSituations = new Map<string, TrafikverketSituation>();
    
    this.messageBuffer.forEach(situation => {
      const id = situation.Deviation[0]?.Id || situation.Deviation[0]?.CreationTime;
      if (id) {
        uniqueSituations.set(id, situation);
      }
    });

    uniqueSituations.forEach(situation => {
      this.config!.onMessage(situation);
    });

    this.messageBuffer = [];
  }

  private updateConnectionQuality(): void {
    const timeSinceLastMessage = Date.now() - this.lastMessageTime;
    
    if (timeSinceLastMessage < 5000) {
      this.connectionQuality = "excellent";
    } else if (timeSinceLastMessage < 15000) {
      this.connectionQuality = "good";
    } else if (timeSinceLastMessage < 60000) {
      this.connectionQuality = "poor";
    } else {
      this.connectionQuality = "disconnected";
    }
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);
      console.log("📥 Parsed message:", {
        hasResponse: !!parsed.RESPONSE,
        hasResult: !!parsed.RESPONSE?.RESULT,
        resultCount: parsed.RESPONSE?.RESULT?.length || 0
      });

      if (parsed.RESPONSE?.RESULT?.[0]?.INFO?.MESSAGE === "QUERY_SUCCESSFUL") {
        console.log("✅ Subscription successful");
        return;
      }

      // Check for errors in response
      if (parsed.RESPONSE?.RESULT?.[0]?.ERROR) {
        console.error("❌ API Error:", parsed.RESPONSE.RESULT[0].ERROR);
        if (this.config?.onError) {
          this.config.onError(new Error(`API Error: ${JSON.stringify(parsed.RESPONSE.RESULT[0].ERROR)}`));
        }
        return;
      }

      if (parsed.RESPONSE?.RESULT?.[0]?.Situation) {
        const situations = parsed.RESPONSE.RESULT[0].Situation as TrafikverketSituation[];
        console.log(`📊 Received ${situations.length} situations`);
        
        situations.forEach(situation => {
          if (situation && situation.Deviation && situation.Deviation.length > 0) {
            this.messageBuffer.push(situation);
          }
        });

        if (this.messageBuffer.length > 50) {
          console.log("🔄 Buffer full, flushing messages");
          this.flushMessageBuffer();
        }
      }
    } catch (error) {
      console.error("❌ Failed to parse streaming message:", error);
      console.error("📄 Raw message:", data.substring(0, 200) + "...");
      if (this.config?.onError) {
        this.config.onError(new Error("Failed to parse message"));
      }
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return "DISCONNECTED";
    
    const stateMap = {
      [WebSocket.CONNECTING]: "CONNECTING",
      [WebSocket.OPEN]: "CONNECTED",
      [WebSocket.CLOSING]: "CLOSING",
      [WebSocket.CLOSED]: "CLOSED"
    };
    
    return stateMap[this.ws.readyState] || "UNKNOWN";
  }

  public getConnectionQuality(): "excellent" | "good" | "poor" | "disconnected" {
    return this.connectionQuality;
  }

  public getConnectionError(): string | null {
    return this.connectionError;
  }

  public getStats(): {
    reconnectAttempts: number;
    lastMessageTime: number;
    connectionQuality: string;
    isConnected: boolean;
    bufferedMessages: number;
    connectionError: string | null;
  } {
    return {
      reconnectAttempts: this.reconnectAttempts,
      lastMessageTime: this.lastMessageTime,
      connectionQuality: this.connectionQuality,
      isConnected: this.isConnected(),
      bufferedMessages: this.messageBuffer.length,
      connectionError: this.connectionError
    };
  }

  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    console.log("🧪 Testing Trafikverket API connection...");
    
    // Test 1: Check API key
    if (!TRAFIKVERKET_API_KEY || TRAFIKVERKET_API_KEY === "a3733860138e455c9b0f3af5da10c109") {
      return {
        success: false,
        message: "Using default API key - may have rate limits or restrictions",
        details: { apiKey: "default" }
      };
    }
    
    // Test 2: Try REST API first
    try {
      const response = await fetch("https://api.trafikinfo.trafikverket.se/v2/data.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          REQUEST: {
            LOGIN: { authenticationkey: TRAFIKVERKET_API_KEY },
            QUERY: [{
              objecttype: "Situation",
              schemaversion: "1.5",
              limit: 1
            }]
          }
        })
      });
      
      const data = await response.json();
      
      if (data.RESPONSE?.RESULT?.[0]?.ERROR) {
        return {
          success: false,
          message: "API Error: " + JSON.stringify(data.RESPONSE.RESULT[0].ERROR),
          details: data.RESPONSE.RESULT[0].ERROR
        };
      }
      
      if (data.RESPONSE?.RESULT?.[0]?.Situation) {
        return {
          success: true,
          message: `REST API working! Found ${data.RESPONSE.RESULT[0].Situation.length} situations`,
          details: { situationCount: data.RESPONSE.RESULT[0].Situation.length }
        };
      }
      
      return {
        success: false,
        message: "Unexpected API response format",
        details: data
      };
      
    } catch (error) {
      return {
        success: false,
        message: "Failed to connect to REST API: " + (error as Error).message,
        details: { error: (error as Error).message }
      };
    }
  }
}

export const trafikverketStreaming = new TrafikverketStreamingService();
