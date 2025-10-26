import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";
import { contactService } from "@/services/contactService";
import { realtimeChatSupabase } from "@/lib/realtimeChatSupabase";
import type { ChatMessage as SupabaseChatMessage } from "@/lib/realtimeChatSupabase";
import type { Contact } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<SupabaseChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<Contact | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Supabase auth and chat service
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const userName = user.user_metadata?.full_name || user.email || "User";
        setCurrentUserName(userName);
        await realtimeChatSupabase.initialize(user.id, userName);
      } else {
        router.push("/");
      }
    };

    initAuth();

    return () => {
      realtimeChatSupabase.cleanup();
    };
  }, [router]);

  // Parse router query safely
  useEffect(() => {
    if (router.isReady) {
      const { chatId: queryChatId } = router.query;
      const partnerId = queryChatId as string || null;
      setChatPartnerId(partnerId);
      setMounted(true);
      
      if (partnerId) {
        loadChatPartner(partnerId);
      }
    }
  }, [router.isReady, router.query]);

  const loadChatPartner = async (partnerId: string) => {
    try {
      const { contacts } = await contactService.getAllContacts();
      const partner = contacts.find(c => c.id === partnerId);
      setChatPartner(partner || null);
    } catch (error) {
      console.error("Failed to load chat partner:", error);
    }
  };

  // Load messages and subscribe to realtime updates
  useEffect(() => {
    if (!mounted || !currentUserId || !chatPartnerId) {
      setLoading(false);
      return;
    }

    const loadAndSubscribe = async () => {
      try {
        setLoading(true);
        
        // Load existing messages
        const existingMessages = await realtimeChatSupabase.getConversation(chatPartnerId);
        setMessages(existingMessages);

        // Mark unread messages as read
        existingMessages.forEach((msg) => {
          if (msg.to_user_id === currentUserId && !msg.read) {
            realtimeChatSupabase.markAsRead(msg.id);
          }
        });

        // Subscribe to new messages
        realtimeChatSupabase.subscribeToMessages(
          chatPartnerId,
          (message) => {
            setMessages((prev) => [...prev, message]);
            if (message.to_user_id === currentUserId) {
              realtimeChatSupabase.markAsRead(message.id);
            }
            scrollToBottom();
          }
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAndSubscribe();

    return () => {
      realtimeChatSupabase.unsubscribeFromMessages(chatPartnerId);
    };
  }, [mounted, currentUserId, chatPartnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !chatPartnerId) return;

    try {
      const sentMessage = await realtimeChatSupabase.sendMessage(
        chatPartnerId,
        newMessage
      );
      
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
        setNewMessage("");
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t("language") === "sv" ? "Kunde inte skicka meddelande. Försök igen." : "Could not send message. Try again.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getMessageStatus = (message: SupabaseChatMessage) => {
    if (message.from_user_id !== currentUserId) return null;
    
    if (message.read) {
      return <div className="flex items-center gap-1"><CheckCheck size={14} className="text-blue-400" /><span className="text-xs text-blue-400">Läst</span></div>;
    }
    if (message.delivered) {
      return <CheckCheck size={14} className="text-gray-400" />;
    }
    return <Check size={14} className="text-gray-400" />;
  };

  if (!mounted || !router.isReady) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500"></div>
          <p className="text-white mt-4">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return null;
  }

  if (!chatPartnerId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-white text-lg mb-4">
            {t("language") === "sv" ? "Ingen chatt vald" : "No chat selected"}
          </p>
          <Button onClick={() => router.push("/contacts")} className="premium-button">
            {t("language") === "sv" ? "Tillbaka till kontakter" : "Back to Contacts"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <Button
            onClick={() => router.push("/contacts")}
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={24} className="text-white" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {chatPartner?.full_name || "Chat"}
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                <img 
                  src="/Screenshot 2025-10-23 172945.png" 
                  alt="LexChat" 
                  className="h-3 w-auto"
                  style={{ filter: 'brightness(0) saturate(100%) invert(77%) sepia(71%) saturate(463%) hue-rotate(72deg) brightness(93%) contrast(86%)' }}
                />
                <Lock size={10} />
                <span>{t("language") === "sv" ? "Krypterad" : "Encrypted"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
              <Phone size={20} className="text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
              <Video size={20} className="text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
              <MoreVertical size={20} className="text-white" />
            </Button>
          </div>
        </div>
        
        <div className="bg-amber-900/20 px-4 py-2 text-center border-t border-amber-500/20">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs text-amber-300">
            <Lock size={12} className="flex-shrink-0" />
            <span>
              {t("language") === "sv" 
                ? "Meddelanden och samtal är end-to-end-krypterade. Ingen utanför denna chatt, inte ens LexFlares, kan läsa eller lyssna. Tryck för mer info." 
                : "Messages and calls are end-to-end encrypted. No one outside of this chat, not even LexFlares, can read or listen. Tap for more info."}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-screen gradient-bg flex flex-col pt-36 pb-20">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              {t("language") === "sv" ? "Laddar meddelanden..." : "Loading messages..."}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {t("language") === "sv" ? "Inga meddelanden ännu" : "No messages yet"}
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.from_user_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? "bg-gradient-to-br from-[hsl(24,95%,53%)] to-[hsl(24,95%,43%)] text-white"
                        : "bg-[#2a2a2a] text-white"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">
                      {message.message}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString("sv-SE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#1a1a1a]/95 px-4 py-2 text-center text-xs text-gray-400 flex items-center justify-center gap-2 border-t border-white/10">
          <Lock size={12} className="text-green-400" />
          <span>{t("lexChatEncryption")}</span>
        </div>

        <div className="fixed bottom-0 left-0 right-0 frosted-glass border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/10"
            >
              <ImageIcon size={24} className="text-gray-400" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("language") === "sv" ? "Skriv ett meddelande..." : "Type a message..."}
              className="flex-1 bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500 rounded-xl"
            />
            
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="premium-button rounded-xl"
              size="icon"
            >
              <Send size={20} />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
