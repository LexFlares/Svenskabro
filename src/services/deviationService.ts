import { supabase } from "@/integrations/supabase/client";
import type { Deviation, DeviationInsert } from "@/types";

export const deviationService = {
  async addDeviation(deviationData: Omit<DeviationInsert, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<Deviation> {
    const { data, error } = await supabase
      .from("deviations")
      .insert({
          ...deviationData,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding deviation:", error);
      throw new Error(error.message);
    }

    return data;
  },

  async getDeviationsForBridge(bridgeId: string): Promise<Deviation[]> {
    const { data, error } = await supabase
      .from("deviations")
      .select(`
        *,
        profile:profiles ( full_name, avatar_url )
      `)
      .eq("bridge_id", bridgeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deviations:", error);
      throw new Error(error.message);
    }
    
    return data as any[];
  },

  async getAllDeviations(): Promise<Deviation[]> {
    const { data, error } = await supabase
      .from("deviations")
      .select(`
        *,
        profile:profiles ( full_name ),
        bridge:bridges ( name )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all deviations:", error);
      throw new Error(error.message);
    }

    return data as any[];
  },

  async updateDeviationStatus(deviationId: string, status: string): Promise<Deviation> {
    const { data, error } = await supabase
      .from("deviations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", deviationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deviation status:", error);
      throw new Error(error.message);
    }

    return data;
  },

  async deleteDeviation(deviationId: string): Promise<void> {
    const { error } = await supabase
      .from("deviations")
      .delete()
      .eq("id", deviationId);

    if (error) {
      console.error("Error deleting deviation:", error);
      throw new Error(error.message);
    }
  },
};
