import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Construction, Briefcase, MessageSquare, Shield } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />}
            <span className="font-bold text-xl text-blue-900">{APP_TITLE}</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Logga in</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-blue-900 mb-6">
            Professionell Broinspektion & Underhåll
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            En komplett mobil-first plattform för fältpersonal och administration. 
            Hantera broregister, jobb, dokumentation och kommunikation - allt på ett ställe.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Kom igång</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
          Huvudfunktioner
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Construction className="w-12 h-12 text-blue-600" />}
            title="Broregister"
            description="Komplett register med kartvisning och detaljerad information om alla broar"
          />
          <FeatureCard
            icon={<Briefcase className="w-12 h-12 text-blue-600" />}
            title="Jobbhantering"
            description="Registrera jobb med automatisk tidrapportering och digital journal"
          />
          <FeatureCard
            icon={<MessageSquare className="w-12 h-12 text-blue-600" />}
            title="LexChat"
            description="Säker end-to-end krypterad kommunikation mellan team och arbetsgrupper"
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-blue-600" />}
            title="Offline-stöd"
            description="Arbeta var som helst med offline-funktionalitet och automatisk synkronisering"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Redo att komma igång?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Logga in för att få tillgång till alla funktioner
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>Logga in nu</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Svenska Bro Aktiebolag. All rights reserved.</p>
          <p className="text-sm mt-2">Utvecklad av LexFlares</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-blue-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

