# Svenska Bro App - Komplett Felsökningsguide

## 🚨 AKUT FELSÖKNING - Steg-för-steg

**Använd denna guide för att systematiskt identifiera och lösa problem.**

---

## Steg 1: Verifiera grundläggande funktion

### 1.1 Öppna Browser Console
**Chrome/Edge:** Tryck `F12` eller `Ctrl+Shift+I`  
**Firefox:** Tryck `F12` eller `Ctrl+Shift+K`  
**Safari:** `Cmd+Option+I`

### 1.2 Kolla efter JavaScript-fel
Leta efter RÖDA felmeddelanden i Console-fliken.

**Vanliga fel och lösningar:**

```
❌ "Cannot read property 'push' of undefined"
→ Lösning: Router inte initialiserad. Refresh sidan.

❌ "Network request failed" 
→ Lösning: Supabase-anslutning bruten. Kolla .env.local

❌ "401 Unauthorized"
→ Lösning: Session utgången. Logga ut och in igen.

❌ "hydration error" eller "Text content mismatch"
→ Lösning: SSR-problem. Starta om servern: pm2 restart all
```

---

## Steg 2: Testa Dashboard-funktioner

### 2.1 Öppna Dashboard
Navigera till: `http://localhost:3000` (eller din URL)

### 2.2 Kolla localStorage
Kör i Console:
```javascript
// Kolla om användare är inloggad
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);

// FÖRVÄNTAT RESULTAT:
// User: {id: "...", email: "...", full_name: "...", role: "admin" eller "employee"}

// Om null eller undefined:
// → Du är inte inloggad. Gå till /auth/login
```

### 2.3 Testa navigeringsknappar
Klicka på varje knapp på Dashboard:

```
✅ Broregister → Ska gå till /bridges
✅ Nytt jobb → Ska gå till /new-job
✅ Jobbjournal → Ska gå till /journal
✅ Avvikelser → Ska gå till /deviations
✅ Dokument → Ska gå till /documents
✅ Kontakter → Ska gå till /contacts
✅ Trafikvarningar → Ska gå till /traffic-alerts
✅ Inställningar → Ska gå till /settings
✅ LexChat AI → Ska gå till /ai-assistant
✅ Admin (endast admin) → Ska gå till /admin
```

**Om ingen knapp fungerar:**
```javascript
// Kör i Console för att testa router:
window.location.href = '/bridges';

// Om detta fungerar men knappar inte gör det:
// → Event handlers är inte bundna. Kontakta support.
```

---

## Steg 3: Testa Admin-panelen (admin.tsx)

### 3.1 Verifiera admin-roll

#### Metod 1: Kolla i Console
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user?.role);

// FÖRVÄNTAT: "admin"
// Om "employee" eller undefined:
// → Du har inte admin-åtkomst
```

#### Metod 2: Kolla i Supabase Dashboard
1. Gå till: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Välj tabellen `profiles`
3. Hitta din användare (sök efter din email)
4. Kolla kolumnen `role`
5. Om den INTE är "admin", ändra den:

**SQL-query för att göra dig till admin:**
```sql
-- Byt ut 'din@email.se' med din faktiska email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'din@email.se';
```

### 3.2 Testa Admin-panel funktioner

#### Test 1: Visa användare
```javascript
// Kör i Console på /admin-sidan:
const testUsers = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', data, 'Error:', error);
};
testUsers();

// FÖRVÄNTAT: Array med användare
// Om error: 
// → Kolla RLS-policies (se Steg 6)
```

#### Test 2: Visa arbetsgrupper
```javascript
// Kör i Console på /admin-sidan:
const testWorkGroups = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('work_groups')
    .select('*, creator:created_by(*), members:work_group_members(*, profile:user_id(*))')
    .order('created_at', { ascending: false });
  console.log('Work Groups:', data, 'Error:', error);
};
testWorkGroups();

// FÖRVÄNTAT: Array med arbetsgrupper (kan vara tom om inga skapats)
// Om error:
// → Kolla RLS-policies eller foreign key-relationer
```

#### Test 3: Bjud in användare
1. Klicka "Bjud in" i Admin-panelen
2. Fyll i email och namn
3. Klicka "Skicka inbjudan"
4. Kolla Console för fel

**Vanliga problem:**
```
❌ "Failed to send invitation"
→ authService.inviteUserByEmail() misslyckas
→ Kolla Supabase Auth-inställningar

