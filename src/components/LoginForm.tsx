import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/translations";
import { Fingerprint, Lock, User as UserIcon, Loader2, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { authService } from "@/services/authService";
import type { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (window.PublicKeyCredential) {
      setShowBiometric(true);
    }
  }, []);

  const handleBiometricLogin = async () => {
    alert(t("biometricNotSupported"));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const { error: resetErr } = await authService.resetPassword(resetEmail);

      if (resetErr) {
        setResetError(resetErr.message);
        setResetLoading(false);
        return;
      }

      setResetSuccess(true);
      setResetLoading(false);
    } catch (err) {
      console.error("Password reset error:", err);
      setResetError(t("language") === "sv" ? "Kunde inte skicka återställningslänk" : "Could not send reset link");
      setResetLoading(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSuccess(false);
    setResetError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { user: authUser, profile, error: authError } = await authService.signIn(email, password);

      if (authError || !authUser || !profile) {
        setError(authError?.message || t("invalidCredentials"));
        setIsLoading(false);
        return;
      }

      const user: User = {
        ...profile,
        id: authUser.id,
        email: authUser.email
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("svenska_bro_user", JSON.stringify(user));
        localStorage.setItem("biometric_username", email);
      }

      onLoginSuccess(user);
    } catch (err) {
      console.error("Login error:", err);
      setError(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="mb-6" />
          


          
        </div>

        <div className="premium-card space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <UserIcon size={16} className="text-[hsl(24,95%,53%)]" />
                {t("email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="frosted-glass border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)] transition-colors"
                placeholder={t("email")}
                disabled={isLoading}
                required />

            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock size={16} className="text-[hsl(24,95%,53%)]" />
                {t("password")}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="frosted-glass border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)] transition-colors"
                placeholder={t("password")}
                disabled={isLoading}
                required />

            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[hsl(24,95%,53%)] hover:text-[hsl(24,95%,63%)] transition-colors"
                disabled={isLoading}>

                {t("language") === "sv" ? "Glömt lösenord?" : "Forgot password?"}
              </button>
            </div>

            {error &&
            <div className="text-sm p-3 rounded-lg frosted-glass border border-red-500/30 text-red-400">
                {error}
              </div>
            }

            <Button
              type="submit"
              className="w-full premium-button text-base py-6"
              disabled={isLoading}>

              {isLoading ?
              <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  {t("language") === "sv" ? "Loggar in..." : "Logging in..."}
                </> :

              t("login")
              }
            </Button>

            {showBiometric &&
            <Button
              type="button"
              onClick={handleBiometricLogin}
              className="w-full frosted-glass border border-gray-700 text-gray-300 hover:bg-gray-800/50 transition-colors py-6"
              variant="outline"
              disabled={isLoading}>

                <Fingerprint size={18} className="mr-2" />
                {t("biometricLogin")}
              </Button>
            }
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500" style={{ color: "#f59e0b", fontStyle: "italic", fontWeight: "300" }}>
          This app is custom built for Svenska Bro Aktiebolag on the LexHub platform by LexFlares
        </div>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-[#1a1a1a] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Lock size={24} className="text-[hsl(24,95%,53%)]" />
              {t("language") === "sv" ? "Återställ lösenord" : "Reset Password"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("language") === "sv" ?
              "Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord." :
              "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ?
          <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400">
                  {t("language") === "sv" ?
                `✅ Återställningslänk skickad till ${resetEmail}. Kontrollera din e-post!` :
                `✅ Reset link sent to ${resetEmail}. Check your email!`}
                </p>
              </div>
              <Button
              onClick={closeForgotPasswordDialog}
              className="w-full premium-button">

                {t("language") === "sv" ? "Stäng" : "Close"}
              </Button>
            </div> :

          <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Mail size={16} className="text-[hsl(24,95%,53%)]" />
                  {t("email")}
                </label>
                <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t("language") === "sv" ? "din@email.se" : "your@email.com"}
                className="frosted-glass border-gray-700 text-white"
                disabled={resetLoading}
                required />

              </div>

              {resetError &&
            <div className="text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {resetError}
                </div>
            }

              <div className="flex gap-3">
                <Button
                type="button"
                onClick={closeForgotPasswordDialog}
                variant="outline"
                className="flex-1 frosted-glass border-gray-700 text-gray-300 hover:bg-gray-800/50"
                disabled={resetLoading}>

                  {t("language") === "sv" ? "Avbryt" : "Cancel"}
                </Button>
                <Button
                type="submit"
                className="flex-1 premium-button"
                disabled={resetLoading || !resetEmail.trim()}>

                  {resetLoading ?
                <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {t("language") === "sv" ? "Skickar..." : "Sending..."}
                    </> :

                <>
                      <Mail size={16} className="mr-2" />
                      {t("language") === "sv" ? "Skicka länk" : "Send Link"}
                    </>
                }
                </Button>
              </div>
            </form>
          }
        </DialogContent>
      </Dialog>
    </div>);

}