import { supabase } from "@/integrations/supabase/client";
import type { Bridge, BridgeInsert } from "@/types";
import type { Database } from "@/integrations/supabase/types";

export const broService = {
  // Fetch all bridges from the 'broar' table
  async getAllBridges(): Promise<Bridge[]> {
    try {
      console.log("📊 Fetching all bridges from Supabase...");
      
      const { data, error } = await supabase
        .from("broar")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("❌ Error fetching bridges:", error);
        return [];
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} bridges`);
      
      // IMPROVED: Validate bridge data before returning
      const validBridges = (data || []).filter(bridge => {
        if (!bridge.id || !bridge.name) {
          console.warn(`⚠️ Invalid bridge data (missing id or name):`, bridge);
          return false;
        }
        
        // Allow bridges with missing coordinates but log warning
        if (bridge.x === null || bridge.x === undefined || bridge.y === null || bridge.y === undefined) {
          console.warn(`⚠️ Bridge ${bridge.name} (${bridge.id}) has missing coordinates`);
        }
        
        return true;
      });

      return validBridges as Bridge[];
    } catch (error) {
      console.error("💥 Unexpected error fetching bridges:", error);
      return [];
    }
  },

  // Create a single bridge.
  async createBridge(bridge: BridgeInsert): Promise<{ bridge: Bridge | null, error: Error | null }> {
    try {
      console.log("🔨 Creating bridge:", bridge.name);
      
      // IMPROVED: Validate bridge data before insert
      if (!bridge.name || bridge.name.trim() === "") {
        return { bridge: null, error: new Error("Bridge name is required") };
      }
      
      if (bridge.x !== undefined && bridge.x !== null && (isNaN(bridge.x) || bridge.x < 10 || bridge.x > 25)) {
        return { bridge: null, error: new Error(`Invalid longitude: ${bridge.x}. Expected: 10-25 for Sweden`) };
      }
      
      if (bridge.y !== undefined && bridge.y !== null && (isNaN(bridge.y) || bridge.y < 55 || bridge.y > 70)) {
        return { bridge: null, error: new Error(`Invalid latitude: ${bridge.y}. Expected: 55-70 for Sweden`) };
      }
      
      const { data, error } = await supabase
        .from("broar")
        .insert(bridge as any)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error creating bridge:", error);
        return { bridge: null, error: new Error(error.message) };
      }
      
      console.log("✅ Bridge created successfully:", data.id);
      return { bridge: data as Bridge, error: null };
    } catch (error) {
      console.error("💥 Unexpected error creating bridge:", error);
      return { 
        bridge: null, 
        error: error instanceof Error ? error : new Error("Failed to create bridge")
      };
    }
  },

  // Import multiple bridges into the 'broar' table
  async importBridges(bridges: BridgeInsert[]): Promise<{ error: Error | null }> {
    try {
      console.log(`📥 Importing ${bridges.length} bridges...`);
      
      // IMPROVED: Validate all bridges before import
      const validBridges = bridges.filter((bridge, index) => {
        if (!bridge.name || bridge.name.trim() === "") {
          console.warn(`⚠️ Skipping bridge at index ${index}: missing name`);
          return false;
        }
        
        if (bridge.x !== undefined && bridge.x !== null && (isNaN(bridge.x) || bridge.x < 10 || bridge.x > 25)) {
          console.warn(`⚠️ Skipping bridge ${bridge.name}: invalid longitude ${bridge.x}`);
          return false;
        }
        
        if (bridge.y !== undefined && bridge.y !== null && (isNaN(bridge.y) || bridge.y < 55 || bridge.y > 70)) {
          console.warn(`⚠️ Skipping bridge ${bridge.name}: invalid latitude ${bridge.y}`);
          return false;
        }
        
        return true;
      });
      
      if (validBridges.length === 0) {
        return { error: new Error("No valid bridges to import") };
      }
      
      if (validBridges.length < bridges.length) {
        console.warn(`⚠️ Importing ${validBridges.length} of ${bridges.length} bridges (${bridges.length - validBridges.length} invalid)`);
      }

      const { error } = await supabase
        .from("broar")
        .upsert(validBridges as any, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error("❌ Error importing bridges:", error);
        return { error: new Error(error.message) };
      }
      
      console.log(`✅ Successfully imported ${validBridges.length} bridges`);
      return { error: null };
    } catch (error) {
      console.error("💥 Unexpected error importing bridges:", error);
      return { 
        error: error instanceof Error ? error : new Error("Failed to import bridges")
      };
    }
  },

  // Delete all bridges from the 'broar' table.
  async clearAllBridges(): Promise<{ error: Error | null }> {
    try {
      console.log("🗑️ Clearing all bridges...");
      
      const { error } = await supabase
        .from("broar")
        .delete()
        .neq("id", "0");

      if (error) {
        console.error("❌ Error clearing bridges:", error);
        return { error: new Error(error.message) };
      }
      
      console.log("✅ All bridges cleared successfully");
      return { error: null };
    } catch (error) {
      console.error("💥 Unexpected error clearing bridges:", error);
      return { 
        error: error instanceof Error ? error : new Error("Failed to clear bridges")
      };
    }
  }
};
