import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Auth session missing! Please click the invite link again.");
        setCheckingSession(false);
        setTimeout(() => router.push("/"), 3000);
        return;
      }
      
      setCheckingSession(false);
    };

    checkSession();
  }, [router]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Step 2: Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Kunde inte hämta användarinformation");
      }

      // Step 3: Create profile in profiles table
      console.log("Creating profile for user:", user.id, user.email);
      
      const profile = await authService.upsertProfile(
        user.id,
        user.email || "",
        user.user_metadata?.full_name as string | undefined,
        user.user_metadata
      );

      if (!profile) {
        console.warn("Profile creation returned null, but continuing...");
      } else {
        console.log("Profile created successfully:", profile);
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      console.error("Set password error:", err);
      setError(err.message || "Kunde inte sätta lösenord. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="text-center">
          <Logo className="mb-8" />
          <Loader2 size={48} className="mx-auto animate-spin text-[hsl(24,95%,53%)] mb-4" />
          <p className="text-white text-lg">Verifierar din session...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Logo className="mb-8" />
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
            <div className="mb-6">
              <CheckCircle className="mx-auto text-green-500" size={64} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Lösenord sparat!
            </h1>
            <p className="text-gray-400 mb-6">
              Ditt konto är nu aktiverat. Du omdirigeras till inloggningssidan...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(24,95%,53%)]"></div>
              <span>Omdirigerar om 3 sekunder</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Logo className="mb-8" />
        
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">
            Välkommen till LexHub!
          </h1>
          <p className="text-gray-400 mb-6">
            Skapa ditt lösenord för att komma igång
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nytt lösenord
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bekräfta lösenord
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ange lösenordet igen"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,48%)] text-white font-semibold py-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Aktiverar ditt konto...
                  </>
                ) : (
                  "Spara lösenord"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
            <p className="text-xs text-gray-500 text-center">
              Genom att skapa ett lösenord accepterar du villkoren för LexHub
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            LexHub - Utvecklad av LexFlares för Svenska Bro Aktiebolag
          </p>
        </div>
      </div>
    </div>
  );
}
