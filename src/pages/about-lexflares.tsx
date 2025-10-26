import { useRouter } from "next/router";
import { ArrowLeft, Globe, Mail, Zap, Shield, Cloud, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";

export default function AboutLexFlaresPage() {
  const router = useRouter();
  const { t, language } = useTranslation();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">
            {language === "sv" ? "Om LexFlares" : "About LexFlares"}
          </h1>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="premium-card text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-3">LexFlares</h2>
              <p className="text-gray-300 text-lg">
                {language === "sv" 
                  ? "Innovativa lösningar för moderna arbetsplatser" 
                  : "Innovative Solutions for Modern Workplaces"}
              </p>
            </div>
            
            <a
              href="https://www.lexflares.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[hsl(24,95%,53%)] hover:underline"
            >
              <Globe size={18} />
              <span>www.lexflares.com</span>
            </a>
          </div>

          <div className="premium-card border-l-4 border-[hsl(24,95%,53%)]">
            <h3 className="text-xl font-semibold text-white mb-4">
              {language === "sv" ? "Vår Produktsvit" : "Our Product Suite"}
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-blue-500/10">
                  <Cloud size={24} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">LexHub</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === "sv"
                      ? "Den centrala plattformen för arbetsflöden, projekthantering och datasynkronisering. Bygger på säkra molntjänster med kryptering i världsklass."
                      : "The central platform for workflows, project management, and data synchronization. Built on secure cloud services with world-class encryption."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-cyan-500/10">
                  <MessageSquare size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">LexChat</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === "sv"
                      ? "Krypterad kommunikationsplattform med chatt, röst- och videosamtal. End-to-end-kryptering säkerställer att endast rätt personer har tillgång till information."
                      : "Encrypted communication platform with chat, voice, and video calls. End-to-end encryption ensures that only the right people have access to information."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gray-500/10">
                  <Zap size={24} className="text-gray-300" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">LexAI</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === "sv"
                      ? "AI-driven assistent som stödjer arbetsteam med intelligent analys, sammanfattningar och åtgärdsförslag. Anpassad för branschspecifika behov."
                      : "AI-driven assistant that supports work teams with intelligent analysis, summaries, and action suggestions. Customized for industry-specific needs."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-500/10">
                  <Cloud size={24} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">LexCloud</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === "sv"
                      ? "Säker molnlagring och synkronisering för alla dina dokument och projektdata. Automatisk backup och versionskontroll ingår."
                      : "Secure cloud storage and synchronization for all your documents and project data. Automatic backup and version control included."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border-l-4 border-green-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-green-500/10">
                <Shield size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {language === "sv" ? "Support 24/7" : "24/7 Support"}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {language === "sv"
                    ? "Vårt supportteam finns här för dig dygnet runt. Kontakta oss när du behöver hjälp eller har frågor."
                    : "Our support team is here for you around the clock. Contact us when you need help or have questions."}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-gray-300" />
                    <span className="text-sm text-gray-300">
                      {language === "sv" ? "Via LexAI i appen" : "Via LexAI in the app"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[hsl(24,95%,53%)]" />
                    <a
                      href="mailto:ops@lexflares.com"
                      className="text-sm text-[hsl(24,95%,53%)] hover:underline"
                    >
                      ops@lexflares.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card text-center">
            <p className="text-sm text-gray-400 leading-relaxed">
              {language === "sv"
                ? "LexFlares utvecklar skräddarsydda lösningar för företag som värdesätter säkerhet, effektivitet och innovation. Denna app är en licensierad implementation av LexHub-plattformen."
                : "LexFlares develops custom solutions for companies that value security, efficiency, and innovation. This app is a licensed implementation of the LexHub platform."}
            </p>
            <div className="mt-4 text-xs text-gray-500">
              © {new Date().getFullYear()} LexFlares. {language === "sv" ? "Alla rättigheter förbehållna." : "All rights reserved."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
