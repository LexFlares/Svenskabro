import { supabase } from "@/integrations/supabase/client";
import type { DbMessage, Profile, ChatMessage, ChatContact } from "@/types";
import { encryptionService } from "@/lib/encryption";

export const lexChatService = {
  async getContacts(currentUserId: string): Promise<ChatContact[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return [];
    }

    // Replace RPC with a direct query as a workaround for type generation issues.
    const { data: lastMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('from_user_id, to_user_id, message, created_at, read');
    
    if (messagesError) {
      console.error("Error fetching last messages:", messagesError);
    }
    
    const lastMessageMap = new Map();
    if(lastMessages) {
        // This is a simplified logic. A proper solution would be a DB function.
        // For now, we iterate and get the latest message for each contact pair.
        const sortedMessages = lastMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        for (const msg of sortedMessages) {
            const isFrom = msg.from_user_id === currentUserId;
            const isTo = msg.to_user_id === currentUserId;

            if (isFrom || isTo) {
                const contactId = isFrom ? msg.to_user_id : msg.from_user_id;
                if (!lastMessageMap.has(contactId)) {
                    const unreadCount = !isFrom && !msg.read ? 1 : 0; // Simplistic unread count
                    lastMessageMap.set(contactId, {
                        message: msg.message,
                        created_at: msg.created_at,
                        unread_count: unreadCount,
                    });
                }
            }
        }
    }


    const contacts: ChatContact[] = profiles
      .filter((p) => p.id !== currentUserId)
      .map((profile) => {
        const lastMessage = lastMessageMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || 'Okänd användare',
          avatar_url: profile.avatar_url,
          latestMessage: lastMessage?.message || null,
          latestMessageTimestamp: lastMessage?.created_at || null,
          unreadCount: lastMessage?.unread_count || 0,
        };
      });

    // Sort contacts: unread first, then by last message time
    contacts.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      if (a.latestMessageTimestamp && b.latestMessageTimestamp) {
        return new Date(b.latestMessageTimestamp).getTime() - new Date(a.latestMessageTimestamp).getTime();
      }
      if (a.latestMessageTimestamp) return -1;
      if (b.latestMessageTimestamp) return 1;
      return 0;
    });

    return contacts;
  },

  async getMessages(
    currentUserId: string,
    contactId: string,
    encryptionKey: string
  ): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`(from_user_id.eq.${currentUserId},to_user_id.eq.${contactId}),(from_user_id.eq.${contactId},to_user_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    const messages = data || [];
    const processedMessages: ChatMessage[] = [];

    for (const msg of messages) {
      // FIX: Ensure all required fields including group_id are present
      const chatMessage: ChatMessage = {
        id: msg.id,
        created_at: msg.created_at,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        group_id: msg.group_id, // ✅ ALWAYS include group_id
        message: msg.message,
        encrypted: msg.encrypted,
        read: msg.read,
        read_at: msg.read_at,
        from_user_name: msg.from_user_name
      };

      if (chatMessage.encrypted && chatMessage.message) {
        try {
          const decryptedContent = await encryptionService.decryptData(chatMessage.message, encryptionKey);
          chatMessage.message = decryptedContent;
          chatMessage.encrypted = false;
        } catch (e) {
          console.error("Failed to decrypt message:", msg.id);
          chatMessage.message = "[Krypterat meddelande - fel nyckel]";
        }
      }
      processedMessages.push(chatMessage);
    }
    
    return processedMessages;
  },

  async sendMessage(
    fromUserId: string,
    toUserId: string,
    content: string,
    encryptionKey: string
  ): Promise<ChatMessage> {
    const encryptedContent = await encryptionService.encryptData(content, encryptionKey);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        message: encryptedContent,
        encrypted: true,
        from_user_name: 'temp', // This should be handled better, maybe fetched from profile
        group_id: null // ✅ Explicitly set null for direct messages
      })
      .select("id, created_at, from_user_id, to_user_id, group_id, message, encrypted, read, read_at, from_user_name")
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw new Error(error.message);
    }
    
    // FIX: Ensure proper type conversion with all required fields
    const chatMessage: ChatMessage = {
      id: data.id,
      created_at: data.created_at,
      from_user_id: data.from_user_id,
      to_user_id: data.to_user_id,
      group_id: data.group_id, // ✅ ALWAYS include group_id
      message: content, // Decrypted for immediate display
      encrypted: false,
      read: data.read,
      read_at: data.read_at,
      from_user_name: data.from_user_name
    };

    return chatMessage;
  },

  onNewMessage(
    currentUserId: string,
    contactId: string,
    callback: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`chat:${currentUserId}:${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${currentUserId}`
        },
        async (payload) => {
          const newMessage = payload.new as DbMessage;
          // Ensure the message is part of the current conversation
          if (newMessage.from_user_id === contactId) {
            callback(newMessage as ChatMessage);
          }
        }
      )
      .subscribe();
  },

  async markMessagesAsRead(currentUserId: string, contactId: string) {
    const { error } = await supabase
      .from("chat_messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("to_user_id", currentUserId)
      .eq("from_user_id", contactId)
      .eq("read", false);

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  },
  
  async getWorkGroupChat(groupId: string, encryptionKey: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching work group messages:", error);
      return [];
    }

    const messages = data || [];
    const processedMessages: ChatMessage[] = [];

    for (const msg of messages) {
      // FIX: Ensure all required fields including group_id are present
      const chatMessage: ChatMessage = {
        id: msg.id,
        created_at: msg.created_at,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        group_id: msg.group_id, // ✅ ALWAYS include group_id
        message: msg.message,
        encrypted: msg.encrypted,
        read: msg.read,
        read_at: msg.read_at,
        from_user_name: msg.from_user_name
      };

      if (chatMessage.encrypted && chatMessage.message) {
        try {
          const decryptedContent = await encryptionService.decryptData(chatMessage.message, encryptionKey);
          chatMessage.message = decryptedContent;
          chatMessage.encrypted = false;
        } catch (e) {
          chatMessage.message = "[Krypterat meddelande]";
        }
      }
      processedMessages.push(chatMessage);
    }

    return processedMessages;
  },

  async sendWorkGroupMessage(
    fromUserId: string,
    groupId: string,
    content: string,
    encryptionKey: string
  ): Promise<ChatMessage> {
    const encryptedContent = await encryptionService.encryptData(content, encryptionKey);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        from_user_id: fromUserId,
        group_id: groupId,
        message: encryptedContent,
        from_user_name: 'temp',
        to_user_id: null, // ✅ NULL for group messages instead of 'group'
        encrypted: true
      })
      .select("id, created_at, from_user_id, to_user_id, group_id, message, encrypted, read, read_at, from_user_name")
      .single();

    if (error) {
      console.error("Error sending work group message:", error);
      throw new Error(error.message);
    }
    
    // FIX: Ensure proper type conversion with all required fields
    const chatMessage: ChatMessage = {
      id: data.id,
      created_at: data.created_at,
      from_user_id: data.from_user_id,
      to_user_id: data.to_user_id,
      group_id: data.group_id, // ✅ ALWAYS include group_id
      message: content, // Decrypted for immediate display
      encrypted: false,
      read: data.read,
      read_at: data.read_at,
      from_user_name: data.from_user_name
    };

    return chatMessage;
  },

  onNewWorkGroupMessage(
    groupId: string,
    callback: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`workgroup-chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  }
};
