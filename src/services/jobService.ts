import { supabase } from "@/integrations/supabase/client";
import type { Job, JobInsert, JobUpdate } from "@/types";
import { offlineSync } from "@/lib/offlineSync";

export const jobService = {
  // Create a new job
  async createJob(jobData: Omit<JobInsert, 'id' | 'created_at' | 'updated_at' | 'synced' | 'status'>): Promise<Job> {
    const { data, error } = await supabase
      .from("jobb")
      .insert({
        ...jobData,
        status: 'pågående' // Default status
      })
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .single();

    if (error) {
      console.error("Error creating job:", error);
      // Fallback to offline storage
      const offlineJob = { ...jobData, id: `offline_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: 'pågående', synced: false } as Job;
      await offlineSync.saveJobForSync(offlineJob);
      throw new Error(`Failed to create job online, saved offline. Error: ${error.message}`);
    }
    
    return data as any;
  },

  // Get all jobs with bridge and user names
  async getAllJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .order("start_tid", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      throw new Error(error.message);
    }

    return data as any[];
  },

  // Get a single job by ID
  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job by ID:", error);
      return null;
    }

    return data as any;
  },

  // Update a job
  async updateJob(id: string, updates: JobUpdate): Promise<Job> {
    const { data, error } = await supabase
      .from("jobb")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .single();

    if (error) {
      console.error("Error updating job:", error);
      // Fallback to offline storage
      const currentJob = await this.getJobById(id);
      if (currentJob) {
        const updatedOfflineJob = { ...currentJob, ...updates, synced: false } as Job;
        await offlineSync.saveJobForSync(updatedOfflineJob);
      }
      throw new Error(`Failed to update job online, saved offline. Error: ${error.message}`);
    }
    
    return data as any;
  },

  // Delete a job
  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase.from("jobb").delete().eq("id", id);

    if (error) {
      console.error("Error deleting job:", error);
      throw new Error(error.message);
    }
  },

  // Get jobs for a specific bridge
  async getJobsForBridge(bridgeId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .eq("bro_id", bridgeId)
      .order("start_tid", { ascending: false });

    if (error) {
      console.error("Error fetching jobs for bridge:", error);
      throw new Error(error.message);
    }

    return data as any[];
  },

  // Get jobs for a specific user
  async getJobsForUser(userId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .eq("ansvarig_anvandare", userId)
      .order("start_tid", { ascending: false });
      
    if (error) {
      console.error("Error fetching jobs for user:", error);
      throw new Error(error.message);
    }

    return data as any[];
  },
  
  // Get recent jobs (e.g., last 7 days) for dashboard
  async getRecentJobs(days: number = 7): Promise<Job[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .gte("start_tid", date.toISOString())
      .order("start_tid", { ascending: false });

    if (error) {
      console.error("Error fetching recent jobs:", error);
      throw new Error(error.message);
    }

    return data as any[];
  },

  // Search jobs
  async searchJobs(searchTerm: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobb")
      .select(`
        *,
        bridge:jobb_bro_id_fkey ( name, id ),
        user:ansvarig_anvandare ( full_name )
      `)
      .or(`anteckningar.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`);
      // This simple search can be expanded. For searching related tables,
      // you might need a database function (RPC).

    if (error) {
      console.error("Error searching jobs:", error);
      throw new Error(error.message);
    }
    
    return data as any[];
  },

  async syncJobs(jobs: Job[]): Promise<{ data: any[] | null, error: any }> {
    const upserts = jobs.map(job => {
      const { ...rest } = job;
      return {
        ...rest,
        // Ensure properties match DB columns
        updated_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase.from('jobb').upsert(upserts).select();
    
    if (error) {
      console.error("Error during job sync:", error);
    }
    
    return { data, error };
  }
};
