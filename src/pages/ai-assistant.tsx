import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Send, Loader2, Zap, FileText, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/lib/storage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function LexAIPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem("lexai_messages");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("lexai_messages", JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkRateLimit = () => {
    const now = Date.now();
    const oneMinute = 60000;

    if (now - lastRequestTime > oneMinute) {
      setRequestCount(1);
      setLastRequestTime(now);
      return true;
    }

    if (requestCount >= 3) {
      setError(t("rateLimitError"));
      return false;
    }

    setRequestCount((prev) => prev + 1);
    return true;
  };

  const sendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || input.trim();

    if (!contentToSend) return;
    if (!checkRateLimit()) return;

    const userMessage: Message = {
      role: "user",
      content: contentToSend
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = language === "sv" ?
      "Du är LexAI, en erfaren bygg- och broreparationsassistent för Svenska Bro Aktiebolag, utvecklad av LexFlares. Ge tydliga och praktiska svar, gärna med hänvisning till Trafikverkets regler. Svara på svenska." :
      "You are LexAI, an experienced construction and bridge repair assistant for Svenska Bro Aktiebolag, developed by LexFlares. Provide clear and practical answers, preferably with reference to Swedish Traffic Authority regulations. Answer in English.";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: contentToSend }]

        })
      });

      if (!response.ok) {
        throw new Error(t("aiError"));
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(t("aiError"));
      console.error("LexAI Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
  {
    icon: FileText,
    label: t("summarizeDiary"),
    action: () => {
      const jobs = storage.getJobs();
      if (jobs.length > 0) {
        const lastJob = jobs[0];
        if (lastJob) {
          const prompt = language === "sv" ?
          `Sammanfatta följande dagbokspost: Bro ${lastJob.bro_id}, ${lastJob.start_tid}. Material: ${lastJob.material || "Ej angivet"}. Anteckningar: ${lastJob.anteckningar || "Inga anteckningar"}` :
          `Summarize the following journal entry: Bridge ${lastJob.bro_id}, ${lastJob.start_tid}. Materials: ${lastJob.material || "Not specified"}. Notes: ${lastJob.anteckningar || "No notes"}`;
          sendMessage(prompt);
        }
      } else {
        setError(language === "sv" ? "Ingen dagbokspost hittades" : "No journal entry found");
      }
    }
  },
  {
    icon: Zap,
    label: t("suggestAction"),
    action: () => {
      const jobs = storage.getJobs();
      if (jobs.length > 0) {
        const lastJob = jobs[0];
        if (lastJob) {
          const prompt = language === "sv" ?
          `Baserat på följande jobbanteckning, föreslå lämpliga åtgärder: ${lastJob.anteckningar || "Inga specifika anteckningar"}` :
          `Based on the following job notes, suggest appropriate actions: ${lastJob.anteckningar || "No specific notes"}`;
          sendMessage(prompt);
        }
      } else {
        setError(language === "sv" ? "Inget jobb hittades" : "No job found");
      }
    }
  },
  {
    icon: AlertCircle,
    label: t("explainKMA"),
    action: () => {
      const prompt = language === "sv" ?
      "Förklara vad som gäller för trafiksäkerhet vid vägarbete enligt Trafikverkets regler" :
      "Explain what applies for traffic safety during road work according to Swedish Traffic Authority regulations";
      sendMessage(prompt);
    }
  }];


  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-white/10">

              <ArrowLeft size={24} className="text-white" />
            </Button>
            <div className="flex items-center gap-3">
              <img
              src="/69AC8E86-929C-4B10-AE84-FD548A254C29.png"
              alt="LexAI"
              className="h-7 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }} />

            </div>
           <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg flex flex-col pt-24 pb-4">
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {quickActions.map((action, index) =>
            <button
              key={index}
              onClick={action.action}
              disabled={isLoading}
              className="p-4 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed premium-card card-hover-lift">

                    <div className="flex items-center gap-3">
                    <action.icon size={20} className="text-gray-300" />
                    <span className="text-sm font-medium text-left text-white">
                        {action.label}
                    </span>
                    </div>
                </button>
            )}
            </div>
            
            <div
            className="rounded-xl p-4 mb-4 overflow-y-auto custom-scrollbar frosted-glass border border-white/10"
            style={{ minHeight: "400px", maxHeight: "50vh" }}>

                {messages.length === 0 && !isLoading &&
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <p className="text-gray-400">
                    {language === "sv" ?
                "Ställ en fråga eller välj en snabbåtgärd" :
                "Ask a question or select a quick action"}
                    </p>
                </div>
            }

                <div className="space-y-4">
                {messages.map((message, index) =>
              <div
                key={index}
                className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>

                    <div className={message.role === "user" ? "chat-bubble-sent" : "chat-bubble-received"}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                        </p>
                    </div>
                    </div>
              )}

                {isLoading &&
              <div className="flex justify-start">
                    <div className="chat-bubble-received">
                        <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">
                            {language === "sv" ? "Tänker..." : "Thinking..."}
                        </span>
                        </div>
                    </div>
                    </div>
              }
                <div ref={messagesEndRef} />
            </div>
            </div>

            


        </div>
        <div className="w-full max-w-4xl mx-auto px-4">
            {error &&
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <p className="text-sm">{error}</p>
                </div>
          }
            <div className="flex gap-3">
                <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={t("typeMessage")}
              disabled={isLoading}
              className="frosted-glass border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)] transition-colors resize-none"
              rows={2} />

                <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="premium-button p-4 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-50">

                    <Send size={20} className="text-white" />
                </button>
            </div>
             <p className="text-xs text-center mt-2 text-gray-500">
                {language === "sv" ?
            "Max 3 förfrågningar per minut" :
            "Max 3 requests per minute"}
            </p>
        </div>
      </div>
    </>);

}
