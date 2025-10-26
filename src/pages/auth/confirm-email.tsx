
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/lib/translations";
import { authService } from "@/services/authService";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const { token_hash, type } = router.query;

      if (!token_hash || typeof token_hash !== 'string') {
        setStatus('error');
        setMessage(language === "sv" ? "Ogiltig bekräftelselänk" : "Invalid confirmation link");
        return;
      }

      try {
        const { user, error } = await authService.confirmEmail(
          token_hash, 
          (type as 'signup' | 'recovery' | 'email_change') || 'signup'
        );

        if (error || !user) {
          setStatus('error');
          setMessage(error?.message || (language === "sv" ? "Bekräftelse misslyckades" : "Confirmation failed"));
          return;
        }

        setStatus('success');
        setMessage(language === "sv" ? "E-post bekräftad! Omdirigerar..." : "Email confirmed! Redirecting...");

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (err) {
        console.error("Email confirmation error:", err);
        setStatus('error');
        setMessage(language === "sv" ? "Ett oväntat fel uppstod" : "An unexpected error occurred");
      }
    };

    if (router.isReady) {
      handleEmailConfirmation();
    }
  }, [router.isReady, router.query, language]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="mb-6" />
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-center text-white">
              {language === "sv" ? "E-postbekräftelse" : "Email Confirmation"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 size={48} className="mx-auto animate-spin text-[hsl(24,95%,53%)]" />
                <p className="text-gray-400">
                  {language === "sv" ? "Bekräftar din e-post..." : "Confirming your email..."}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {language === "sv" ? "Bekräftelse lyckades!" : "Confirmation Successful!"}
                  </h3>
                  <p className="text-gray-400">{message}</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle size={32} className="text-red-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {language === "sv" ? "Bekräftelse misslyckades" : "Confirmation Failed"}
                  </h3>
                  <p className="text-gray-400">{message}</p>
                </div>
                <Button
                  onClick={() => router.push("/")}
                  className="w-full premium-button"
                >
                  {language === "sv" ? "Tillbaka till inloggning" : "Back to Login"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
