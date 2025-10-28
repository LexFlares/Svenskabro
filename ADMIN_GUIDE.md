# Svenska Bro App - Administratörsguide

**Komplett guide för administratörer av Svenska Bro App**

## 📋 Innehållsförteckning

1. [Admin-panelen](#admin-panelen)
2. [Användarhantering](#användarhantering)
3. [Systemövervakning](#systemövervakning)
4. [Databashantering](#databashantering)
5. [Säkerhet & Behörigheter](#säkerhet--behörigheter)
6. [Backup & Återställning](#backup--återställning)
7. [Prestanda & Optimering](#prestanda--optimering)
8. [Felsökning](#felsökning)

---

## Admin-panelen

Admin-panelen är ditt kontrollcenter för att hantera Svenska Bro App. För att komma åt admin-panelen måste du ha administratörsrättigheter.

### Åtkomst

1. Logga in med ditt admin-konto
2. Navigera till `/admin` eller klicka på "Admin" i menyn
3. Du ser nu admin-dashboarden

### Dashboard-översikt

Admin-dashboarden visar:

| Widget | Beskrivning |
|--------|-------------|
| **Användarstatistik** | Totalt antal användare, aktiva användare (senaste 7 dagarna), nya användare (senaste 30 dagarna) |
| **Systemhälsa** | CPU-användning, minnesanvändning, databasanslutningar, API-status |
| **Aktivitetslogg** | Senaste systemhändelser och användaraktiviteter |
| **Datastatistik** | Antal broar, jobb, meddelanden, dokument, avvikelser |
| **Felrapporter** | Senaste fel och varningar som kräver uppmärksamhet |

---

## Användarhantering

### Visa användare

**Användarlista:**
1. Gå till "Användare" i admin-panelen
2. Se alla registrerade användare med:
   - Namn och email
   - Roll (Admin/Användare)
   - Status (Aktiv/Inaktiv)
   - Senaste inloggning
   - Registreringsdatum

**Filtrera användare:**
- Efter roll
- Efter status
- Efter arbetsgrupp
- Efter registreringsdatum

**Sök användare:**
- Sök på namn, email eller ID
- Resultaten uppdateras i realtid

### Skapa ny användare

1. Klicka på "Lägg till användare"
2. Fyll i:
   - Email (obligatoriskt)
   - Namn
   - Roll (Admin/Användare)
   - Arbetsgrupp
   - Temporärt lösenord
3. Klicka på "Skapa"
4. Användaren får ett email med inloggningsuppgifter

### Redigera användare

1. Klicka på användaren i listan
2. Uppdatera information:
   - Namn
   - Email
   - Roll
   - Status (Aktiv/Inaktiv)
   - Arbetsgrupp
3. Klicka på "Spara ändringar"

### Ändra användarroll

**Uppgradera till admin:**
1. Öppna användaren
2. Klicka på "Ändra roll"
3. Välj "Admin"
4. Bekräfta ändringen
5. Användaren får nu tillgång till admin-panelen

**Nedgradera från admin:**
1. Öppna användaren
2. Klicka på "Ändra roll"
3. Välj "Användare"
4. Bekräfta ändringen
5. Användaren förlorar tillgång till admin-panelen

### Inaktivera användare

**Tillfällig inaktivering:**
1. Öppna användaren
2. Klicka på "Inaktivera"
3. Användaren kan inte längre logga in
4. Data bevaras i systemet

**Permanent radering:**
1. Öppna användaren
2. Klicka på "Radera användare"
3. Bekräfta radering
4. **Varning:** All användardata raderas permanent

### Återställa lösenord

**För en användare:**
1. Öppna användaren
2. Klicka på "Återställ lösenord"
3. Ett nytt temporärt lösenord genereras
4. Skicka lösenordet till användaren via säker kanal

**Massåterställning:**
1. Välj flera användare
2. Klicka på "Återställ lösenord (flera)"
3. Nya lösenord genereras
4. Exportera lista med nya lösenord

---

## Systemövervakning

### Realtidsövervakning

**Systemhälsa:**
- **CPU-användning:** Bör vara under 70% i normalt läge
- **Minnesanvändning:** Övervaka för minnesläckor
- **Databasanslutningar:** Max 100 samtidiga anslutningar
- **API-svarstider:** Bör vara under 200ms

**Varningar:**
- Gul varning vid 70% resursanvändning
- Röd varning vid 90% resursanvändning
- Kritisk varning vid systemfel

### Aktivitetslogg

**Visa aktiviteter:**
1. Gå till "Aktivitetslogg" i admin-panelen
2. Se alla systemhändelser:
   - Användarinloggningar
   - Dataändringar
   - API-anrop
   - Fel och varningar

**Filtrera logg:**
- Efter händelsetyp
- Efter användare
- Efter datum/tid
- Efter allvarlighetsnivå

**Exportera logg:**
1. Välj tidsperiod
2. Klicka på "Exportera"
3. Välj format (CSV/JSON/PDF)
4. Loggen laddas ner

### Felrapportering

**Visa fel:**
1. Gå till "Felrapporter"
2. Se alla systemfel med:
   - Felmeddelande
   - Stack trace
   - Tidpunkt
   - Användare (om tillämpligt)
   - Påverkade funktioner

**Hantera fel:**
- Markera som löst
- Tilldela till utvecklare
- Lägg till kommentar
- Eskalera till support

---

## Databashantering

### Databasöversikt

**Statistik:**
| Tabell | Antal poster | Storlek | Senaste uppdatering |
|--------|--------------|---------|---------------------|
| broar | 24,517 | 45 MB | 2025-10-28 |
| jobs | 1,234 | 12 MB | 2025-10-28 |
| chat_messages | 45,678 | 89 MB | 2025-10-28 |
| deviations | 567 | 8 MB | 2025-10-28 |
| documents | 890 | 234 MB | 2025-10-28 |
| profiles | 156 | 2 MB | 2025-10-28 |

### Databasunderhåll

**Optimera databas:**
1. Gå till "Databasunderhåll"
2. Klicka på "Optimera"
3. Systemet kör:
   - VACUUM (PostgreSQL)
   - Indexoptimering
   - Statistikuppdatering
4. Processen kan ta 5-10 minuter

**Rensa gammal data:**
1. Välj datatyp (t.ex. gamla jobb)
2. Ange tidsperiod (t.ex. äldre än 2 år)
3. Förhandsgranska vad som kommer raderas
4. Bekräfta radering
5. Data arkiveras innan radering

### SQL-konsol

**Köra SQL-frågor:**
1. Gå till "SQL-konsol"
2. Skriv din SQL-fråga
3. Klicka på "Kör"
4. Resultat visas i tabell

**Varning:** Använd SQL-konsolen med försiktighet. Felaktiga frågor kan skada databasen.

**Exempel på användbara frågor:**

```sql
-- Hitta inaktiva användare (inte inloggat på 90 dagar)
SELECT email, name, last_signed_in 
FROM users 
WHERE last_signed_in < NOW() - INTERVAL '90 days';

-- Antal jobb per användare
SELECT u.name, COUNT(j.id) as job_count
FROM users u
LEFT JOIN jobs j ON u.id = j.user_id
GROUP BY u.name
ORDER BY job_count DESC;

-- Avvikelser per allvarlighetsnivå
SELECT severity, COUNT(*) as count
FROM deviations
GROUP BY severity;
```

---

## Säkerhet & Behörigheter

### Row Level Security (RLS)

Svenska Bro App använder Supabase RLS för att säkerställa datasäkerhet.

**Verifiera RLS-policies:**
1. Gå till "Säkerhet" > "RLS-policies"
2. Se alla aktiva policies
3. Testa policies med olika användare

**Skapa ny RLS-policy:**
1. Välj tabell
2. Definiera policy:
   - Namn
   - Operation (SELECT/INSERT/UPDATE/DELETE)
   - Villkor (SQL-uttryck)
3. Testa policyn
4. Aktivera

**Exempel på RLS-policy:**

```sql
-- Användare kan endast se sina egna jobb
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = user_id);
```

### API-säkerhet

**API-nycklar:**
1. Gå till "Säkerhet" > "API-nycklar"
2. Se alla aktiva nycklar
3. Rotera nycklar regelbundet (rekommenderat: var 90:e dag)

**Rate limiting:**
- Standard: 100 requests/minut per användare
- Admin: 1000 requests/minut
- Anpassa vid behov

**CORS-inställningar:**
1. Gå till "Säkerhet" > "CORS"
2. Lägg till tillåtna domäner
3. Konfigurera tillåtna metoder
4. Spara ändringar

### Autentisering

**OAuth-providers:**
1. Gå till "Säkerhet" > "OAuth"
2. Aktivera/inaktivera providers:
   - Google
   - GitHub
   - Microsoft
3. Konfigurera client ID och secret
4. Testa inloggning

**Tvåfaktorsautentisering (2FA):**
1. Gå till "Säkerhet" > "2FA"
2. Aktivera 2FA för:
   - Alla användare (obligatoriskt)
   - Endast admins
   - Valfritt
3. Välj 2FA-metod:
   - Autentiseringsapp (rekommenderat)
   - SMS
   - Email

### Säkerhetsgranskningar

**Granska säkerhetshändelser:**
1. Gå till "Säkerhet" > "Granskningslogg"
2. Se alla säkerhetsrelaterade händelser:
   - Misslyckade inloggningsförsök
   - Lösenordsändringar
   - Rolländringar
   - API-nyckelrotationer

**Exportera granskningslogg:**
- För compliance och revision
- Format: CSV, JSON, PDF
- Krypterad export för känslig data

---

## Backup & Återställning

### Automatiska backups

**Konfiguration:**
1. Gå till "Backup" > "Inställningar"
2. Konfigurera:
   - Frekvens (daglig/veckovis/månatlig)
   - Tidpunkt (rekommenderat: nattetid)
   - Retention (hur länge backups sparas)
   - Lagringsplats (S3, lokal, etc.)
3. Aktivera automatiska backups

**Backup-schema:**
| Typ | Frekvens | Retention |
|-----|----------|-----------|
| Fullständig | Veckovis | 4 veckor |
| Inkrementell | Daglig | 7 dagar |
| Transaktionslogg | Kontinuerlig | 24 timmar |

### Manuell backup

**Skapa backup:**
1. Gå till "Backup" > "Skapa backup"
2. Välj vad som ska backas upp:
   - Databas
   - Filer/dokument
   - Konfiguration
3. Klicka på "Starta backup"
4. Vänta tills processen är klar (kan ta 10-30 minuter)

**Ladda ner backup:**
1. Gå till "Backup" > "Backuphistorik"
2. Välj backup
3. Klicka på "Ladda ner"
4. Backupen är krypterad

### Återställning

**Återställa från backup:**
1. Gå till "Backup" > "Återställ"
2. Välj backup att återställa från
3. Välj vad som ska återställas:
   - Hela systemet
   - Endast databas
   - Endast filer
   - Specifika tabeller
4. **Varning:** Nuvarande data kommer skrivas över
5. Bekräfta återställning
6. Systemet startas om automatiskt

**Point-in-time recovery:**
1. Välj exakt tidpunkt att återställa till
2. Systemet återställer data till det tillståndet
3. Använd transaktionsloggar för precision

---

## Prestanda & Optimering

### Prestandaövervakning

**Realtidsmetrik:**
1. Gå till "Prestanda" > "Dashboard"
2. Se realtidsdata:
   - API-svarstider
   - Databasfrågor (långsammaste)
   - Minnesanvändning
   - Nätverkstrafik

**Historisk data:**
- Visa trender över tid
- Identifiera flaskhalsar
- Planera kapacitetsökning

### Optimeringsrekommendationer

**Databasoptimering:**
1. **Indexering:**
   - Lägg till index på ofta sökta kolumner
   - Ta bort oanvända index
   - Exempel: `CREATE INDEX idx_jobs_user_id ON jobs(user_id);`

2. **Query-optimering:**
   - Identifiera långsamma frågor
   - Använd EXPLAIN ANALYZE
   - Optimera JOIN-operationer

3. **Caching:**
   - Aktivera Redis för caching
   - Cacha ofta använda frågor
   - Konfigurera TTL (Time To Live)

**Frontend-optimering:**
1. **Lazy loading:**
   - Ladda komponenter vid behov
   - Minska initial bundle size

2. **Bildoptimering:**
   - Komprimera bilder automatiskt
   - Använd WebP-format
   - Implementera responsive images

3. **Code splitting:**
   - Dela upp kod i mindre chunks
   - Ladda endast nödvändig kod

### Skalning

**Horisontell skalning:**
- Lägg till fler servrar vid hög belastning
- Använd load balancer
- Konfigurera auto-scaling

**Vertikal skalning:**
- Uppgradera serverresurser (CPU, RAM)
- Öka databaskapacitet
- Optimera för högre genomströmning

---

## Felsökning

### Vanliga problem

**Problem: Användare kan inte logga in**

**Diagnos:**
1. Kontrollera användarstatus (aktiv/inaktiv)
2. Verifiera lösenord (återställ om nödvändigt)
3. Kontrollera autentiseringstjänsten (Supabase Auth)

**Lösning:**
- Återställ lösenord
- Aktivera användarkonto
- Kontrollera systemloggar för fel

**Problem: Långsam prestanda**

**Diagnos:**
1. Kontrollera CPU/minnesanvändning
2. Identifiera långsamma databasfrågor
3. Analysera nätverkstrafik

**Lösning:**
- Optimera databasfrågor
- Lägg till caching
- Skala upp resurser

**Problem: Data synkas inte**

**Diagnos:**
1. Kontrollera Supabase Realtime-status
2. Verifiera WebSocket-anslutningar
3. Kontrollera användarens internetanslutning

**Lösning:**
- Starta om Realtime-tjänsten
- Rensa cache
- Manuell synkronisering

### Systemloggar

**Visa loggar:**
1. Gå till "Felsökning" > "Loggar"
2. Välj loggtyp:
   - Applikationsloggar
   - Databasloggar
   - API-loggar
   - Säkerhetsloggar
3. Filtrera på:
   - Tidpunkt
   - Allvarlighetsnivå
   - Komponent

**Ladda ner loggar:**
- Exportera för detaljerad analys
- Skicka till support vid behov

### Kontakta support

**Support-nivåer:**

| Nivå | Svarstid | Tillgänglighet |
|------|----------|----------------|
| Kritisk | 1 timme | 24/7 |
| Hög | 4 timmar | Kontorstid |
| Medel | 1 dag | Kontorstid |
| Låg | 3 dagar | Kontorstid |

**Kontaktinformation:**
- **Email:** admin-support@svenskabroapp.se
- **Telefon:** 010-123 45 68 (24/7 för kritiska ärenden)
- **Slack:** #svenska-bro-admin (för registrerade admins)

---

## Best Practices

### Daglig rutin

1. **Morgon:**
   - Kontrollera systemhälsa
   - Granska felrapporter från natten
   - Verifiera backups

2. **Under dagen:**
   - Övervaka aktivitetslogg
   - Hantera användarförfrågningar
   - Granska prestandametrik

3. **Kväll:**
   - Exportera dagens loggar
   - Planera underhåll
   - Uppdatera dokumentation

### Veckovis rutin

1. **Måndag:**
   - Granska veckans backup-schema
   - Planera eventuella uppdateringar

2. **Onsdag:**
   - Optimera databas
   - Granska säkerhetsloggar

3. **Fredag:**
   - Veckorapport till ledning
   - Planera nästa veckas underhåll

### Månatlig rutin

1. **Första veckan:**
   - Fullständig systemgranskning
   - Uppdatera säkerhetspatchar
   - Rotera API-nycklar

2. **Andra veckan:**
   - Granska användaraktivitet
   - Rensa gammal data
   - Optimera prestanda

3. **Tredje veckan:**
   - Testa disaster recovery
   - Uppdatera dokumentation
   - Utbildning för nya admins

4. **Fjärde veckan:**
   - Månadsrapport
   - Planera nästa månads förbättringar

---

## Säkerhetschecklista

- [ ] Alla användare har starka lösenord
- [ ] 2FA aktiverat för admins
- [ ] RLS-policies verifierade
- [ ] API-nycklar roterade (senaste 90 dagarna)
- [ ] Backups fungerar och testade
- [ ] Säkerhetsloggar granskade
- [ ] Inga kända säkerhetshål
- [ ] HTTPS aktiverat överallt
- [ ] CORS korrekt konfigurerat
- [ ] Rate limiting aktiverat

---

**Lycka till med administrationen av Svenska Bro App!** 🔧

*Denna guide uppdaterades senast: Oktober 2025*

