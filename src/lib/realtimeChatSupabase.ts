import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { encryptData as encryptMessage, decryptData as decryptMessage } from "./encryption";

export interface ChatMessage {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  message: string;
  encrypted: boolean;
  encryption_key?: string;
  read: boolean;
  delivered: boolean;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  user_name: string;
  online: boolean;
  last_seen: string;
}

class RealtimeChatSupabase {
  private messageChannels: Map<string, RealtimeChannel> = new Map();
  private presenceChannel: RealtimeChannel | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

  async initialize(userId: string, userName: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    await this.updatePresence(true);
    await this.setupPresenceChannel();
  }

  private async setupPresenceChannel() {
    if (this.presenceChannel) {
      await supabase.removeChannel(this.presenceChannel);
    }

    this.presenceChannel = supabase.channel("user-presence");
    
    this.presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        console.log("Presence channel subscribed");
      }
    });
  }

  async updatePresence(online: boolean) {
    if (!this.currentUserId || !this.currentUserName) return;

    try {
      const { error } = await supabase
        .from("user_presence")
        .upsert({
          user_id: this.currentUserId,
          user_name: this.currentUserName,
          online,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update presence:", error);
    }
  }

  async sendMessage(
    toUserId: string,
    message: string,
    encryptionKey?: string
  ): Promise<ChatMessage | null> {
    if (!this.currentUserId || !this.currentUserName) {
      console.error("User not initialized");
      return null;
    }

    try {
      let messageToSend = message;
      let isEncrypted = false;

      if (encryptionKey) {
        messageToSend = await encryptMessage(message, encryptionKey);
        isEncrypted = true;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          from_user_id: this.currentUserId,
          from_user_name: this.currentUserName,
          to_user_id: toUserId,
          message: messageToSend,
          encrypted: isEncrypted,
          encryption_key: encryptionKey,
          read: false,
          delivered: false
        })
        .select()
        .single();

      if (error) throw error;

      return data as ChatMessage;
    } catch (error) {
      console.error("Failed to send message:", error);
      return null;
    }
  }

  subscribeToMessages(
    otherUserId: string,
    onMessage: (message: ChatMessage) => void
  ) {
    if (!this.currentUserId) {
      console.error("User not initialized");
      return;
    }

    const channelName = `chat:${this.currentUserId}:${otherUserId}`;
    
    if (this.messageChannels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `from_user_id=eq.${otherUserId},to_user_id=eq.${this.currentUserId}`
        },
        async (payload) => {
          const message = payload.new as ChatMessage;
          
          if (message.encrypted && message.encryption_key) {
            try {
              message.message = await decryptMessage(
                message.message,
                message.encryption_key
              );
            } catch (error) {
              console.error("Failed to decrypt message:", error);
            }
          }
          
          await this.markAsDelivered(message.id);
          onMessage(message);
        }
      )
      .subscribe();

    this.messageChannels.set(channelName, channel);
  }

  async markAsDelivered(messageId: string) {
    try {
      await supabase
        .from("chat_messages")
        .update({
          delivered: true,
          delivered_at: new Date().toISOString()
        })
        .eq("id", messageId);
    } catch (error) {
      console.error("Failed to mark message as delivered:", error);
    }
  }

  async markAsRead(messageId: string) {
    try {
      await supabase
        .from("chat_messages")
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq("id", messageId);
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  }

  async getConversation(otherUserId: string): Promise<ChatMessage[]> {
    if (!this.currentUserId) {
      console.error("User not initialized");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(from_user_id.eq.${this.currentUserId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${this.currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messages = data as ChatMessage[];

      for (const message of messages) {
        if (message.encrypted && message.encryption_key) {
          try {
            message.message = await decryptMessage(
              message.message,
              message.encryption_key
            );
          } catch (error) {
            console.error("Failed to decrypt message:", error);
          }
        }
      }

      return messages;
    } catch (error) {
      console.error("Failed to get conversation:", error);
      return [];
    }
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data as UserPresence;
    } catch (error) {
      console.error("Failed to get user presence:", error);
      return null;
    }
  }

  subscribeToPresence(
    userIds: string[],
    onPresenceChange: (presence: UserPresence) => void
  ) {
    const channel = supabase
      .channel("presence-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=in.(${userIds.join(",")})`
        },
        (payload) => {
          const presence = payload.new as UserPresence;
          onPresenceChange(presence);
        }
      )
      .subscribe();

    return channel;
  }

  async unsubscribeFromMessages(otherUserId: string) {
    if (!this.currentUserId) return;

    const channelName = `chat:${this.currentUserId}:${otherUserId}`;
    const channel = this.messageChannels.get(channelName);

    if (channel) {
      await supabase.removeChannel(channel);
      this.messageChannels.delete(channelName);
    }
  }

  async cleanup() {
    await this.updatePresence(false);

    for (const channel of this.messageChannels.values()) {
      await supabase.removeChannel(channel);
    }
    this.messageChannels.clear();

    if (this.presenceChannel) {
      await supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
  }
}

export const realtimeChatSupabase = new RealtimeChatSupabase();
