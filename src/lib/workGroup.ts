import { supabase } from "@/integrations/supabase/client";
import type { User, Profile } from "@/types";

export interface WorkGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface WorkGroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: "admin" | "member";
    joined_at: string;
    profiles?: Profile; // For joined queries
}

export interface WorkGroupWithMembers extends WorkGroup {
  members: {
    role: string;
    joined_at: string;
    profiles: Profile | null;
  }[];
  creator: Profile | null;
}


// Function to generate a random invite code
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) result += "-";
  }
  return result;
}

// Generate a unique URL for joining a work group
export function generateInviteUrl(inviteCode: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join-work-group?code=${inviteCode}`;
  }
  return `/join-work-group?code=${inviteCode}`;
}

// Create a new work group in the database
export async function createWorkGroup(host: User, groupName: string): Promise<{ group: WorkGroup | null, error: Error | null }> {
  const inviteCode = generateInviteCode();
  
  try {
    // 1. Create the group
    const { data: groupData, error: groupError } = await supabase
      .from("work_groups")
      .insert({
        name: groupName,
        invite_code: inviteCode,
        created_by: host.id,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // 2. Add the host as the first member with 'admin' role
    const { error: memberError } = await supabase
      .from("work_group_members")
      .insert({
        group_id: groupData.id,
        user_id: host.id,
        role: "admin",
      });

    if (memberError) throw memberError;

    return { group: groupData, error: null };
  } catch (error: any) {
    console.error("Error creating work group:", error);
    return { group: null, error: new Error(error.message) };
  }
}

// Retrieve a work group by its invite code
export async function getWorkGroupByInviteCode(code: string): Promise<{ group: WorkGroup | null, error: Error | null }> {
  try {
    console.log("🔍 Looking up work group with invite code:", code);
    
    const { data, error } = await supabase
      .from("work_groups")
      .select(`
        id,
        name,
        invite_code,
        created_by,
        created_at,
        profiles!work_groups_created_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("invite_code", code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("⚠️ Invalid invite code - no group found");
        return { group: null, error: new Error("Invalid invite code") };
      }
      console.error("❌ Database error looking up work group:", error);
      throw error;
    }

    console.log("✅ Found work group:", data);
    return { group: data as WorkGroup, error: null };
  } catch (error: any) {
    console.error("💥 Unexpected error getting work group:", error);
    return { group: null, error: new Error(error.message || "Failed to fetch work group") };
  }
}

// Add a participant to a work group
export async function joinWorkGroup(
  groupId: string,
  user: User
): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log("➕ Adding user to work group:", { groupId, userId: user.id });
    
    const { error } = await supabase
      .from("work_group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

    if (error) {
      if (error.code === '23505') {
        console.log("ℹ️ User is already a member of this group");
        return { success: true, error: null };
      }
      console.error("❌ Error adding user to work group:", error);
      throw error;
    }

    console.log("✅ User successfully added to work group");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("💥 Unexpected error joining work group:", error);
    return { success: false, error: new Error(error.message) };
  }
}

// Send an email invite using Supabase Edge Function with SMTP
export async function sendEmailInvite(
  inviteCode: string,
  recipientEmail: string,
  hostName: string,
  groupName: string
): Promise<{ success: boolean; error?: string }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return { 
      success: false, 
      error: "Invalid email format" 
    };
  }

  const inviteUrl = generateInviteUrl(inviteCode);
  
  try {
    console.log("Attempting to send email invite via Edge Function...");
    console.log("Recipient:", recipientEmail);
    console.log("Invite URL:", inviteUrl);

    // Call the Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-work-group-invite', {
      body: {
        inviteCode,
        recipientEmail,
        hostName,
        groupName,
        inviteUrl
      }
    });

    if (error) {
      console.error("Edge Function error:", error);
      return {
        success: false,
        error: `Failed to send email: ${error.message || "Unknown error"}`
      };
    }

    if (data && !data.success) {
      console.warn("Email send partially failed:", data);
      return {
        success: false,
        error: data.message || "Email delivery failed"
      };
    }

    console.log("Email invite sent successfully to:", recipientEmail);
    return { success: true };

  } catch (error: any) {
    console.error("Failed to send email invite:", error);
    return {
      success: false,
      error: error.message || "Network error occurred"
    };
  }
}


// Get all work groups with their members (Admin only)
export async function getAllWorkGroupsWithMembers(): Promise<{ groups: WorkGroupWithMembers[]; error: Error | null }> {
  try {
    console.log("📊 Fetching all work groups with members...");
    
    const { data, error } = await supabase
      .from("work_groups")
      .select(`
        id,
        name,
        invite_code,
        created_by,
        created_at,
        creator:created_by (
          *
        ),
        members:work_group_members (
          *,
          profile:user_id (
            *
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching work groups:", error);
      return { groups: [], error: new Error(error.message) };
    }

    console.log(`✅ Fetched ${data?.length || 0} work groups`);
    
    // The data should now match the WorkGroupWithMembers type directly
    const typedGroups: WorkGroupWithMembers[] = data as unknown as WorkGroupWithMembers[];
    
    return { groups: typedGroups || [], error: null };
  } catch (error: any) {
    console.error("💥 Unexpected error fetching work groups:", error);
    return { 
      groups: [], 
      error: error instanceof Error ? error : new Error("Failed to fetch work groups")
    };
  }
}
