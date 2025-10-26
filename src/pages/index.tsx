import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import type { User } from "@/types";
import { useTranslation } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { authService } from "@/services/authService";
import { storage } from "@/lib/storage";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const { t, language } = useTranslation();

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      console.log("🔍 Checking auth session...");
      
      const localUser = storage.getUser();
      if (localUser && localUser.id && localUser.email) {
        console.log("✅ User found in localStorage:", localUser.id);
        setUser(localUser);
        setIsLoading(false);
        return;
      }

      const session = await authService.getCurrentSession();
      
      if (session && session.user) {
        console.log("✅ Session found for user:", session.user.id);
        console.log("📧 User email:", session.user.email);
        
        let profile = await authService.getProfile(session.user.id);
        
        if (!profile) {
          console.warn("⚠️ Profile not found in database, creating one...");
          profile = await authService.upsertProfile(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata?.full_name as string | undefined,
            session.user.user_metadata
          );
          
          if (!profile) {
            console.error("❌ Failed to create profile, logging out user");
            await authService.signOut();
            storage.clearUser();
            setIsLoading(false);
            return;
          }
          console.log("✅ Profile created successfully:", profile.id);
        } else {
          console.log("✅ Profile loaded from database:", profile.id, "Role:", profile.role);
        }
        
        const userData: User = {
          ...profile,
          id: session.user.id,
          email: session.user.email || profile.email || "",
        };
        
        setUser(userData);
        storage.saveUser(userData);
        console.log("✅ User state set successfully");
      } else {
        console.log("ℹ️ No active session found, clearing local user.");
        storage.clearUser();
      }
    } catch (error) {
      console.error("❌ Session check error:", error);
      await authService.signOut();
      storage.clearUser();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      storage.clearUser();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      storage.clearUser();
      setUser(null);
      window.location.href = "/";
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);

    if (regPassword.length < 6) {
      setRegError(language === "sv" ? "Lösenordet måste vara minst 6 tecken" : "Password must be at least 6 characters");
      setRegLoading(false);
      return;
    }

    try {
      const { user: authUser, profile, error } = await authService.signUp(
        regEmail,
        regPassword,
        regName
      );

      if (error || !authUser) {
        setRegError(error?.message || (language === "sv" ? "Registrering misslyckades" : "Registration failed"));
        setRegLoading(false);
        return;
      }

      if (profile && regPhone) {
        await authService.upsertProfile(authUser.id, authUser.email, regName, { phone: regPhone });
      }

      alert(
        language === "sv"
          ? `Välkommen! Kontrollera din e-post (${regEmail}) för att bekräfta ditt konto.`
          : `Welcome! Check your email (${regEmail}) to confirm your account.`
      );

      setShowRegistration(false);
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
    } catch (err) {
      console.error("Registration error:", err);
      setRegError(language === "sv" ? "Ett oväntat fel uppstod" : "An unexpected error occurred");
    } finally {
      setRegLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500"></div>
          <p className="text-white mt-4" suppressHydrationWarning>
            {mounted ? t("loading") : "Laddar..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegistration) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Logo className="mb-6" />
              <h1 className="text-3xl font-semibold text-white mb-2">
                {language === "sv" ? "Skapa konto" : "Create Account"}
              </h1>
              <p className="text-gray-400">
                {language === "sv" 
                  ? "Registrera dig för LexHub" 
                  : "Register for LexHub"}
              </p>
            </div>

            <Card className="premium-card">
              <CardContent className="pt-6">
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      {language === "sv" ? "Namn" : "Name"} *
                    </label>
                    <Input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={language === "sv" ? "Ditt namn" : "Your name"}
                      className="frosted-glass border-gray-700 text-white"
                      disabled={regLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Mail size={16} className="text-[hsl(24,95%,53%)]" />
                      {t("email")} *
                    </label>
                    <Input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={language === "sv" ? "din@email.se" : "your@email.com"}
                      className="frosted-glass border-gray-700 text-white"
                      disabled={regLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Smartphone size={16} className="text-[hsl(24,95%,53%)]" />
                      {language === "sv" ? "Telefonnummer" : "Phone Number"}
                    </label>
                    <Input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+46 XX XXX XX XX"
                      className="frosted-glass border-gray-700 text-white"
                      disabled={regLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      {t("password")} *
                    </label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={language === "sv" ? "Minst 6 tecken" : "At least 6 characters"}
                      className="frosted-glass border-gray-700 text-white"
                      disabled={regLoading}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">
                      {language === "sv" 
                        ? "Du får ett bekräftelsemail efter registrering" 
                        : "You will receive a confirmation email after registration"}
                    </p>
                  </div>

                  {regError && (
                    <div className="text-sm p-3 rounded-lg frosted-glass border border-red-500/30 text-red-400">
                      {regError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full premium-button py-6"
                    disabled={regLoading}
                  >
                    {regLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {language === "sv" ? "Skapar konto..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="mr-2" />
                        {language === "sv" ? "Skapa konto" : "Create Account"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setShowRegistration(false)}
                    className="w-full frosted-glass border border-gray-700 text-gray-300 hover:bg-gray-800/50"
                    variant="outline"
                    disabled={regLoading}
                  >
                    {language === "sv" ? "Tillbaka till inloggning" : "Back to Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-gray-500">
              {language === "sv" ? "Utvecklad av" : "Developed by"} <span className="text-[hsl(24,95%,53%)]">LexFlares</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <div className="fixed bottom-8 left-0 right-0 flex justify-center">
          <Button
            onClick={() => setShowRegistration(true)}
            className="frosted-glass border border-gray-700 text-white hover:bg-white/10"
            variant="outline"
          >
            <UserPlus size={16} className="mr-2" />
            {language === "sv" ? "Skapa konto" : "Create Account"}
          </Button>
        </div>
      </>
    );
  }

  return <Dashboard />;
}
