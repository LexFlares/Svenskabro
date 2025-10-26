import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CookiesPolicy() {
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

        <h1 className="text-4xl font-bold mb-8 text-secondary">Cookie-policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">1. Vad är cookies?</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De används för att 
              förbättra din upplevelse, komma ihåg dina preferenser och analysera hur webbplatsen används.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">2. Hur vi använder cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Svenska Bro-appen använder cookies för att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Hålla dig inloggad mellan sessioner</li>
              <li>Komma ihåg dina preferenser och inställningar</li>
              <li>Analysera hur appen används för att förbättra funktionalitet</li>
              <li>Säkerställa säkerhet och förhindra missbruk</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">3. Typer av cookies vi använder</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900">3.1 Nödvändiga cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Dessa cookies är nödvändiga för att appen ska fungera. De kan inte stängas av.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cookie-namn</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Syfte</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giltighetstid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">sb-access-token</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Autentisering och inloggning</td>
                      <td className="px-4 py-3 text-sm text-gray-700">1 timme</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">sb-refresh-token</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Förnya autentisering</td>
                      <td className="px-4 py-3 text-sm text-gray-700">30 dagar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900">3.2 Funktionella cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Dessa cookies gör det möjligt för appen att komma ihåg dina val och preferenser.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cookie-namn</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Syfte</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giltighetstid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">user-preferences</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Sparar språk och inställningar</td>
                      <td className="px-4 py-3 text-sm text-gray-700">1 år</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">map-settings</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Sparar kartinställningar</td>
                      <td className="px-4 py-3 text-sm text-gray-700">6 månader</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900">3.3 Analytiska cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Dessa cookies hjälper oss förstå hur appen används så vi kan förbättra den.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cookie-namn</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Syfte</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giltighetstid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">_ga</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Google Analytics - användningsstatistik</td>
                      <td className="px-4 py-3 text-sm text-gray-700">2 år</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">_gid</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Google Analytics - sessionsdata</td>
                      <td className="px-4 py-3 text-sm text-gray-700">24 timmar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">4. Tredjepartscookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vi använder tjänster från tredje part som kan sätta egna cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Supabase:</strong> För autentisering och databasåtkomst</li>
              <li><strong>Vercel:</strong> För hosting och prestanda</li>
              <li><strong>Google Analytics:</strong> För användningsstatistik (om aktiverat)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">5. Hantera cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Du kan kontrollera och hantera cookies på flera sätt:
            </p>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">I webbläsaren</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                De flesta webbläsare låter dig:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Se vilka cookies som är lagrade</li>
                <li>Radera alla eller specifika cookies</li>
                <li>Blockera cookies från specifika webbplatser</li>
                <li>Blockera alla tredjepartscookies</li>
                <li>Radera alla cookies när du stänger webbläsaren</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Observera:</strong> Om du blockerar alla cookies kan vissa funktioner i appen sluta fungera, 
                särskilt inloggning och preferenser.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">Webbläsarspecifika instruktioner</h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <strong>Chrome:</strong>{' '}
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    support.google.com/chrome/answer/95647
                  </a>
                </li>
                <li>
                  <strong>Firefox:</strong>{' '}
                  <a href="https://support.mozilla.org/sv/kb/kakor" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    support.mozilla.org/sv/kb/kakor
                  </a>
                </li>
                <li>
                  <strong>Safari:</strong>{' '}
                  <a href="https://support.apple.com/sv-se/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    support.apple.com/sv-se/guide/safari
                  </a>
                </li>
                <li>
                  <strong>Edge:</strong>{' '}
                  <a href="https://support.microsoft.com/sv-se/microsoft-edge/ta-bort-cookies-i-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    support.microsoft.com/sv-se/microsoft-edge
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">6. Lokal lagring och sessionslagring</h2>
            <p className="text-gray-700 leading-relaxed">
              Förutom cookies använder vi också webbläsarens lokala lagring (localStorage) och sessionslagring 
              (sessionStorage) för att lagra data lokalt på din enhet. Detta inkluderar:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Cachad data för snabbare laddning</li>
              <li>Offline-funktionalitet</li>
              <li>Tillfälliga arbetsdata</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">7. Uppdateringar av denna policy</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi kan uppdatera denna cookie-policy för att återspegla ändringar i vår användning av cookies. 
              Vi rekommenderar att du regelbundet granskar denna sida.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">8. Kontakta oss</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Om du har frågor om vår användning av cookies, kontakta oss:
            </p>
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">LexFlares AB</p>
              <p className="text-gray-700">Khreshchatyk Street 22</p>
              <p className="text-gray-700">01001 Kyiv, Ukraine</p>
              <p className="text-gray-700 mt-2">E-post: <a href="mailto:privacy@lexflares.com" className="text-primary hover:underline">privacy@lexflares.com</a></p>
              <p className="text-gray-700">Telefon: +380 44 123 4567</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">9. Mer information</h2>
            <p className="text-gray-700 leading-relaxed">
              För mer information om hur vi behandlar dina personuppgifter, se vår{' '}
              <Link href="/legal/privacy" className="text-primary hover:underline">Integritetspolicy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

