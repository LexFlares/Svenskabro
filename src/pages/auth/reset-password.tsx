
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/lib/translations";
import { authService } from "@/services/authService";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError(language === "sv" ? "Lösenordet måste vara minst 6 tecken" : "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === "sv" ? "Lösenorden matchar inte" : "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await authService.updatePassword(newPassword);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(language === "sv" ? "Ett oväntat fel uppstod" : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500"></div>
          <p className="text-white mt-4">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="mb-6" />
          <h1 className="text-3xl font-semibold text-white mb-2">
            {language === "sv" ? "Återställ lösenord" : "Reset Password"}
          </h1>
          <p className="text-gray-400">
            {language === "sv" 
              ? "Ange ditt nya lösenord nedan" 
              : "Enter your new password below"}
          </p>
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock size={24} className="text-[hsl(24,95%,53%)]" />
              {language === "sv" ? "Nytt lösenord" : "New Password"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {language === "sv" 
                ? "Välj ett starkt lösenord med minst 6 tecken" 
                : "Choose a strong password with at least 6 characters"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {language === "sv" ? "Lösenord uppdaterat!" : "Password Updated!"}
                  </h3>
                  <p className="text-gray-400">
                    {language === "sv" 
                      ? "Omdirigerar till inloggning..." 
                      : "Redirecting to login..."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {language === "sv" ? "Nytt lösenord" : "New Password"}
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === "sv" ? "Minst 6 tecken" : "At least 6 characters"}
                    className="frosted-glass border-gray-700 text-white"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {language === "sv" ? "Bekräfta lösenord" : "Confirm Password"}
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === "sv" ? "Bekräfta lösenord" : "Confirm password"}
                    className="frosted-glass border-gray-700 text-white"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full premium-button py-6"
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      {language === "sv" ? "Uppdaterar..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Lock size={18} className="mr-2" />
                      {language === "sv" ? "Uppdatera lösenord" : "Update Password"}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full frosted-glass border-gray-700 text-gray-300 hover:bg-gray-800/50"
                  disabled={isLoading}
                >
                  {language === "sv" ? "Tillbaka till inloggning" : "Back to Login"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          {language === "sv" ? "Utvecklad av" : "Developed by"} <span className="text-[hsl(24,95%,53%)]">LexFlares</span>
        </div>
      </div>
    </div>
  );
}
