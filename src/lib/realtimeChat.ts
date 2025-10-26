import { database } from "./firebase";
import { ref, push, onValue, off, set, serverTimestamp, query, orderByChild, limitToLast } from "firebase/database";
import { encryptData, decryptData, generateRandomKey, getEncryptionKey } from "./encryption";

export interface RealtimeMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: number;
  encrypted: boolean;
  read: boolean;
  delivered: boolean;
  deliveredAt?: number;
  readAt?: number;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  lastSeen: number;
  online: boolean;
}

// Skicka meddelande
export const sendRealtimeMessage = async (
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  message: string,
  encrypt: boolean = true
): Promise<void> => {
  if (!database) {
    throw new Error("Firebase is not configured");
  }

  try {
    const chatId = getChatId(fromUserId, toUserId);
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    
    let messageData = message;
    let encryptionKey: string | null = null;
    
    // Kryptera meddelandet om aktiverat
    if (encrypt) {
      // Använd en sessionsspecifik nyckel om den finns, annars generera en ny.
      // Notera: I en verklig applikation skulle denna nyckel behöva utbytas säkert (t.ex. med Diffie-Hellman).
      // Här simulerar vi en delad hemlighet.
      encryptionKey = getEncryptionKey(); // Använder sessionsnyckeln från login
      if (!encryptionKey) {
        console.warn("No session encryption key found for chat. Using a temporary key.");
        encryptionKey = generateRandomKey(); // Fallback till en osäker metod
      }
      messageData = encryptData(message, encryptionKey);
    }

    const newMessage = {
      from: fromUserId,
      fromName: fromUserName,
      to: toUserId,
      message: messageData,
      timestamp: serverTimestamp(),
      encrypted: encrypt,
      encryptionKey: encrypt ? encryptionKey : null, // Notera: Osäkert att skicka nyckeln så här. Endast för demo.
      read: false,
      delivered: false,
    };

    await push(messagesRef, newMessage);

    // Uppdatera senaste aktivitet
    const chatMetaRef = ref(database, `chats/${chatId}/meta`);
    await set(chatMetaRef, {
      lastMessage: message.substring(0, 50),
      lastMessageTime: serverTimestamp(),
      participants: [fromUserId, toUserId]
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Lyssna på nya meddelanden
export const subscribeToMessages = (
  userId: string,
  otherUserId: string,
  callback: (messages: RealtimeMessage[]) => void
): (() => void) => {
  if (!database) {
    console.warn("Firebase is not configured");
    return () => {};
  }

  const chatId = getChatId(userId, otherUserId);
  const messagesRef = query(
    ref(database, `chats/${chatId}/messages`),
    orderByChild("timestamp"),
    limitToLast(100)
  );

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages: RealtimeMessage[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      let messageText = data.message;
      const usedKey = data.encryptionKey || getEncryptionKey(); // Försök hämta nyckeln från meddelandet eller sessionen

      // Dekryptera om krypterat
      if (data.encrypted) {
        try {
          if (usedKey) {
            messageText = decryptData(data.message, usedKey);
          } else {
            throw new Error("No key available for decryption");
          }
        } catch (error) {
          console.error("Failed to decrypt message:", error);
          messageText = "[Krypterat meddelande - ingen nyckel]";
        }
      }

      messages.push({
        id: childSnapshot.key || "",
        from: data.from,
        to: data.to,
        message: messageText,
        timestamp: data.timestamp,
        encrypted: data.encrypted,
        read: data.read,
        delivered: data.delivered,
        deliveredAt: data.deliveredAt,
        readAt: data.readAt,
      });
    });

    callback(messages);
  });

  return () => off(messagesRef);
};

// Markera meddelanden som levererade
export const markMessageAsDelivered = async (
  chatId: string,
  messageId: string
): Promise<void> => {
  if (!database) return;

  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    await set(messageRef, {
      delivered: true,
      deliveredAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error marking message as delivered:", error);
  }
};

// Markera meddelanden som lästa
export const markMessagesAsRead = async (
  chatId: string,
  userId: string
): Promise<void> => {
  if (!database) return;

  try {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const snapshot = await new Promise<any>((resolve) => {
      onValue(messagesRef, resolve, { onlyOnce: true });
    });

    const updates: Record<string, any> = {};
    
    snapshot.forEach((childSnapshot: any) => {
      const data = childSnapshot.val();
      // Markera endast meddelanden från andra som olästa
      if (data.to === userId && !data.read) {
        updates[`${childSnapshot.key}/read`] = true;
        updates[`${childSnapshot.key}/readAt`] = Date.now();
      }
    });

    if (Object.keys(updates).length > 0) {
      await set(messagesRef, updates);
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

// Uppdatera användarens online-status
export const updateUserPresence = async (
  userId: string,
  userName: string,
  online: boolean
): Promise<void> => {
  if (!database) return;

  try {
    const presenceRef = ref(database, `presence/${userId}`);
    await set(presenceRef, {
      userName,
      online,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating presence:", error);
  }
};

// Lyssna på användarens online-status
export const subscribeToPresence = (
  userId: string,
  callback: (participant: ChatParticipant) => void
): (() => void) => {
  if (!database) {
    return () => {};
  }

  const presenceRef = ref(database, `presence/${userId}`);

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        userId,
        userName: data.userName,
        lastSeen: data.lastSeen,
        online: data.online
      });
    }
  });

  return () => off(presenceRef);
};

// Hjälpfunktion för att skapa konsekvent chat-ID
const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join("_");
};

// Hämta alla aktiva chattar för en användare
export const getUserChats = (
  userId: string,
  callback: (chats: any[]) => void
): (() => void) => {
  if (!database) {
    return () => {};
  }

  const chatsRef = ref(database, "chats");

  const unsubscribe = onValue(chatsRef, (snapshot) => {
    const chats: any[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const chatData = childSnapshot.val();
      if (chatData.meta && chatData.meta.participants?.includes(userId)) {
        chats.push({
          chatId: childSnapshot.key,
          ...chatData.meta
        });
      }
    });

    callback(chats);
  });

  return () => off(chatsRef);
};
