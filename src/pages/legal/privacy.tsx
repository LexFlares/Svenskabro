import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className="mb-8 text-primary hover:text-primary-dark flex items-center gap-2"
        >
          ← Tillbaka
        </button>

        <h1 className="text-4xl font-bold mb-8 text-secondary">Integritetspolicy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">1. Inledning</h2>
            <p className="text-gray-700 leading-relaxed">
              LexFlares AB ("vi", "oss", "vår") värnar om din integritet och är engagerade i att skydda dina personuppgifter. 
              Denna integritetspolicy beskriver hur vi samlar in, använder, lagrar och skyddar dina personuppgifter när du 
              använder Svenska Bro-appen ("Tjänsten").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">2. Personuppgifter vi samlar in</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vi samlar in följande typer av personuppgifter:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Kontoinformation:</strong> Namn, e-postadress, telefonnummer</li>
              <li><strong>Platsdata:</strong> GPS-koordinater för brobesök och arbetsplatser</li>
              <li><strong>Arbetsdata:</strong> Jobbinformation, foton, anteckningar, inspektionsdata</li>
              <li><strong>Kommunikationsdata:</strong> Chattmeddelanden, samtalsinformation</li>
              <li><strong>Teknisk data:</strong> IP-adress, enhetstyp, webbläsare, användningsstatistik</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">3. Hur vi använder dina personuppgifter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vi använder dina personuppgifter för att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Tillhandahålla och förbättra Tjänsten</li>
              <li>Hantera ditt konto och autentisering</li>
              <li>Spara och synkronisera dina arbetsdata</li>
              <li>Skicka trafikvarningar och realtidsuppdateringar</li>
              <li>Generera rapporter och PDF-dokument</li>
              <li>Kommunicera med dig om Tjänsten</li>
              <li>Analysera användning för att förbättra funktionalitet</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">4. Rättslig grund för behandling</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi behandlar dina personuppgifter baserat på:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Avtal:</strong> För att fullgöra vårt avtal med dig</li>
              <li><strong>Samtycke:</strong> När du har gett ditt samtycke (t.ex. för platsdata)</li>
              <li><strong>Berättigat intresse:</strong> För att förbättra Tjänsten och säkerhet</li>
              <li><strong>Rättslig förpliktelse:</strong> När vi är skyldiga enligt lag</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">5. Delning av personuppgifter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vi delar dina personuppgifter med:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Supabase:</strong> Vår databas- och autentiseringsleverantör</li>
              <li><strong>Vercel:</strong> Vår hostingleverantör</li>
              <li><strong>Trafikverket API:</strong> För trafikvarningar och vägdata</li>
              <li><strong>OpenWeather API:</strong> För väderdata</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Vi säljer aldrig dina personuppgifter till tredje part.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">6. Lagring och säkerhet</h2>
            <p className="text-gray-700 leading-relaxed">
              Dina personuppgifter lagras säkert i Supabase datacenter inom EU. Vi använder branschstandarder 
              för säkerhet inklusive kryptering, säker autentisering och regelbundna säkerhetsgranskningar. 
              Vi lagrar dina uppgifter så länge du har ett aktivt konto, eller enligt lag.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">7. Dina rättigheter</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Enligt GDPR har du rätt att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Tillgång:</strong> Begära en kopia av dina personuppgifter</li>
              <li><strong>Rättelse:</strong> Korrigera felaktiga uppgifter</li>
              <li><strong>Radering:</strong> Begära att vi raderar dina uppgifter</li>
              <li><strong>Begränsning:</strong> Begränsa behandlingen av dina uppgifter</li>
              <li><strong>Portabilitet:</strong> Få dina uppgifter i ett strukturerat format</li>
              <li><strong>Invändning:</strong> Invända mot behandling av dina uppgifter</li>
              <li><strong>Återkalla samtycke:</strong> När som helst</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              För att utöva dina rättigheter, kontakta oss på <a href="mailto:privacy@lexflares.com" className="text-primary hover:underline">privacy@lexflares.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">8. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi använder cookies och liknande teknologier för att förbättra din upplevelse. Se vår{' '}
              <Link href="/legal/cookies" className="text-primary hover:underline">Cookie-policy</Link> för mer information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">9. Barn</h2>
            <p className="text-gray-700 leading-relaxed">
              Tjänsten är inte avsedd för barn under 16 år. Vi samlar inte medvetet in personuppgifter från barn.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">10. Ändringar i policyn</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi kan uppdatera denna policy från tid till annan. Vi kommer att meddela dig om väsentliga ändringar 
              via e-post eller genom en notis i Tjänsten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">11. Kontakta oss</h2>
            <p className="text-gray-700 leading-relaxed">
              Om du har frågor om denna integritetspolicy, kontakta oss:
            </p>
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">LexFlares AB</p>
              <p className="text-gray-700">Khreshchatyk Street 22</p>
              <p className="text-gray-700">01001 Kyiv, Ukraine</p>
              <p className="text-gray-700 mt-2">E-post: <a href="mailto:privacy@lexflares.com" className="text-primary hover:underline">privacy@lexflares.com</a></p>
              <p className="text-gray-700">Telefon: +380 44 123 4567</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">12. Tillsynsmyndighet</h2>
            <p className="text-gray-700 leading-relaxed">
              Du har rätt att lämna in ett klagomål till Integritetsskyddsmyndigheten (IMY) om du anser att 
              vi behandlar dina personuppgifter i strid med GDPR.
            </p>
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">Integritetsskyddsmyndigheten</p>
              <p className="text-gray-700">Box 8114</p>
              <p className="text-gray-700">104 20 Stockholm</p>
              <p className="text-gray-700 mt-2">E-post: <a href="mailto:imy@imy.se" className="text-primary hover:underline">imy@imy.se</a></p>
              <p className="text-gray-700">Webbplats: <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.imy.se</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