❌ "No response from server"
→ Supabase Edge Function ej konfigurerad
→ Email-inbjudningar kräver SMTP-setup
```

---

## Steg 4: Testa Kontakter & Arbetsgrupper (contacts.tsx)

### 4.1 Öppna Kontakter
Navigera till: `/contacts`

### 4.2 Kolla om kontakter laddas
```javascript
// Kör i Console:
const testContacts = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  console.log('Contacts:', data?.length, 'contacts found');
  console.log('Error:', error);
};
testContacts();

// FÖRVÄNTAT: Minst 1 kontakt (din egen profil)
// Om 0 kontakter:
// → Profiles-tabellen är tom
// → Kör SQL nedan för att skapa test-profiler
```

**Skapa test-profil (SQL):**
```sql
-- Få ditt user ID från auth.users:
SELECT id, email FROM auth.users;

-- Skapa profil (byt ut <ditt-user-id> och <din-email>):
INSERT INTO profiles (id, email, full_name, role, status)
VALUES (
  '<ditt-user-id>',  -- UUID från auth.users
  '<din-email>',
  'Test Admin',
  'admin',
  'active'
);
```

### 4.3 Testa skapa arbetsgrupp
1. Klicka "Arbetsgrupper" på `/contacts`
2. Kolla Console för fel

**Vanliga problem:**
```
❌ "Work group was not created"
→ INSERT till work_groups misslyckas
→ Kolla RLS-policies

❌ "No user logged in"
→ currentUser är null
→ Logga ut och in igen
```

**Debug-kommando:**
```javascript
// Kör i Console:
const testCreateWorkGroup = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const user = JSON.parse(localStorage.getItem('user'));
  
  console.log('Current user:', user);
  
  if (!user) {
    console.error('❌ No user found in localStorage');
    return;
  }
  
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { data, error } = await supabase
    .from('work_groups')
    .insert({
      name: 'Test Group',
      invite_code: inviteCode,
      created_by: user.id
    })
    .select()
    .single();
    
  console.log('Created group:', data);
  console.log('Error:', error);
};
testCreateWorkGroup();
```

---

## Steg 5: Testa Trafikvarningar (traffic-alerts.tsx)

### 5.1 Aktivera trafiknotifikationer
1. Gå till `/settings/traffic-notifications`
2. Aktivera "Aktivera trafiknotifikationer"
3. Spara inställningar

### 5.2 Öppna Trafikvarningar
Navigera till: `/traffic-alerts`

### 5.3 Testa API-anrop manuellt
```javascript
// Kör i Console:
const testTrafikverket = async () => {
  const API_KEY = "a3733860138e455c9b0f3af5da10c109";
  const API_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";
  
  const requestBody = {
    REQUEST: {
      LOGIN: { authenticationkey: API_KEY },
      QUERY: [{
        objecttype: "Situation",
        schemaversion: "1.5",
        limit: 10
      }]
    }
  };
  
  console.log('🚀 Testing Trafikverket API...');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    console.error('❌ API request failed');
    const text = await response.text();
    console.error('Error:', text);
    return;
  }
  
  const data = await response.json();
  console.log('✅ API response:', data);
  
  if (data.RESPONSE?.RESULT?.[0]?.Situation) {
    const situations = data.RESPONSE.RESULT[0].Situation;
    console.log(`✅ Found ${situations.length} traffic situations`);
  } else {
    console.log('⚠️ No situations in response');
  }
};
testTrafikverket();
```

**Möjliga resultat:**
```
✅ Status 200 + situations → API fungerar
❌ Status 401 → Ogiltig API-nyckel
❌ Status 429 → Rate limit, vänta 1 minut
❌ Status 500 → Trafikverket API nere
❌ CORS error → Kör från samma domän som appen
```

### 5.4 Rensa cache
```javascript
// Om gammal data visas, rensa cache:
localStorage.removeItem('trafikverket_all_situations_cache');
localStorage.removeItem('traffic_notification_settings');

// Refresh sidan
window.location.reload();
```

---

## Steg 6: Testa Broregister (bridges.tsx)

### 6.1 Öppna Broregister
Navigera till: `/bridges`

### 6.2 Kolla om broar laddas
```javascript
// Kör i Console:
const testBridges = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('broar')
    .select('*')
    .order('name', { ascending: true });
  console.log('Bridges:', data?.length, 'bridges found');
  console.log('Error:', error);
  
  if (data && data.length > 0) {
    console.log('First bridge:', data[0]);
  }
};
testBridges();

