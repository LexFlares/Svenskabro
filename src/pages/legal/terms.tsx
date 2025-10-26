import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TermsOfService() {
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

        <h1 className="text-4xl font-bold mb-8 text-secondary">Användarvillkor</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">1. Godkännande av villkor</h2>
            <p className="text-gray-700 leading-relaxed">
              Genom att använda Svenska Bro-appen ("Tjänsten") godkänner du dessa användarvillkor. Om du inte 
              godkänner villkoren, får du inte använda Tjänsten. LexFlares AB ("vi", "oss", "vår") förbehåller 
              sig rätten att när som helst uppdatera dessa villkor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">2. Beskrivning av tjänsten</h2>
            <p className="text-gray-700 leading-relaxed">
              Svenska Bro är en professionell applikation för hantering av broinspektioner, arbetsorder och 
              trafikvarningar. Tjänsten inkluderar:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Broregister med detaljerad information om svenska broar</li>
              <li>Arbetsorderhantering och jobbspårning</li>
              <li>Realtidsvarningar för trafikhändelser</li>
              <li>GPS-positionering och kartfunktioner</li>
              <li>Dokumenthantering och PDF-generering</li>
              <li>Kommunikationsverktyg (chat, samtal)</li>
              <li>AI-assisterad support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">3. Användarkonto</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">3.1 Registrering</h3>
              <p className="text-gray-700 leading-relaxed">
                För att använda Tjänsten måste du skapa ett konto. Du måste:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mt-2">
                <li>Vara minst 16 år gammal</li>
                <li>Tillhandahålla korrekt och fullständig information</li>
                <li>Hålla din kontoinformation uppdaterad</li>
                <li>Skydda ditt lösenord och kontoinformation</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">3.2 Kontosäkerhet</h3>
              <p className="text-gray-700 leading-relaxed">
                Du är ansvarig för all aktivitet som sker under ditt konto. Du måste omedelbart meddela oss om 
                någon obehörig användning av ditt konto.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">3.3 Kontouppsägning</h3>
              <p className="text-gray-700 leading-relaxed">
                Du kan när som helst avsluta ditt konto genom att kontakta oss. Vi förbehåller oss rätten att 
                stänga av eller avsluta konton som bryter mot dessa villkor.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">4. Acceptabel användning</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Du får INTE använda Tjänsten för att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Bryta mot lagar eller förordningar</li>
              <li>Kränka andras rättigheter eller integritet</li>
              <li>Skicka skadlig kod, virus eller malware</li>
              <li>Försöka få obehörig åtkomst till system eller data</li>
              <li>Störa eller överbelasta Tjänstens infrastruktur</li>
              <li>Använda automatiserade system (bots) utan tillstånd</li>
              <li>Kopiera, modifiera eller distribuera Tjänstens innehåll utan tillstånd</li>
              <li>Använda Tjänsten för kommersiella ändamål utan avtal</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">5. Immateriella rättigheter</h2>
            <p className="text-gray-700 leading-relaxed">
              Tjänsten och allt innehåll (inklusive text, grafik, logotyper, ikoner, bilder, kod) ägs av 
              LexFlares AB eller våra licensgivare och skyddas av upphovsrätt, varumärken och andra lagar. 
              Du får en begränsad, icke-exklusiv, icke-överförbar licens att använda Tjänsten för personligt 
              eller internt affärsbruk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">6. Användarinnehåll</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">6.1 Ditt innehåll</h3>
              <p className="text-gray-700 leading-relaxed">
                Du behåller alla rättigheter till innehåll du laddar upp (foton, dokument, anteckningar). 
                Genom att ladda upp innehåll ger du oss en licens att lagra, bearbeta och visa innehållet 
                för att tillhandahålla Tjänsten.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">6.2 Ansvar för innehåll</h3>
              <p className="text-gray-700 leading-relaxed">
                Du är ensam ansvarig för innehåll du laddar upp. Du garanterar att du har rätt att ladda upp 
                innehållet och att det inte kränker någons rättigheter.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">7. Tredjepartstjänster</h2>
            <p className="text-gray-700 leading-relaxed">
              Tjänsten integrerar med tredjepartstjänster (Trafikverket API, väder-API, kartleverantörer). 
              Vi ansvarar inte för dessa tjänsters tillgänglighet, noggrannhet eller innehåll. Din användning 
              av tredjepartstjänster kan omfattas av deras egna villkor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">8. Tillgänglighet och support</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi strävar efter att hålla Tjänsten tillgänglig 24/7, men kan inte garantera oavbruten åtkomst. 
              Vi kan tillfälligt stänga av Tjänsten för underhåll, uppgraderingar eller av andra skäl. 
              Support tillhandahålls via e-post under kontorstid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">9. Avgifter och betalning</h2>
            <p className="text-gray-700 leading-relaxed">
              Vissa funktioner kan kräva betalning. Avgifter anges tydligt innan köp. Betalningar är 
              icke-återbetalningsbara om inte annat anges. Vi förbehåller oss rätten att ändra priser 
              med 30 dagars varsel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">10. Ansvarsfriskrivning</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-4">
              <p className="text-yellow-900 font-semibold mb-2">VIKTIGT - LÄS NOGGRANT</p>
              <p className="text-yellow-800 leading-relaxed">
                TJÄNSTEN TILLHANDAHÅLLS "SOM DEN ÄR" OCH "SOM TILLGÄNGLIG" UTAN GARANTIER AV NÅGOT SLAG, 
                VARE SIG UTTRYCKLIGA ELLER UNDERFÖRSTÅDDA. VI GARANTERAR INTE ATT TJÄNSTEN KOMMER ATT VARA 
                FELFRI, SÄKER ELLER OAVBRUTEN. VI ANSVARAR INTE FÖR FÖRLUST AV DATA, VINST ELLER ANDRA 
                SKADOR SOM UPPSTÅR FRÅN ANVÄNDNING AV TJÄNSTEN.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">11. Ansvarsbegränsning</h2>
            <p className="text-gray-700 leading-relaxed">
              I den utsträckning som tillåts enligt lag, ska vårt totala ansvar för alla anspråk relaterade 
              till Tjänsten inte överstiga det belopp du betalat till oss under de senaste 12 månaderna, 
              eller 1000 SEK, beroende på vilket som är högre.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">12. Skadeersättning</h2>
            <p className="text-gray-700 leading-relaxed">
              Du samtycker till att försvara, ersätta och hålla LexFlares AB, dess tjänstemän, direktörer, 
              anställda och agenter skadeslösa från alla anspråk, skador, förluster och utgifter (inklusive 
              advokatarvoden) som uppstår från din användning av Tjänsten eller brott mot dessa villkor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">13. Ändringar av tjänsten</h2>
            <p className="text-gray-700 leading-relaxed">
              Vi förbehåller oss rätten att när som helst ändra, uppdatera eller avbryta Tjänsten eller 
              delar av den, med eller utan förvarning. Vi ansvarar inte för eventuella ändringar, 
              prisändringar, upphävanden eller avbrott av Tjänsten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">14. Tillämplig lag och tvister</h2>
            <p className="text-gray-700 leading-relaxed">
              Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom förhandling. 
              Om förhandling misslyckas ska tvister avgöras av svensk domstol med Stockholm som första instans.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">15. Separabilitet</h2>
            <p className="text-gray-700 leading-relaxed">
              Om någon bestämmelse i dessa villkor anses ogiltig eller omöjlig att verkställa, ska de 
              återstående bestämmelserna fortsätta att gälla.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">16. Hela avtalet</h2>
            <p className="text-gray-700 leading-relaxed">
              Dessa användarvillkor, tillsammans med vår{' '}
              <Link href="/legal/privacy" className="text-primary hover:underline">Integritetspolicy</Link> och{' '}
              <Link href="/legal/cookies" className="text-primary hover:underline">Cookie-policy</Link>, utgör hela 
              avtalet mellan dig och LexFlares AB angående användning av Tjänsten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-secondary">17. Kontakta oss</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Om du har frågor om dessa användarvillkor, kontakta oss:
            </p>
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">LexFlares AB</p>
              <p className="text-gray-700">Khreshchatyk Street 22</p>
              <p className="text-gray-700">01001 Kyiv, Ukraine</p>
              <p className="text-gray-700 mt-2">E-post: <a href="mailto:legal@lexflares.com" className="text-primary hover:underline">legal@lexflares.com</a></p>
              <p className="text-gray-700">Telefon: +380 44 123 4567</p>
              <p className="text-gray-700 mt-2">Webbplats: <a href="https://www.lexflares.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.lexflares.com</a></p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-blue-900 font-semibold mb-2">Godkännande</p>
            <p className="text-blue-800">
              Genom att använda Svenska Bro-appen bekräftar du att du har läst, förstått och godkänt dessa 
              användarvillkor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

