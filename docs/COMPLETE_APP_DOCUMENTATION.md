# Svenska Bro App - Komplett Dokumentation

## 📋 Innehållsförteckning

1. [Översikt](#översikt)
2. [Teknisk Stack](#teknisk-stack)
3. [Arkitektur](#arkitektur)
4. [Funktioner och Features](#funktioner-och-features)
5. [Dataflöden](#dataflöden)
6. [API-integrationer](#api-integrationer)
7. [Säkerhet och Autentisering](#säkerhet-och-autentisering)
8. [Databas Schema](#databas-schema)
9. [Felsökning](#felsökning)

---

## Översikt

### Vad är Svenska Bro App?

**Svenska Bro App** är en mobilanpassad webbapplikation för svenska broarbetare och ingenjörer som arbetar med inspektion, underhåll och dokumentation av broar. Appen kombinerar:

- 📍 **Broregister** med GPS-koordinater och kartor
- ☁️ **Väderdata** i realtid från Open-Meteo API
- 🚗 **Trafikinformation** från Trafikverket API
- 📝 **Jobbdokumentation** med tidsspårning
- 👥 **Arbetsgrupper** med QR-kodsinbjudningar
- 💬 **Krypterad chatt** (LexChat) för teamkommunikation
- 📊 **Admin-panel** för användarhantering

### Målgrupp

- Broingenjörer och inspektörer
- Underhållsteam
- Projektledare
- Administratörer

---

## Teknisk Stack

### Frontend

```typescript
- Next.js 15.2 (Pages Router)
- React 19+
- TypeScript
- Tailwind CSS v3
- Shadcn/UI komponenter
- Lucide React ikoner
```

### Backend & Database

```typescript
- Supabase
  - PostgreSQL databas
  - Authentication (OAuth + Email)
  - Row Level Security (RLS)
  - Edge Functions
  - Storage
```

### Externa API:er

```typescript
1. Trafikverket Open API
   - Trafikstörningar
   - Väginfo
   - API Key: a3733860138e455c9b0f3af5da10c109

2. Open-Meteo Weather API
   - Väderdata i realtid
   - Temperatur, nederbörd
   - Gratis, ingen API-nyckel

3. Nominatim Geocoding
   - Reverse geocoding
   - Adressuppslagning
```

### Deployment

```typescript
- Vercel (hosting)
- Daytona.io (development sandbox)
- PM2 (process management)
```

---

## Arkitektur

### Filstruktur

```
src/
├── components/          # UI-komponenter
│   ├── ui/             # Shadcn/UI primitiver
│   ├── Dashboard.tsx   # Huvuddashboard
│   ├── LoginForm.tsx   # Inloggning
│   ├── WorkGroupInvite.tsx
│   └── ...
├── pages/              # Next.js router pages
│   ├── index.tsx       # Startsida/Dashboard
│   ├── bridges.tsx     # Broregister
│   ├── new-job.tsx     # Skapa nytt jobb
│   ├── contacts.tsx    # Kontakter + Arbetsgrupper
│   ├── admin.tsx       # Admin-panel
│   ├── traffic-alerts.tsx
│   └── auth/           # Autentiseringssidor
├── services/           # API-tjänster
│   ├── authService.ts
│   ├── broService.ts
│   ├── jobService.ts
│   ├── trafikverketService.ts
│   └── ...
├── lib/                # Utilities
│   ├── storage.ts      # LocalStorage wrapper
│   ├── translations.ts # i18n (SV/EN)
│   ├── workGroup.ts    # Arbetsgrupp-logik
│   ├── geocoding.ts    # Address lookup
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts   # Supabase klient
│       └── types.ts    # Databas-typer
└── types/
    └── index.ts        # TypeScript-typer
```

### Dataflöde

```
Browser → Next.js Pages → Services → Supabase/External APIs
   ↓
LocalStorage (cache + offline)
   ↓
React State → UI Components
```

---

## Funktioner och Features

### 1. Autentisering (authService.ts)

**Funktioner:**
```typescript
- signIn(email, password)
- signUp(email, password, fullName, role)
- signOut()
- resetPassword(email)
- updatePassword(newPassword)
- inviteUserByEmail(email, fullName, role)
- getAllProfiles()
- updateProfileRole(userId, role)
- deleteUser(userId)
```

**Flöde:**
1. Användare fyller i email + lösenord
2. authService.signIn() anropas
3. Supabase auth.signInWithPassword()
4. Profile hämtas från profiles-tabellen
5. User + Profile sparas i localStorage
6. Redirect till dashboard

**OAuth Providers:**
- Google
- GitHub
- Azure (Microsoft)

**Roller:**
- `admin` - Full åtkomst
- `employee` - Begränsad åtkomst

### 2. Broregister (bridges.tsx + broService.ts)

**Funktioner:**
```typescript
- getAllBridges() - Hämta alla broar
- createBridge(bridge) - Skapa ny bro
- importBridges(bridges[]) - Importera från KML
- clearAllBridges() - Radera alla (admin)
```

**Features:**
- ✅ Sök efter bro-ID, namn, beskrivning, adress
- ✅ Sortering (namn, ID)
- ✅ Pagination (20 broar åt gången)
- ✅ Väderdata per bro (cache 30 min)
- ✅ Adress-lookup via geocoding (cache 7 dagar)
- ✅ Trafikinformation inom 10km-radie
- ✅ Öppna i Google Maps
- ✅ Starta nytt jobb från bro

**Optimeringar:**
- Lazy loading av väder/adresser för synliga broar
- 2 sekunders delay mellan väder-API-anrop
- Cache för att undvika rate limiting
- Endast ladda mer data vid "Load More"

**Bridge-objekt:**
```typescript
interface Bridge {
  id: string;              // "17-905-1"
  name: string;            // "Älvsborgsbron"
  x: number;               // Longitude (10-25)
  y: number;               // Latitude (55-70)
  description: string;
  ta_plan_url?: string;    // TA-plan URL
  created_at: string;
}
```

### 3. Trafikinformation (trafikverketService.ts)

**API-anrop:**
```typescript
1. fetchAllTrafficSituations()
   - Hämtar alla trafiksituationer i Sverige
   - Cache: 15 minuter
   - Retry: 3 försök med exponentiell backoff

2. fetchTrafficInfo(lat, lon, radiusKm)
   - Geofencing (WITHIN filter)
   - VIKTIGT: Trafikverket API kräver "longitude latitude" (WGS84)
   - Cache: 15 minuter per location
   - Validering av koordinater (Sverige: lat 55-70, lon 10-25)
```

**Filtrering:**
```typescript
filterTrafficSituations(situations, settings) {
  - Event types: olycka, vägarbete, stockning, väglag
  - Län (CountyNo)
  - Städer (LocationDescriptor)
  - Vägnummer (RoadNumber)
  - OR-logik (matchar någon filter)
}
```

**Polling:**
```typescript
startTrafficPolling(settings, onNewSituation)
- Intervall: 120000ms (2 minuter) som standard
- Skickar push-notifikation vid ny händelse
- Cache för att undvika duplicerade notiser
```

**Vanliga fel:**
- ❌ **400 Bad Request** - Ogiltiga koordinater
- ❌ **401 Unauthorized** - Fel API-nyckel
- ❌ **429 Too Many Requests** - Rate limit
- ❌ **500 Server Error** - Trafikverket API nere

### 4. Arbetsgrupper (workGroup.ts + contacts.tsx)

**Funktioner:**
```typescript
- createWorkGroup(host, groupName)
  1. Genererar 8-siffrig inbjudningskod (XXXX-XXXX)
  2. Skapar work_groups-rad
  3. Lägger till host som admin i work_group_members

- getWorkGroupByInviteCode(code)
  - Hämtar grupp med invite_code
  - Inkluderar creator (profiles)

- joinWorkGroup(groupId, user)
  - Lägger till user i work_group_members
  - Role: "member"

- sendEmailInvite(code, email, hostName, groupName)
  - Anropar Edge Function: send-work-group-invite
  - Skickar email via SMTP
  - Fallback: Kopierar länk om email misslyckas
```

**Edge Function (supabase/functions/send-work-group-invite):**
```typescript
POST https://{project-ref}.supabase.co/functions/v1/send-work-group-invite
Body: {
  inviteCode: string;
  recipientEmail: string;
  hostName: string;
  groupName: string;
  inviteUrl: string;
}
```

**WorkGroup-objekt:**
```typescript
interface WorkGroup {
  id: string;
  name: string;
  invite_code: string;      // "ABCD-1234"
  created_by: string;       // User ID
  created_at: string;
}

interface WorkGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}
```

### 5. Kontakter (contacts.tsx + contactService.ts)

**Funktioner:**
```typescript
- getAllContacts()
  - Hämtar alla profiles med status="active"
  - Sorterar efter full_name

- getContactById(id)
  - Hämtar specifik profil
```

**UI Features:**
- ✅ Visar admins och anställda separat
- ✅ Ring-knapp (tel: länk)
- ✅ Email-knapp (mailto: länk)
- ✅ Chat-knapp (redirect till /chat)
- ✅ Nödkontakter (SOS Alarm, Trafikverket)
- ✅ Arbetsgrupp-inbjudan (QR + Email + Länk)

### 6. Admin-panel (admin.tsx)

**Features:**
- ✅ Användarhantering
  - Lista alla användare
  - Bjud in via email
  - Uppdatera roller (admin/employee)
  - Radera användare
- ✅ Arbetsgrupper
  - Lista alla grupper
  - Visa medlemmar
  - Expanderbar lista
- ✅ Statistik
  - Antal jobb denna vecka
  - Genomsnittlig tid
  - Antal avvikelser
- ✅ Export
  - PDF-rapport
  - Excel-export
- ✅ Brodata
  - Importera KML-fil
  - Radera alla broar

**Endast admin:**
```typescript
useEffect(() => {
  const currentUser = storage.getUser();
  if (currentUser?.role !== 'admin') {
    router.push('/');
  }
}, []);
```

### 7. Dashboard (Dashboard.tsx / index.tsx)

**Features:**
- ✅ Navigeringskort:
  - Broregister
  - Nytt jobb
  - Jobbjournal
  - Avvikelser
  - Dokument
  - Kontakter
  - Trafikvarningar
  - Inställningar
  - LexChat AI
  - Admin (endast admin)
- ✅ Språkväxling (SV/EN)
- ✅ Välkomstmeddelande
- ✅ Profilinfo

### 8. Jobb (new-job.tsx + journal.tsx)

**new-job.tsx:**
```typescript
- Skapa nytt jobb
- Koppla till bro (optional)
- Tidsspårning (start/stop)
- Foton (kamera + uppladdning)
- Beskrivning
- Spara lokalt + Supabase
```

**journal.tsx:**
```typescript
- Lista alla jobb
- Filtrera per vecka
- Sortera (datum, namn, tid)
- Visa detaljer
- Exportera rapport
```

---

## Dataflöden

### 1. Användare loggar in

```
1. LoginForm.tsx → authService.signIn(email, password)
2. authService → supabase.auth.signInWithPassword()
3. Supabase → Returnerar User + Session
4. authService → Hämtar Profile från profiles-tabell
5. authService → storage.saveUser(profile)
6. Router → Redirect till /
7. Dashboard.tsx → Visar användarens dashboard
```

### 2. Hämta broar med väder och trafikinfo

```
1. bridges.tsx → useEffect() → loadBridgesFromSupabase()
2. broService.getAllBridges() → Supabase query
3. Supabase → Returnerar Bridge[]
4. bridges.tsx → fetchWeatherDataForBridges(bridges)
   - För varje bro (första 20):
     - Vänta 2 sekunder mellan anrop
     - fetch Open-Meteo API
     - Cacha resultat 30 minuter
5. bridges.tsx → fetchAddressesForBridges(bridges)
   - För varje bro:
     - Vänta 1 sekund mellan anrop
     - getAddressFromCoordinates(lat, lon)
     - Cacha resultat 7 dagar
6. Användare klickar "Trafikinfo"
7. bridges.tsx → fetchTrafficInfo(bridge)
8. trafikverketService.fetchTrafficInfo(lat, lon, radius)
   - Validera koordinater
   - POST till Trafikverket API
   - WITHIN filter med WGS84 (lon, lat)
   - Cacha resultat 5 minuter
9. bridges.tsx → setTrafficInfo(situations)
10. UI → Visa trafikhändelser under bron
```

### 3. Skapa arbetsgrupp och bjud in medlem

```
1. contacts.tsx → handleCreateWorkGroup()
2. workGroup.createWorkGroup(user, groupName)
3. Supabase → INSERT work_groups
4. Supabase → INSERT work_group_members (host som admin)
5. contacts.tsx → loadWorkGroupData() → Visa inbjudningskort
6. WorkGroupInvite.tsx → Användare klickar "Skicka email"
7. workGroup.sendEmailInvite(code, email, host, group)
8. supabase.functions.invoke('send-work-group-invite')
9. Edge Function → Skickar SMTP-email
10. Mottagare → Får email med länk
11. Mottagare → Klickar länk → /join-work-group?code=XXXX-XXXX
12. join-work-group.tsx → getWorkGroupByInviteCode(code)
13. Supabase → Returnerar WorkGroup
14. UI → Visa "Gå med i [GroupName]"
15. Användare → Klickar "Gå med"
16. workGroup.joinWorkGroup(groupId, user)
17. Supabase → INSERT work_group_members (member)
18. Router → Redirect till /contacts
```

---

## API-integrationer

### 1. Trafikverket Open API

**Endpoint:**
```
POST https://api.trafikinfo.trafikverket.se/v2/data.json
```

**Request Body (All Situations):**
```json
{
  "REQUEST": {
    "LOGIN": {
      "authenticationkey": "a3733860138e455c9b0f3af5da10c109"
    },
    "QUERY": [
      {
        "objecttype": "Situation",
        "schemaversion": "1.5",
        "limit": 500
      }
    ]
  }
}
```

**Request Body (Geofencing):**
```json
{
  "REQUEST": {
    "LOGIN": {
      "authenticationkey": "a3733860138e455c9b0f3af5da10c109"
    },
    "QUERY": [
      {
        "objecttype": "Situation",
        "schemaversion": "1.5",
        "limit": 100,
        "FILTER": {
          "WITHIN": {
            "name": "Deviation.Geometry.WGS84",
            "shape": "center",
            "value": "18.0686 59.3293",  // lon lat (VIKTIGT!)
            "radius": 10000               // meters
          }
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "RESPONSE": {
    "RESULT": [
      {
        "Situation": [
          {
            "Deviation": {
              "Id": "...",
              "Header": "Trafikolycka E4",
              "Message": "Vägen avstängd pga olycka",
              "IconId": "roadAccident",
              "RoadNumber": "E4",
              "CountyNo": [1],
              "CreationTime": "2025-10-23T22:15:00+02:00",
              "EndTime": null,
              "LocationDescriptor": "E4 mellan Stockholm och Uppsala",
              "Geometry": {
                "WGS84": "POINT (18.0686 59.3293)"
              }
            }
          }
        ]
      }
    ]
  }
}
```

**Rate Limits:**
- Okänd, men implementera retry-logik
- Cache aggressivt (15 min)
- Exponentiell backoff vid 429

### 2. Open-Meteo Weather API

**Endpoint:**
```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true
```

**Response:**
```json
{
  "current_weather": {
    "temperature": 12.5,
    "weathercode": 3,
    "precipitation": 0.2
  }
}
```

**Weather Codes:**
- 0: Clear sky
- 1-3: Partly cloudy
- 45-67: Rain
- 71-77: Snow
- 80-99: Thunderstorm

**Rate Limits:**
- ~10,000 requests/dag gratis
- Implementera 2 sekunders delay
- Cache 30 minuter

### 3. Nominatim Geocoding (OpenStreetMap)

**Endpoint:**
```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}
```

**Response:**
```json
{
  "address": {
    "road": "Västerlånggatan",
    "suburb": "Gamla Stan",
    "city": "Stockholm",
    "county": "Stockholms län",
    "country": "Sverige"
  }
}
```

**Rate Limits:**
- 1 request/sekund
- Implementera 1 sekunds delay
- Cache 7 dagar
- Använd User-Agent header

---

## Säkerhet och Autentisering

### Supabase Authentication

**Sign Up Flow:**
```typescript
1. User → Email + Password + Full Name + Role
2. authService.signUp()
3. Supabase → auth.signUp() med email_confirmation
4. Trigger: handle_new_user() → Skapar profile
5. User → Får confirmation email
6. User → Klickar länk → /auth/confirm-email
7. Supabase → Aktiverar account
8. Router → Redirect till /auth/set-password
```

**OAuth Flow:**
```typescript
1. User → Klickar Google/GitHub/Azure
2. authService.signInWithOAuth(provider)
3. Supabase → Redirect till OAuth provider
4. Provider → User godkänner
5. Provider → Redirect tillbaka med code
6. Supabase → Skapar/uppdaterar user
7. Trigger: handle_new_user() → Skapar profile om ny
8. Router → Redirect till /
```

**Row Level Security (RLS):**

```sql
-- profiles tabell
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active profiles"
  ON profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- work_groups tabell
ALTER TABLE work_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups they're members of"
  ON work_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_group_members
      WHERE work_group_members.group_id = work_groups.id
        AND work_group_members.user_id = auth.uid()
    )
  );

-- work_group_members tabell
ALTER TABLE work_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in same group"
  ON work_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_group_members wgm
      WHERE wgm.group_id = work_group_members.group_id
        AND wgm.user_id = auth.uid()
    )
  );

-- broar tabell
ALTER TABLE broar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bridges"
  ON broar FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify bridges"
  ON broar FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```

**Admin-Only Actions:**
```typescript
// Frontend check
const currentUser = storage.getUser();
if (currentUser?.role !== 'admin') {
  router.push('/');
  return;
}

// Backend RLS enforces this
```

---

## Databas Schema

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### work_groups
```sql
CREATE TABLE work_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### work_group_members
```sql
CREATE TABLE work_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

### broar
```sql
CREATE TABLE broar (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  x NUMERIC NOT NULL,  -- Longitude
  y NUMERIC NOT NULL,  -- Latitude
  description TEXT,
  ta_plan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bridge_id TEXT REFERENCES broar(id),
  bridge_name TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  photos TEXT[],  -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Felsökning

### Problem 1: Dashboard-knappar fungerar inte

**Symptom:** Knappar på dashboard gör ingenting vid klick

**Möjliga orsaker:**
1. JavaScript-fel i console
2. Router inte initialiserad
3. Event handlers inte korrekt bundna

**Lösning:**
```typescript
// Kolla att router används korrekt
const router = useRouter();

// Kolla att onClick är bunden
<button onClick={() => router.push('/bridges')}>
  Broregister
</button>
```

### Problem 2: Trafikvarningar laddar inte

**Symptom:** Inga trafikhändelser visas trots aktiverade notifikationer

**Möjliga orsaker:**
1. Trafikverket API nere
2. Fel API-nyckel
3. Nätverksproblem
4. Cache-problem

**Lösning:**
```typescript
// 1. Kolla console för felmeddelanden
console.log("🔄 Loading traffic situations...");

// 2. Verifiera API-nyckel
const API_KEY = "a3733860138e455c9b0f3af5da10c109";

// 3. Testa API manuellt
curl -X POST https://api.trafikinfo.trafikverket.se/v2/data.json \
  -H "Content-Type: application/json" \
  -d '{"REQUEST":{"LOGIN":{"authenticationkey":"a3733860138e455c9b0f3af5da10c109"},"QUERY":[{"objecttype":"Situation","schemaversion":"1.5","limit":10}]}}'

// 4. Rensa cache
localStorage.removeItem("trafikverket_all_situations_cache");

// 5. Refresh sidan
```

### Problem 3: Bro 17-905-1 ger koordinatfel

**Symptom:** "Ogiltiga koordinater" när man hämtar trafikinfo för specifik bro

**Möjliga orsaker:**
1. Koordinater utanför Sverige
2. Koordinater är null/undefined
3. Koordinater i fel format (lat/lon bytt)

**Lösning:**
```typescript
// 1. Kolla brons koordinater i databasen
SELECT id, name, x, y FROM broar WHERE id = '17-905-1';

// 2. Validera koordinater
if (!bridge.y || !bridge.x || isNaN(bridge.y) || isNaN(bridge.x)) {
  throw new Error("Koordinater saknas eller är felaktiga");
}

// 3. Validera Sverige-range
if (bridge.y < 55 || bridge.y > 70) {
  throw new Error(`Latitude utanför Sverige: ${bridge.y}`);
}
if (bridge.x < 10 || bridge.x > 25) {
  throw new Error(`Longitude utanför Sverige: ${bridge.x}`);
}

// 4. Kolla Trafikverket API-anrop
// VIKTIGT: Trafikverket kräver "longitude latitude" (inte lat lon!)
value: `${bridge.x} ${bridge.y}`  // CORRECT
value: `${bridge.y} ${bridge.x}`  // WRONG
```

### Problem 4: Kontakter och arbetsgrupper fungerar inte

**Symptom:** Inga kontakter visas, kan inte skapa arbetsgrupp

**Möjliga orsaker:**
1. Supabase-anslutning bruten
2. RLS-policies blockerar
3. User inte inloggad
4. Profiles-tabell tom

**Lösning:**
```typescript
// 1. Kolla Supabase-anslutning
const { data, error } = await supabase.from("profiles").select("*");
console.log("Profiles:", data, "Error:", error);

// 2. Kolla RLS-policies
// Se till att policies tillåter SELECT för alla active profiles

// 3. Kolla inloggad user
const user = storage.getUser();
console.log("Current user:", user);

// 4. Kolla att profiles finns
// Om inte, skapa en:
await supabase.from("profiles").insert({
  id: user.id,
  email: user.email,
  full_name: "Test User",
  role: "employee",
  status: "active"
});
```

### Problem 5: Admin-panel visar inga användare

**Symptom:** Admin-panel laddar men visar tomma listor

**Möjliga orsaker:**
1. User är inte admin
2. Supabase-query misslyckas
3. RLS blockerar admin-queries

**Lösning:**
```typescript
// 1. Verifiera admin-roll
const user = storage.getUser();
console.log("User role:", user?.role);
// Ska vara "admin"

// 2. Uppdatera user till admin i databasen
UPDATE profiles SET role = 'admin' WHERE email = 'din@email.se';

// 3. Kolla getAllProfiles()
const { profiles, error } = await authService.getAllProfiles();
console.log("Profiles:", profiles, "Error:", error);
```

### Problem 6: Server/Preview fungerar inte

**Symptom:** Preview visar "Cannot GET /" eller "Internal Server Error"

**Möjliga orsaker:**
1. Next.js server kraschad
2. Build-fel
3. Port-konflikt
4. Miljövariabler saknas

**Lösning:**
```bash
# 1. Starta om servern
pm2 restart all

# 2. Kolla serverstatus
pm2 status

# 3. Kolla loggar
pm2 logs

# 4. Rebuild project
npm run build

# 5. Kolla miljövariabler
cat .env.local

# 6. Testa lokalt
npm run dev
```

### Problem 7: Cache-problem

**Symptom:** Gammal data visas trots uppdateringar

**Lösning:**
```typescript
// 1. Rensa localStorage
localStorage.clear();

// 2. Rensa specifik cache
localStorage.removeItem("weather_cache");
localStorage.removeItem("bridge_addresses_cache");
localStorage.removeItem("trafikverket_all_situations_cache");

// 3. Hard refresh
// Ctrl+Shift+R (Windows/Linux)
// Cmd+Shift+R (Mac)

// 4. Disable cache i DevTools
// Chrome: Network tab → Disable cache
```

---

## Sammanfattning

**Svenska Bro App** är en komplex applikation med många integrationer och features. De viktigaste punkterna:

### ✅ Fungerar:
- TypeScript-kompilering
- Supabase-integration
- Autentisering
- Databas-schema

### ⚠️ Potentiella problem:
1. **Trafikverket API** - Koordinat-ordning (lon, lat) är kritisk
2. **Rate limiting** - Implementerad men kan kräva justering
3. **Cache** - Aggressiv cache kan visa gammal data
4. **RLS** - Policies måste vara korrekt konfigurerade
5. **Admin-panel** - Kräver admin-roll i databasen

### 🔧 Felsökningsverktyg:
- Browser DevTools Console
- Supabase Dashboard
- PM2 logs
- Network tab (API-anrop)
- localStorage inspector

**För att identifiera ditt specifika problem:**
1. Öppna browser console (F12)
2. Kolla Network tab för API-fel
3. Kolla localStorage för cached data
4. Testa i Incognito-läge (rensa cache)
5. Jämför denna dokumentation med faktisk kod

---

**Version:** 1.0  
**Datum:** 2025-10-23  
**Kontakt:** Support via Softgen.ai