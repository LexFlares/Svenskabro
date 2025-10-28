import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Construction, Briefcase, MessageSquare, Shield, CheckCircle } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Branding & Info */}
            <div className="text-center md:text-left animate-slide-in-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                {APP_LOGO && (
                  <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16" />
                )}
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {APP_TITLE}
                </h1>
              </div>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Professionell plattform för broinspektion, underhåll och dokumentation
              </p>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <FeatureItem
                  icon={<Construction className="w-5 h-5" />}
                  text="24,517 broar i registret"
                />
                <FeatureItem
                  icon={<MessageSquare className="w-5 h-5" />}
                  text="End-to-end krypterad kommunikation"
                />
                <FeatureItem
                  icon={<Briefcase className="w-5 h-5" />}
                  text="Komplett jobbhantering & dagbok"
                />
                <FeatureItem
                  icon={<Shield className="w-5 h-5" />}
                  text="Offline-stöd för fältarbete"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Säker och pålitlig plattform</span>
              </div>
            </div>

            {/* Right Column - Login Card */}
            <div className="animate-slide-in-right">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Välkommen!
                  </h2>
                  <p className="text-gray-600">
                    Logga in för att komma åt din arbetsyta
                  </p>
                </div>

                {/* Login Button */}
                <a
                  href={getLoginUrl()}
                  className="block w-full"
                >
                  <button className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                    Logga in
                  </button>
                </a>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Säker inloggning</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-800 text-center">
                    🔒 All data är krypterad och säkrad enligt branschstandard
                  </p>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Har du problem med inloggningen?
                  </p>
                  <a href="mailto:support@svenskabroapp.se" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Kontakta support
                  </a>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>SSL-krypterad</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>GDPR-kompatibel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Allt du behöver för professionell brohantering
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Construction className="w-10 h-10 text-blue-600" />}
              title="Broregister"
              description="Komplett databas med kartvisning och detaljerad information om alla svenska broar"
            />
            <FeatureCard
              icon={<Briefcase className="w-10 h-10 text-indigo-600" />}
              title="Jobbhantering"
              description="Spåra arbeten med automatisk tidsregistrering och digital journal"
            />
            <FeatureCard
              icon={<MessageSquare className="w-10 h-10 text-purple-600" />}
              title="LexChat"
              description="Säker kommunikation med end-to-end kryptering för team och arbetsgrupper"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">© 2025 Svenska Bro Aktiebolag. All rights reserved.</p>
          <p className="text-sm">Utvecklad av LexFlares</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

