import { supabase } from "@/integrations/supabase/client";
import { openDB } from "idb";
import type { Job, Deviation, Json } from "@/types";

const DB_NAME = "bro-app-offline-db";
const JOB_STORE = "jobs";
const DEVIATION_STORE = "deviations";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(JOB_STORE)) {
        db.createObjectStore(JOB_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DEVIATION_STORE)) {
        db.createObjectStore(DEVIATION_STORE, { keyPath: "id" });
      }
    },
  });
}

export const offlineSync = {
  async saveJobForSync(job: Job) {
    const db = await getDB();
    await db.put(JOB_STORE, { ...job, synced: false });
  },

  async saveDeviationForSync(deviation: Deviation) {
    const db = await getDB();
    await db.put(DEVIATION_STORE, { ...deviation, synced: false });
  },

  async getOfflineJobs(): Promise<Job[]> {
    const db = await getDB();
    return db.getAll(JOB_STORE);
  },

  async getOfflineDeviations(): Promise<Deviation[]> {
    const db = await getDB();
    return db.getAll(DEVIATION_STORE);
  },

  async syncOfflineData() {
    console.log("Starting offline data sync...");
    const syncedJobs = await this.syncJobs();
    const syncedDeviations = await this.syncDeviations();
    console.log(`Sync complete. Jobs: ${syncedJobs}, Deviations: ${syncedDeviations}`);
    return { syncedJobs, syncedDeviations };
  },

  async syncJobs() {
    const db = await getDB();
    const offlineJobs = await db.getAll(JOB_STORE);
    const unsyncedJobs = offlineJobs.filter(job => !job.synced);
    
    if (unsyncedJobs.length === 0) {
      console.log("No jobs to sync.");
      return 0;
    }

    console.log(`Syncing ${unsyncedJobs.length} jobs...`);

    const { data, error } = await supabase.from("jobb").upsert(
      unsyncedJobs.map(job => ({
        id: job.id,
        bro_id: job.bro_id,
        ansvarig_anvandare: job.ansvarig_anvandare,
        start_tid: job.start_tid,
        slut_tid: job.slut_tid,
        tidsatgang: job.tidsatgang,
        material: job.material,
        anteckningar: job.anteckningar,
        status: job.status,
        bilder: job.bilder,
        gps: job.gps,
        weather_data: job.weather_data,
        updated_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error("Error syncing jobs:", error);
      return 0;
    }

    // Mark as synced locally
    const tx = db.transaction(JOB_STORE, "readwrite");
    for (const job of unsyncedJobs) {
      tx.store.put({ ...job, synced: true });
    }
    await tx.done;

    return unsyncedJobs.length;
  },

  async syncDeviations() {
    const db = await getDB();
    const offlineDeviations = await db.getAll(DEVIATION_STORE);
    const unsyncedDeviations = offlineDeviations.filter(dev => !dev.synced);

    if (unsyncedDeviations.length === 0) {
      console.log("No deviations to sync.");
      return 0;
    }

    console.log(`Syncing ${unsyncedDeviations.length} deviations...`);
    
    const deviationsToUpsert = unsyncedDeviations.map(deviation => ({
        id: deviation.id,
        user_id: deviation.user_id,
        bridge_id: deviation.bridge_id,
        type: deviation.type,
        description: deviation.description,
        proposal: deviation.proposal,
        status: deviation.status,
        photos: deviation.photos as Json,
        created_at: deviation.created_at,
        updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("deviations")
      .upsert(deviationsToUpsert);

    if (error) {
      console.error("Error syncing deviations:", error);
      return 0;
    }

    // Mark as synced locally
    const tx = db.transaction(DEVIATION_STORE, "readwrite");
    for (const deviation of unsyncedDeviations) {
      tx.store.put({ ...deviation, synced: true });
    }
    await tx.done;

    return unsyncedDeviations.length;
  },

  async clearOfflineData() {
    const db = await getDB();
    await db.clear(JOB_STORE);
    await db.clear(DEVIATION_STORE);
    console.log("Offline data cleared.");
  },

  async getUnsyncedCount() {
    const db = await getDB();
    const unsyncedJobs = (await db.getAll(JOB_STORE)).filter(j => !j.synced).length;
    const unsyncedDeviations = (await db.getAll(DEVIATION_STORE)).filter(d => !d.synced).length;
    return unsyncedJobs + unsyncedDeviations;
  },
};
