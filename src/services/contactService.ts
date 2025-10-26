import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

export type Contact = Profile;

export const contactService = {
  // Get all contacts (profiles) from Supabase
  // FIXED: Removed status filter to show ALL users from Supabase
  async getAllContacts(): Promise<{ contacts: Contact[]; error: Error | null }> {
    try {
      console.log("📋 [contactService] Fetching all contacts from Supabase profiles table...");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("❌ [contactService] Error fetching contacts:", error);
        return { contacts: [], error: new Error(error.message) };
      }

      console.log(`✅ [contactService] Successfully fetched ${data?.length || 0} contacts from Supabase`);
      return { contacts: data as Contact[], error: null };
    } catch (error) {
      console.error("💥 [contactService] Unexpected error fetching contacts:", error);
      return { 
        contacts: [], 
        error: error instanceof Error ? error : new Error("Failed to fetch contacts") 
      };
    }
  },

  // Get specific contact by ID
  async getContactById(id: string): Promise<{ contact: Contact | null; error: Error | null }> {
    try {
      console.log(`📋 [contactService] Fetching contact by ID: ${id}`);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [contactService] Error fetching contact:", error);
        return { contact: null, error: new Error(error.message) };
      }

      console.log(`✅ [contactService] Successfully fetched contact: ${data?.full_name || 'Unknown'}`);
      return { contact: data as Contact, error: null };
    } catch (error) {
      console.error("💥 [contactService] Unexpected error fetching contact:", error);
      return { 
        contact: null, 
        error: error instanceof Error ? error : new Error("Failed to fetch contact") 
      };
    }
  }
};