// FÖRVÄNTAT: Flera broar
// Om 0 broar:
// → Tabellen är tom, importera KML via Admin-panel
```

### 6.3 Testa specifik bro (17-905-1)
```javascript
// Kör i Console:
const testSpecificBridge = async () => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  const { data, error } = await supabase
    .from('broar')
    .select('*')
    .eq('id', '17-905-1')
    .single();
    
  if (error) {
    console.error('❌ Bridge not found:', error);
    return;
  }
  
  console.log('✅ Bridge found:', data);
  console.log('Coordinates:', `lat=${data.y}, lon=${data.x}`);
  
  // Validera koordinater
  if (!data.y || !data.x || isNaN(data.y) || isNaN(data.x)) {
    console.error('❌ Invalid coordinates: null or NaN');
    return;
  }
  
  if (data.y < 55 || data.y > 70) {
    console.error(`❌ Latitude outside Sweden range: ${data.y} (expected 55-70)`);
    return;
  }
  
  if (data.x < 10 || data.x > 25) {
    console.error(`❌ Longitude outside Sweden range: ${data.x} (expected 10-25)`);
    return;
  }
  
  console.log('✅ Coordinates are valid');
};
testSpecificBridge();
```

### 6.4 Testa trafikinfo för bro
```javascript
// Kör i Console på /bridges-sidan:
const testBridgeTraffic = async (bridgeId = '17-905-1') => {
  const { supabase } = await import('/src/integrations/supabase/client.ts');
  
  // Hämta bro
  const { data: bridge, error: bridgeError } = await supabase
    .from('broar')
    .select('*')
    .eq('id', bridgeId)
    .single();
    
  if (bridgeError || !bridge) {
    console.error('❌ Bridge not found');
    return;
  }
  
  console.log('Testing traffic for bridge:', bridge.name);
  
  // Testa Trafikverket API
  const API_KEY = "a3733860138e455c9b0f3af5da10c109";
  const API_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";
  
  const requestBody = {
    REQUEST: {
      LOGIN: { authenticationkey: API_KEY },
      QUERY: [{
        objecttype: "Situation",
        schemaversion: "1.5",
        limit: 100,
        FILTER: {
          WITHIN: {
            name: "Deviation.Geometry.WGS84",
            shape: "center",
            value: `${bridge.x} ${bridge.y}`,  // lon lat (WGS84)
            radius: 10000  // 10 km
          }
        }
      }]
    }
  };
  
  console.log('🚀 Request:', JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('❌ API error:', text);
    return;
  }
  
  const data = await response.json();
  
  if (data.RESPONSE?.RESULT?.[0]?.Situation) {
    const situations = data.RESPONSE.RESULT[0].Situation;
    console.log(`✅ Found ${situations.length} traffic situations within 10km`);
  } else {
    console.log('ℹ️ No traffic situations found (this is OK)');
  }
};
testBridgeTraffic();
```

---

## Steg 7: Verifiera Supabase RLS-policies

### 7.1 Kolla RLS-status
Öppna Supabase Dashboard → Authentication → Policies

**Kontrollera att följande policies finns:**

#### profiles-tabell:
```sql
-- Policy 1: Alla kan se aktiva profiler
CREATE POLICY "Users can view all active profiles"
  ON profiles FOR SELECT
  USING (status = 'active');

-- Policy 2: Användare kan uppdatera sin egen profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### work_groups-tabell:
```sql
-- Policy: Medlemmar kan se sina grupper
CREATE POLICY "Members can view their groups"
  ON work_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_group_members
      WHERE work_group_members.group_id = work_groups.id
        AND work_group_members.user_id = auth.uid()
    )
  );

-- Policy: Alla kan skapa grupper
CREATE POLICY "Anyone can create groups"
  ON work_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

#### work_group_members-tabell:
```sql
-- Policy: Medlemmar kan se andra medlemmar i samma grupp
CREATE POLICY "Members can view other members"
  ON work_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_group_members wgm
      WHERE wgm.group_id = work_group_members.group_id
        AND wgm.user_id = auth.uid()
    )
  );

-- Policy: Admins kan lägga till medlemmar
CREATE POLICY "Admins can add members"
  ON work_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_group_members wgm
      WHERE wgm.group_id = group_id
        AND wgm.user_id = auth.uid()
        AND wgm.role = 'admin'
    )
  );
```

#### broar-tabell:
```sql
-- Policy: Alla kan se broar
CREATE POLICY "Anyone can view bridges"
  ON broar FOR SELECT
  USING (true);

-- Policy: Endast admins kan modifiera broar
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

### 7.2 Testa RLS manuellt
```sql
-- Kör som inloggad användare:
SELECT * FROM profiles WHERE status = 'active';
-- FÖRVÄNTAT: Alla aktiva profiler

SELECT * FROM work_groups;
-- FÖRVÄNTAT: Grupper du är medlem i

SELECT * FROM broar;
-- FÖRVÄNTAT: Alla broar
```

