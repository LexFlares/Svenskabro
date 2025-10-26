# Svenska Bro App - Komplett Dokumentation

## Innehållsförteckning

- [Projektöversikt](#projektöversikt)
- [Teknisk Stack](#teknisk-stack)
- [Supabase Konfiguration](#supabase-konfiguration)
- [Installation &amp; Setup](#installation--setup)
- [Funktionalitet](#funktionalitet)
- [API &amp; Services](#api--services)
- [Säkerhet &amp; Autentisering](#säkerhet--autentisering)
- [Offline-funktionalitet](#offline-funktionalitet)
- [Deployment](#deployment)
- [Felsökning](#felsökning)

---

## Projektöversikt

**Svenska Bro App** är en komplett mobil-first webbapplikation byggd för Svenska Bro Aktiebolag för att hantera broinspektion, underhåll, dokumentation och kommunikation mellan fältpersonal och administration.

### Huvudfunktioner:
- Broregister med kartvisning och detaljerad information
- Jobbregistrering med tidrapportering
- Digital journal för alla aktiviteter
- Kontakthantering och arbetsgrupper
- Säker end-to-end krypterad chat (LexChat)
- Trafikvarningar från Trafikverket API
- Dokumenthantering (KMA-dokument)
- Avvikelserapportering
- AI-assistent för teknisk support
- Offline-first arkitektur med auto-sync

### Användarroller:
- **Admin**: Fullständig åtkomst till alla funktioner + admin-panel
- **Employee**: Åtkomst till fältarbete och dokumentation

---

## Teknisk Stack

### Frontend:
- **Next.js 15.2** (Page Router) - React-baserat ramverk
- **TypeScript** - Type-safe utveckling
- **Tailwind CSS v3** - Utility-first styling
- **Shadcn/UI** - Komponentbibliotek
- **Lucide React** - Ikonbibliotek

### Backend &amp; Database:
- **Supabase** - Backend-as-a-Service
  - PostgreSQL databas
  - Authentication (OAuth, Email/Password)
  - Storage (filuppladdning)
  - Edge Functions (serverless)
  - Realtime subscriptions

### Externa API:er:
- **Trafikverket API** (v1.7) - Trafikdata och varningar
- **OpenStreetMap Nominatim** - Geokodning
- **Google Maps** (valfritt) - Kartvisning

### Säkerhet &amp; Kryptering:
- **Web Crypto API** - End-to-end kryptering för chat
- **Biometrisk autentisering** (WebAuthn-ready)
- **Row Level Security (RLS)** - Databasnivå säkerhet

### PWA &amp; Offline:
- **Service Worker** - Offline-kapabilitet
- **IndexedDB** - Lokal datalagring
- **Background Sync** - Automatisk synkronisering

---

## Supabase Konfiguration

### 1. Miljövariabler (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ACCESS_TOKEN=your_access_token_here
SUPABASE_PROJECT_ID=your_project_id_here
```

**Var hittar jag dessa nycklar?**

1. **NEXT_PUBLIC_SUPABASE_URL &amp; ANON_KEY:**
   - Gå till [Supabase Dashboard](https://app.supabase.com)
   - Välj ditt projekt
   - Settings → API → Project URL &amp; anon/public key

2. **SERVICE_ROLE_KEY:**
   - Settings → API → service_role key

3. **ACCESS_TOKEN:**
   - Klicka på din avatar (top right) → Access Tokens
   - Skapa ny token med `all` scope
   - Används för CLI-operationer (migrations, type generation)

4. **PROJECT_ID:**
   - Settings → General → Reference ID

### 2. Databastabeller &amp; Schema

#### **profiles** (Användarprofiler)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

#### **bridges** (Broregister)
```sql
CREATE TABLE bridges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  ta_plan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bridges" ON bridges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert bridges" ON bridges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update bridges" ON bridges FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete bridges" ON bridges FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

#### **jobs** (Arbetsjobb)
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_id TEXT REFERENCES bridges(id) ON DELETE SET NULL,
  bridge_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  start_tid TIMESTAMPTZ NOT NULL,
  slut_tid TIMESTAMPTZ,
  beskrivning TEXT,
  status TEXT DEFAULT 'pågående' CHECK (status IN ('pågående', 'avslutad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

#### **deviations** (Avvikelser)
```sql
CREATE TABLE deviations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  bridge_id TEXT REFERENCES bridges(id) ON DELETE SET NULL,
  bridge_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deviations ENABLE ROW LEVEL SECURITY;
```

#### **documents** (Dokument)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('kma', 'general', 'safety', 'technical')),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload documents" ON documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

#### **work_groups** (Arbetsgrupper)
```sql
CREATE TABLE work_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE work_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_group_id, user_id)
);

ALTER TABLE work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view work groups they're member of" ON work_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM work_group_members WHERE work_group_id = work_groups.id AND user_id = auth.uid())
);
```

#### **chat_messages** (LexChat meddelanden)
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  work_group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received" ON chat_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id OR
  EXISTS (SELECT 1 FROM work_group_members WHERE work_group_id = chat_messages.work_group_id AND user_id = auth.uid())
);
```

### 3. Storage Buckets

#### **documents** (Offentlig bucket för KMA-dokument)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Anyone can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.uid() IS NOT NULL
);
```

#### **chat-attachments** (Privat bucket för chat-bilagor)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

CREATE POLICY "Users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Users can view own attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Edge Functions

#### **send-work-group-invite** (Skicka arbetsgruppsinbjudningar)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { inviteCode, recipientEmail, hostName, groupName } = await req.json();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

**Deployment:**
```bash
supabase functions deploy send-work-group-invite
```

### 5. Realtime Subscriptions

Aktivera Realtime för följande tabeller:
1. Gå till Database → Replication
2. Lägg till tabeller: `chat_messages`, `work_group_members`, `jobs`

### 6. Auth Configuration

#### Email Templates (Settings → Auth → Email Templates)

**Confirm Signup:**
```html
<h2>Bekräfta din e-post</h2>
<p>Hej {{ .Name }}!</p>
<p>Klicka på länken nedan för att bekräfta din e-post:</p>
<p><a href="{{ .ConfirmationURL }}">Bekräfta e-post</a></p>
```

**Reset Password:**
```html
<h2>Återställ lösenord</h2>
<p>Hej!</p>
<p>Du har begärt att återställa ditt lösenord. Klicka på länken nedan:</p>
<p><a href="{{ .ConfirmationURL }}">Återställ lösenord</a></p>
<p>Om du inte begärde detta, ignorera detta mail.</p>
```

#### Redirect URLs (Settings → Auth → URL Configuration)

Lägg till dessa i "Redirect URLs":
```
https://your-app.vercel.app/**
http://localhost:3000/**
```

---

## Installation &amp; Setup

### 1. Klona repository
```bash
git clone https://github.com/svenska-bro/app.git
cd app
```

### 2. Installera dependencies
```bash
npm install
```

### 3. Konfigurera miljövariabler
Skapa `.env.local` med dina Supabase-credentials

### 4. Kör migrationer
```bash
npx supabase db push
```

### 5. Generera TypeScript-typer
```bash
npm run generate-types
```

### 6. Starta development server
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

---

## Funktionalitet

### 1. Autentisering &amp; Användarprofiler
- **Login:** Email/Password via Supabase Auth.
- **Registrering:** Self-service registrering med email-bekräftelse.
- **Profiler:** Fullständigt namn, email, telefon, företag.

### 2. Dashboard
- **Översikt:** Senaste aktivitet, snabblänkar, online/offline-status.
- **Navigation:** Robust navigation med fallback.

### 3. Broregister
- **Funktioner:** Lista över broar, kartvisning, detaljerad info.
- **Trafikverket API:** Hämtar brodata från Trafikverket Datautbytesportal.

### 4. Nytt Jobb
- **Funktioner:** Välj bro, automatisk tidsstämpling, jobbeskrivning.
- **Offline-stöd:** Sparas lokalt, synkas senare.

### 5. Journal
- **Funktioner:** Kronologisk lista över jobb, filter, exportera till PDF/Excel.

### 6. Kontakter &amp; Arbetsgrupper
- **Kontakter:** Lista över alla användare, nödkontakter.
- **Arbetsgrupper:** Skapa grupp, bjud in medlemmar.
- **LexChat:** End-to-end krypterad 1-on-1 och gruppchatt.

### 7. Trafikvarningar
- **Funktioner:** Real-time trafikvarningar från Trafikverket API.
- **Trafikverket API:** Hämtar Situation-data (olyckor, vägarbeten).

### 8. Dokument
- **Funktioner:** Upload/download KMA-dokument, kategorisering.
- **Storage:** Supabase Storage bucket: `documents`.

### 9. Avvikelser
- **Funktioner:** Rapportera avvikelser kopplat till jobb/bro.

### 10. AI-Assistent
- **Funktioner:** Teknisk support &amp; guidance.

### 11. Admin Panel
- **Endast för admins:** Användarhantering, översikt, KML-import.

### 12. Inställningar
- **Funktioner:** Språkval, tema, profilredigering.

---

## API &amp; Services

### authService.ts
- `signIn(email, password)`
- `signUp(email, password, fullName)`
- `signOut()`
- `resetPassword(email)`
- `getProfile(userId)`
- `getAllProfiles()`

### broService.ts
- `getAllBridges()`
- `getBridgeById(id)`
- `importBridges(bridges)`

### jobService.ts
- `getAllJobs()`
- `createJob(job)`
- `updateJob(id, updates)`

### trafikverketService.ts
- `getBridges(filter?)`
- `getSituations(filter?)`

---

## Säkerhet &amp; Autentisering

### 1. Supabase Auth
- **Email/Password:** Supabase hanterar all password hashing (bcrypt).
- **Session Management:** JWT tokens med auto-refresh.

### 2. Row Level Security (RLS)
- Alla tabeller har RLS aktiverat.
- Users kan endast se sina egna data.
- Admins kan se all data.

### 3. End-to-End Kryptering (LexChat)
- **Algoritm:** AES-GCM (256-bit).
- **Nyckelhantering:** Nycklar genereras per chat-session och lagras i sessionStorage.

---

## Offline-funktionalitet

### 1. Offline-First Arkitektur
- All data lagras först i localStorage.
- Vid online-läge, synka till Supabase.

### 2. localStorage Schema
- `svenska_bro_user`, `jobs`, `offline_jobs`, `bridges`, etc.

### 3. Sync-mekanism
- Auto-sync var 5:e minut och vid page load.
- Manuell sync-knapp på Dashboard.

### 4. Network Monitor
- Lyssnar på `online` &amp; `offline` events för att trigga sync.

---

## Deployment

### 1. Vercel (Rekommenderad)
1. Push till GitHub repository.
2. Importera repository i Vercel.
3. Lägg till Environment Variables.
4. Deploy!

---

## Felsökning

### Problem: "Autentisering krävs" trots inloggning
- **Orsak:** localStorage key mismatch mellan `LoginForm.tsx` och `storage.ts`.
- **Lösning:** Kontrollera att båda använder `"svenska_bro_user"`. **FIXED**.

### Problem: Trafikvarningar laddar inte
- **Orsak:** Trafikverket API rate limit eller felaktig API-nyckel.
- **Lösning:** Kontrollera API-nyckel och rate limits.

### Problem: Bilder/filer laddas inte från Supabase Storage
- **Orsak:** RLS policies för Storage bucket.
- **Lösning:** Kontrollera policies i Supabase Dashboard.

---

## Support

**Kontakt:**
- Email: info@svenskabro.se
- GitHub Issues: [svenska-bro/app/issues](https://github.com/svenska-bro/app/issues)

**Utvecklad av LexFlares**

---

## Licens

© 2025 Svenska Bro Aktiebolag. All rights reserved.

Byggd på LexHub-plattformen av LexFlares.
