import type { User, Job, Bridge, Contact, Deviation, Document } from "@/types";

// ============================================================================
// Helper Functions
// ============================================================================

const isServer = typeof window === "undefined";

function getItem<T>(key: string, defaultValue: T): T {
  if (isServer) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

// CRITICAL FIX: Add storage cleanup utility
export const cleanupStorage = () => {
  try {
    // Remove large cache objects that aren't critical
    const keysToClean = [
      'weather_cache',
      'bridge_addresses_cache', 
      'trafikverket_all_situations_v2',
      'traffic_cache_',
      'bridge_traffic_cache_'
    ];
    
    let cleanedCount = 0;
    
    for (const key of keysToClean) {
      // If it's a prefix, remove all keys starting with it
      if (key.endsWith('_')) {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(key)) {
            localStorage.removeItem(storageKey);
            cleanedCount++;
          }
        }
      } else {
        // Remove exact key match
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    
    console.log(`🧹 Cleaned ${cleanedCount} cache items from localStorage`);
    return cleanedCount;
  } catch (error) {
    console.error("Failed to cleanup storage:", error);
    return 0;
  }
};

// CRITICAL FIX: Add storage size check utility
export const getStorageSize = (): { used: number; available: number; percentUsed: number } => {
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    
    // Most browsers limit localStorage to ~5-10MB (5242880 bytes = 5MB)
    const estimatedLimit = 5242880;
    const percentUsed = (totalSize / estimatedLimit) * 100;
    
    return {
      used: totalSize,
      available: estimatedLimit - totalSize,
      percentUsed: Math.min(percentUsed, 100)
    };
  } catch (error) {
    console.error("Failed to calculate storage size:", error);
    return { used: 0, available: 0, percentUsed: 0 };
  }
};

// CRITICAL FIX: Add warning when saving jobs if storage is near capacity
function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("⚠️ localStorage quota exceeded! Cleaning up old cache...");
      
      // Try to cleanup old cache and retry
      const cleanedCount = cleanupStorage();
      
      if (cleanedCount > 0) {
        try {
          localStorage.setItem(key, value);
          console.log("✅ Successfully saved after cleanup");
        } catch (retryError) {
          console.error("❌ Still failed after cleanup:", retryError);
          throw new Error("localStorage is full even after cleanup. Cannot save data.");
        }
      } else {
        throw new Error("localStorage is full and cleanup found nothing to remove.");
      }
    } else {
      throw error;
    }
  }
}

// ============================================================================
// Main Storage Object
// ============================================================================

export const storage = {
  // User Management
  getUser: (): User | null => getItem<User | null>("svenska_bro_user", null),
  saveUser: (user: User): void => setItem("svenska_bro_user", JSON.stringify(user)),
  clearUser: (): void => !isServer && localStorage.removeItem("svenska_bro_user"),

  // Last Activity
  getLastActivity: (): { bridgeId: string; bridgeName: string; date: string } | null => 
    getItem("lastActivity", null),
  setLastActivity: (activity: { bridgeId: string; bridgeName: string; date: string }): void => 
    setItem("lastActivity", JSON.stringify(activity)),
  
  // Jobs (Online/Normal usage)
  getJobs: (): Job[] => getItem<Job[]>("jobs", []),
  saveJobs: (jobs: Job[]) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentJobs = jobs.filter(job => {
        if (!job.start_tid) return true;
        const jobDate = new Date(job.start_tid);
        return jobDate >= thirtyDaysAgo;
      });
      
      console.log(`💾 Saving ${recentJobs.length}/${jobs.length} recent jobs to localStorage`);
      setItem("jobs", JSON.stringify(recentJobs));
    } catch (error) {
      console.error("Failed to save jobs:", error);
      throw error;
    }
  },
  saveJob: (job: Job): void => {
    const jobs = storage.getJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    if (index > -1) {
      jobs[index] = job;
    } else {
      jobs.unshift(job);
    }
    storage.saveJobs(jobs);
  },

  // Bridges
  getBridges: (): Bridge[] => getItem<Bridge[]>("bridges", []),
  saveBridges: (bridges: Bridge[]): void => setItem("bridges", JSON.stringify(bridges)),

  // Contacts
  getContacts: (): Contact[] => getItem<Contact[]>("contacts", []),
  saveContacts: (contacts: Contact[]): void => setItem("contacts", JSON.stringify(contacts)),

  // Deviations
  getDeviations: (): Deviation[] => getItem<Deviation[]>("deviations", []),
  saveDeviations: (deviations: Deviation[]): void => setItem("deviations", JSON.stringify(deviations)),

  // Documents
  getDocuments: (): Document[] => getItem<Document[]>("documents", []),
  saveDocuments: (documents: Document[]): void => setItem("documents", JSON.stringify(documents)),

  // Language
  getLanguage: (): "sv" | "en" => getItem<"sv" | "en">("language", "sv"),
  setLanguage: (lang: "sv" | "en"): void => setItem("language", lang),

  // Theme
  getTheme: (): "light" | "dark" => getItem<"light" | "dark">("theme", "dark"),
  setTheme: (theme: "light" | "dark"): void => setItem("theme", theme),

  // Offline Jobs Queue
  getOfflineJobs: (): Job[] => getItem<Job[]>("offline_jobs", []),
  saveOfflineJob: async (job: Job): Promise<void> => {
    const jobs = await storage.getOfflineJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    if (index > -1) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    setItem("offline_jobs", JSON.stringify(jobs));
  },
  removeOfflineJob: async (jobId: string): Promise<void> => {
    let jobs = await storage.getOfflineJobs();
    jobs = jobs.filter(j => j.id !== jobId);
    setItem("offline_jobs", JSON.stringify(jobs));
  },
  clearOfflineJobs: (): void => setItem("offline_jobs", JSON.stringify([])),
  
  // Offline Deviations Queue
  getOfflineDeviations: (): Deviation[] => getItem<Deviation[]>("offline_deviations", []),
  saveOfflineDeviation: async (deviation: Deviation): Promise<void> => {
    const deviations = await storage.getOfflineDeviations();
    const index = deviations.findIndex(d => d.id === deviation.id);
    if (index > -1) {
      deviations[index] = deviation;
    } else {
      deviations.push(deviation);
    }
    setItem("offline_deviations", JSON.stringify(deviations));
  },
  removeOfflineDeviation: async (deviationId: string): Promise<void> => {
    let deviations = await storage.getOfflineDeviations();
    deviations = deviations.filter(d => d.id !== deviationId);
    setItem("offline_deviations", JSON.stringify(deviations));
  },

  // Clear all data (for logout)
  clearAll: (): void => {
    if (isServer) return;
    storage.clearUser();
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("jobs");
    localStorage.removeItem("bridges");
    localStorage.removeItem("contacts");
    localStorage.removeItem("deviations");
    localStorage.removeItem("documents");
    localStorage.removeItem("offline_jobs");
    localStorage.removeItem("offline_deviations");
    localStorage.removeItem("traffic_notification_settings");
    sessionStorage.clear(); // Clear session-specific data like encryption keys
    console.log("All local and session storage cleared.");
  },

  // CRITICAL FIX: Export cleanup utilities
  cleanupStorage,
  getStorageSize,
};