---

## Steg 8: Rensa cache och starta om

### 8.1 Rensa all cache
```javascript
// Kör i Console:
localStorage.clear();
sessionStorage.clear();

// Eller selektivt:
localStorage.removeItem('user');
localStorage.removeItem('weather_cache');
localStorage.removeItem('bridge_addresses_cache');
localStorage.removeItem('trafikverket_all_situations_cache');
localStorage.removeItem('traffic_notification_settings');
```

### 8.2 Starta om servern
```bash
# I terminal:
pm2 restart all

# Kolla status:
pm2 status

# Kolla loggar om problem kvarstår:
pm2 logs
```

### 8.3 Hard refresh i browser
- **Chrome/Edge/Firefox:** `Ctrl+Shift+R` (Windows/Linux) eller `Cmd+Shift+R` (Mac)
- **Safari:** `Cmd+Option+R`

---

## Steg 9: Verifieringschecklist

Använd denna checklist för att verifiera att allt fungerar:

### ✅ Grundläggande funktion
- [ ] Appen laddar utan JavaScript-fel
- [ ] Användare är inloggad (localStorage.getItem('user') returnerar objekt)
- [ ] Dashboard visas korrekt

### ✅ Dashboard
- [ ] Alla navigeringsknappar fungerar
- [ ] Rätt knappar visas baserat på användarroll

### ✅ Admin-panel (endast admin)
- [ ] Kan öppna admin-panelen
- [ ] Användarlistan visas
- [ ] Arbetsgruppslistan visas
- [ ] Kan bjuda in ny användare
- [ ] Kan uppdatera användarroller

### ✅ Kontakter & Arbetsgrupper
- [ ] Kontaktlistan visas
- [ ] Kan skapa arbetsgrupp
- [ ] Inbjudningskod genereras
- [ ] Kan kopiera inbjudningslänk
- [ ] QR-kod visas

### ✅ Trafikvarningar
- [ ] Kan aktivera trafiknotifikationer
- [ ] Trafikhändelser laddas
- [ ] Filter fungerar
- [ ] Auto-refresh fungerar (2 min intervall)

### ✅ Broregister
- [ ] Brolistan visas
- [ ] Sökning fungerar
- [ ] Sortering fungerar
- [ ] Väderdata visas
- [ ] Adresser visas
- [ ] "Visa på karta" fungerar
- [ ] "Hämta trafikinfo" fungerar
- [ ] Pagination fungerar (Load More)

---

## Steg 10: Kontakta support om problem kvarstår

Om du fortfarande har problem efter att ha följt denna guide:

### 📋 Samla följande information:

1. **Console-fel:**
   - Ta screenshot av Console (F12)
   - Kopiera hela felmeddelandet

2. **Network-fel:**
   - Öppna Network-fliken (F12 → Network)
   - Filtrera på "Fetch/XHR"
   - Hitta misslyckade requests (röda)
   - Klicka på dem och kopiera:
     - Request URL
     - Request Method
     - Status Code
     - Response

3. **Användarinfo:**
   ```javascript
   // Kör i Console och kopiera output:
   const user = JSON.parse(localStorage.getItem('user'));
   console.log(JSON.stringify({
     email: user?.email,
     role: user?.role,
     id: user?.id
   }, null, 2));
   ```

4. **Supabase-status:**
   - Gå till Supabase Dashboard
   - Kolla "API Status" (ska vara grön)
   - Kopiera Project URL och API keys (endast non-secret)

5. **Exakt steg som orsakar problemet:**
   - Beskriv exakt vad du gör
   - Vilket resultat du förväntar dig
   - Vilket resultat du faktiskt får

### 📧 Skicka till Softgen Support:
- Email: support@softgen.ai
- Inkludera all information ovan
- Ämnesrad: "Svenska Bro App - [Kort beskrivning av problem]"

---

## Snabbreferens - Vanligaste problem

| Problem | Snabb lösning |
|---------|--------------|
| Knappar fungerar inte | `window.location.reload()` |
| Admin-panel tom | Kolla användarroll i Supabase |
| Kontakter visas inte | Kolla profiles-tabellen + RLS |
| Trafikvarningar laddar inte | Testa API manuellt (se Steg 5.3) |
| Bro ger koordinatfel | Validera koordinater (se Steg 6.3) |
| "Session expired" | Logga ut och in igen |
| Cache-problem | `localStorage.clear()` + hard refresh |
| Server crash | `pm2 restart all` |

---

**Lycka till! 🚀**  
Följ stegen systematiskt och du kommer hitta problemet.
