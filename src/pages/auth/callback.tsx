import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!router.isReady) return;

        const { type, token_hash, access_token, refresh_token } = router.query;

        // Handle invite type specially
        if (type === 'invite') {
          // For invites, we need to verify the token hash and create a session
          if (token_hash) {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token_hash as string,
              type: 'invite'
            });

            if (verifyError) {
              console.error("Invite verification error:", verifyError);
              setError("Inbjudningslänken är ogiltig eller har gått ut");
              setTimeout(() => router.push("/"), 3000);
              return;
            }

            // Session is now created, redirect to set password
            router.push("/auth/set-password");
            return;
          }
        }

        // Handle recovery (password reset)
        if (type === 'recovery') {
          if (token_hash) {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token_hash as string,
              type: 'recovery'
            });

            if (verifyError) {
              console.error("Recovery verification error:", verifyError);
              setError("Återställningslänken är ogiltig eller har gått ut");
              setTimeout(() => router.push("/"), 3000);
              return;
            }

            router.push("/auth/reset-password");
            return;
          }
        }

        // Handle email confirmation
        if (type === 'signup' || type === 'email_change') {
          if (token_hash) {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token_hash as string,
              type: type === 'signup' ? 'signup' : 'email_change'
            });

            if (verifyError) {
              console.error("Email verification error:", verifyError);
              setError("E-postverifieringen misslyckades");
              setTimeout(() => router.push("/"), 3000);
              return;
            }

            router.push("/auth/confirm-email?success=true");
            return;
          }
        }

        // Handle direct access_token (from some OAuth flows)
        if (access_token && refresh_token) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string
          });

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError("Kunde inte skapa session");
            setTimeout(() => router.push("/"), 3000);
            return;
          }

          // Session created, redirect to dashboard
          router.push("/");
          return;
        }

        // Default: check if we have a valid session already
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Already have a session, go to dashboard
          router.push("/");
        } else {
          // No session and no valid token, go to login
          setError("Ingen giltig session hittades");
          setTimeout(() => router.push("/"), 2000);
        }

      } catch (err: any) {
        console.error("Callback handling error:", err);
        setError("Ett oväntat fel uppstod");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    handleAuthCallback();
  }, [router.isReady, router.query]);

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Logo className="mb-8" />
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
            <h1 className="text-xl font-bold text-white mb-4">Något gick fel</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Omdirigerar till inloggning...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="text-center">
        <Logo className="mb-8" />
        <Loader2 size={48} className="mx-auto animate-spin text-[hsl(24,95%,53%)] mb-4" />
        <p className="text-white text-lg">Hanterar din begäran...</p>
        <p className="text-gray-400 text-sm mt-2">Du kommer snart att omdirigeras</p>
      </div>
    </div>
  );
}
