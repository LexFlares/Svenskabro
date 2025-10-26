import { useState, useEffect } from "react";

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class NetworkMonitor {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = { isOnline: navigator.onLine };
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private initialize() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", this.handleConnectionChange);
    }

    this.startPeriodicCheck();
    this.updateStatus();
  }

  private startPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.updateStatus();
    }, 30000);
  }

  private handleOnline = () => {
    console.log("🌐 Network online");
    this.updateStatus();
  };

  private handleOffline = () => {
    console.log("📴 Network offline");
    this.updateStatus();
  };

  private handleConnectionChange = () => {
    console.log("🔄 Network connection changed");
    this.updateStatus();
  };

  private updateStatus() {
    const connection = (navigator as any).connection;
    
    this.currentStatus = {
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error("Error in network listener:", error);
      }
    });
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  public getConnectionQuality(): "excellent" | "good" | "poor" | "offline" {
    if (!this.currentStatus.isOnline) return "offline";

    const effectiveType = this.currentStatus.effectiveType;
    if (effectiveType === "4g") return "excellent";
    if (effectiveType === "3g") return "good";
    return "poor";
  }

  public destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);

      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener("change", this.handleConnectionChange);
      }
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => networkMonitor.getStatus());

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status.isOnline;
}
