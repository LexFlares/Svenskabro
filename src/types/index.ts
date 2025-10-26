import type { Database as Db } from "@/integrations/supabase/types";

// Re-export Json type, defining it if it's not exported from supabase types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Re-export Database type
export type Database = Db;

// Generic helper types from Supabase
export type Tables<T extends keyof Db["public"]["Tables"]> = Db["public"]["Tables"][T]["Row"];
export type Insert<T extends keyof Db["public"]["Tables"]> = Db["public"]["Tables"][T]["Insert"];
export type Update<T extends keyof Db["public"]["Tables"]> = Db["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Db["public"]["Enums"]> = Db["public"]["Enums"][T];

// --- Base DB Types (Direct from database.types.ts) ---
export type DbProfile = Tables<"profiles">;
export type DbBridge = Tables<"bridges">;
export type DbJob = Tables<"jobb">;
export type DbDeviation = Tables<"deviations">;
export type DbDocument = Tables<"documents">;
export type DbWorkGroup = Tables<"work_groups">;
export type DbWorkGroupMember = Tables<"work_group_members">;
export type DbMessage = Tables<"chat_messages">;
export type DbGroupMember = Tables<"group_members">;
export type DbUserTrafficFilter = Tables<"user_traffic_filters">;

// --- Insert Types ---
export type ProfileInsert = Insert<"profiles">;
export type JobInsert = Insert<"jobb">;
export type BridgeInsert = Insert<"bridges">;
export type DeviationInsert = Insert<"deviations">;
export type ChatContactInsert = Insert<"profiles">;
export type ChatMessageInsert = Insert<"chat_messages">;

// --- Update Types ---
export type JobUpdate = Update<"jobb">;

// --- App-specific Aliases & Extended Types ---
export type User = DbProfile;
export type Profile = DbProfile;
export type Bridge = DbBridge;
export type Deviation = DbDeviation;
export type Document = DbDocument;
export type WorkGroup = DbWorkGroup;
export type Contact = DbProfile;
export type GroupMember = DbGroupMember;

export interface Job extends DbJob {
  bridge?: { name: string; id: string } | null;
  user?: { full_name: string } | null;
}

// FIX: Redefined as a standalone interface to break recursive type-checking loop.
export interface ChatMessage {
  id: string;
  created_at: string;
  from_user_id: string;
  to_user_id: string | null;
  group_id: string | null;
  message: string | null;
  encrypted: boolean | null;
  read: boolean | null;
  read_at: string | null;
  from_user_name: string | null;
  from_user?: Profile; // Optional related profile
  to_user?: Profile;   // Optional related profile
}

export interface WorkGroupMember extends DbWorkGroupMember {
  profile?: Profile | null;
}

export interface WorkGroupWithMembers extends DbWorkGroup {
  creator: Profile;
  members: WorkGroupMember[];
}

export interface Chat {
  contactId: string;
  messages: ChatMessage[];
}

export interface ChatContact {
  id: string;
  full_name: string;
  avatar_url: string | null;
  latestMessage: string | null;
  latestMessageTimestamp: string | null;
  unreadCount: number;
}

// --- Trafikverket API Types ---
export interface GeometryData {
  WGS84?: string;
  SWEREF99TM?: string;
  type?: "Point" | "LineString" | "Polygon";
}

export interface DeviationData {
  Id?: string;
  CreationTime: string;
  EndTime?: string;
  Header: string;
  IconId?: string;
  Message: string;
  StartTime: string;
  SeverityTime?: string;
  RoadNumber?: string;
  CountyNo?: number[];
  LocationDescriptor?: string;
  Geometry?: GeometryData;
  Severity?: "Low" | "Medium" | "High" | "VeryHigh";
  AffectedDirection?: "Positive" | "Negative" | "Both";
  TemporaryLimit?: number;
  ManagedBy?: string;
  WebLink?: string;
}

export interface TrafikverketSituation {
  Deviation: DeviationData[];
  PublicationTime?: string;
  Id?: string;
  Version?: string;
}

// --- LexChat AI Assistant Message Type ---
export type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string;
  timestamp?: string;
};
