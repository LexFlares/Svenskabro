# 📧 Supabase Email Templates - Svenska Bro Aktiebolag

## 🎯 VIKTIGT: Konfigurera e-postmallar med callback-URL

⚠️ **KRITISKT:** Alla e-postmallar MÅSTE använda `/auth/callback` som redirect URL för att auth-flödet ska fungera korrekt.

---

## 📋 Steg-för-steg instruktioner

### 1. Öppna Supabase Dashboard
1. Gå till [https://supabase.com](https://supabase.com)
2. Logga in och välj ditt Svenska Bro-projekt
3. Gå till **Authentication** → **Email Templates**

### 2. Uppdatera varje mall enligt nedan
- Kopiera **exakt** text från denna fil
- Klicka **Save** efter varje mall

---

## 📧 MALL 1: CONFIRM SIGNUP (E-postbekräftelse)

**Subject heading:**
```
Bekräfta din e-post - Svenska Bro Aktiebolag
```

**Message body:**
```html
<h2>Välkommen till LexHub!</h2>

<p>Tack för att du registrerat dig hos <strong>Svenska Bro Aktiebolag</strong>.</p>

<p>Klicka på knappen nedan för att bekräfta din e-postadress och aktivera ditt konto:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup" style="display: inline-block; padding: 12px 24px; background-color: #e76f51; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekräfta e-post</a></p>

<p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
<p style="color: #666; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Om du inte begärde detta konto kan du ignorera detta e-postmeddelande.<br>
  <strong>LexHub</strong> - Utvecklad av LexFlares för Svenska Bro Aktiebolag
</p>
```

---

## 📧 MALL 2: RESET PASSWORD (Återställ lösenord)

**Subject heading:**
```
Återställ ditt lösenord - Svenska Bro Aktiebolag
```

**Message body:**
```html
<h2>Återställ ditt lösenord</h2>

<p>Vi har mottagit en begäran om att återställa lösenordet för ditt konto hos <strong>Svenska Bro Aktiebolag</strong>.</p>

<p>Klicka på knappen nedan för att skapa ett nytt lösenord:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery" style="display: inline-block; padding: 12px 24px; background-color: #e76f51; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Återställ lösenord</a></p>

<p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
<p style="color: #666; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery</p>

<p style="color: #d32f2f; font-weight: bold;">⚠️ Denna länk är giltig i 60 minuter.</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Om du inte begärde denna återställning kan du ignorera detta e-postmeddelande. Ditt lösenord förblir oförändrat.<br>
  <strong>LexHub</strong> - Utvecklad av LexFlares för Svenska Bro Aktiebolag
</p>
```

---

## 📧 MALL 3: INVITE USER (Bjud in användare)

**Subject heading:**
```
Inbjudan till LexHub - Svenska Bro Aktiebolag
```

**Message body:**
```html
<h2>Du har blivit inbjuden!</h2>

<p>Du har blivit inbjuden att gå med i <strong>LexHub</strong> för <strong>Svenska Bro Aktiebolag</strong>.</p>

<p>Klicka på knappen nedan för att acceptera inbjudan och skapa ditt konto:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite" style="display: inline-block; padding: 12px 24px; background-color: #e76f51; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Acceptera inbjudan</a></p>

<p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
<p style="color: #666; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Om du inte förväntade dig denna inbjudan kan du ignorera detta e-postmeddelande.<br>
  <strong>LexHub</strong> - Utvecklad av LexFlares för Svenska Bro Aktiebolag
</p>
```

---

## 📧 MALL 4: MAGIC LINK (Magisk länk - valfritt)

**Subject heading:**
```
Din inloggningslänk - Svenska Bro Aktiebolag
```

**Message body:**
```html
<h2>Logga in på LexHub</h2>

<p>Klicka på knappen nedan för att logga in på ditt konto hos <strong>Svenska Bro Aktiebolag</strong>:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink" style="display: inline-block; padding: 12px 24px; background-color: #e76f51; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Logga in</a></p>

<p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
<p style="color: #666; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink</p>

<p style="color: #d32f2f; font-weight: bold;">⚠️ Denna länk är giltig i 60 minuter.</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Om du inte begärde denna inloggningslänk kan du ignorera detta e-postmeddelande.<br>
  <strong>LexHub</strong> - Utvecklad av LexFlares för Svenska Bro Aktiebolag
</p>
```

---

## 📧 MALL 5: CHANGE EMAIL ADDRESS (Ändra e-postadress)

**Subject heading:**
```
Bekräfta din nya e-postadress - Svenska Bro Aktiebolag
```

**Message body:**
```html
<h2>Bekräfta din nya e-postadress</h2>

<p>Du har begärt att ändra e-postadressen för ditt konto hos <strong>Svenska Bro Aktiebolag</strong>.</p>

<p>Klicka på knappen nedan för att bekräfta din nya e-postadress:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change" style="display: inline-block; padding: 12px 24px; background-color: #e76f51; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekräfta ny e-post</a></p>

<p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
<p style="color: #666; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Om du inte begärde denna ändring kan du ignorera detta e-postmeddelande.<br>
  <strong>LexHub</strong> - Utvecklad av LexFlares för Svenska Bro Aktiebolag
</p>
```

---

## 🔧 KRITISKA URL-inställningar

### Supabase URL Configuration

Gå till **Authentication** → **URL Configuration** och sätt:

#### **Site URL:**
```
https://sg-a6adcbbb-273d-47ee-8429-93116e3e.vercel.app
```
(Din faktiska production-domän)

#### **Redirect URLs:** (lägg till ALLA dessa)
```
https://sg-a6adcbbb-273d-47ee-8429-93116e3e.vercel.app/**
https://*-softgen-all.vercel.app/**
http://localhost:3000/**
```

**Viktigt:** Wildcard (`/**`) MÅSTE finnas i slutet!

---

## ✅ Så här fungerar det nya flödet

### 1. **Användare får e-post** med länk till:
```
https://your-domain.com/auth/callback?token_hash=ABC123&type=signup
```

### 2. **Callback-sidan** tar emot länken och:
- Visar laddningsindikator
- Identifierar `type` (signup, recovery, invite, etc.)
- Redirectar till rätt sida med token

### 3. **Användaren hamnar på rätt sida:**
- **Signup/Invite** → `/auth/confirm-email` med grön checkmark
- **Recovery** → `/auth/reset-password` med lösenordsformulär
- **Email change** → `/auth/confirm-email` med bekräftelse

### 4. **Efter bekräftelse:**
- Automatisk redirect till inloggningssidan
- Tydligt success-meddelande
- Användaren kan logga in

---

## 🎯 Skillnad mellan auth-sidorna

### **`/auth/confirm-email`** (Endast bekräftelse)
- **Används för:** Signup, Email change
- **Visar:** Grön checkmark + "E-post bekräftad!"
- **Kräver inget input:** Automatisk redirect efter 2 sekunder
- **Syfte:** Bekräfta e-postadress

### **`/auth/set-password`** (Skapa nytt lösenord)
- **Används för:** Invite (första gången användaren sätter lösenord)
- **Visar:** Välkomstmeddelande + lösenordsformulär
- **Kräver input:** Användaren måste ange och bekräfta lösenord
- **Syfte:** Låta inbjuden användare skapa sitt eget lösenord

### **`/auth/reset-password`** (Återställ befintligt lösenord)
- **Används för:** Recovery (glömt lösenord)
- **Visar:** Lösenordsformulär
- **Kräver input:** Användaren måste ange nytt lösenord
- **Syfte:** Återställa glömt lösenord för befintligt konto

---

## 🧪 Testplan

### **Steg 1: Uppdatera e-postmallarna**
1. Kopiera mallarna från denna fil
2. Klistra in i Supabase Dashboard
3. Klicka Save på varje mall
4. Verifiera att `{{ .SiteURL }}/auth/callback` finns i varje länk
5. **KRITISKT:** Kontrollera att `&type=invite` finns i MALL 3

### **Steg 2: Testa användarinbjudan (NYTT)**
1. Gå till admin-panelen
2. Bjud in en testanvändare (test@example.com)
3. Kontrollera att e-post kommer
4. Klicka på länken i e-posten
5. ✅ Ska visa callback-laddning → set-password med välkomstmeddelande
6. ✅ Ska visa två lösenordsfält
7. Ange lösenord (minst 6 tecken) i båda fälten
8. ✅ Ska visa "Lösenord sparat!" med grön checkmark
9. ✅ Ska redirecta till login efter 3 sekunder
10. Logga in med e-post + nytt lösenord
11. ✅ Ska kunna komma in i appen

### **Steg 3: Testa "Glömt lösenord"**
1. Gå till login-sidan
2. Klicka "Glömt lösenord?"
3. Ange e-post och skicka
4. Kontrollera att e-post kommer
5. Klicka på länken
6. ✅ Ska visa callback-laddning → reset-password formulär
7. Ange nytt lösenord
8. ✅ Ska visa success → redirecta till login

### **Steg 4: Verifiera alla felmeddelanden är på svenska**
- ❌ Felaktigt lösenord: "Felaktigt användarnamn eller lösenord"
- ❌ E-post inte bekräftad: "E-postadressen är inte bekräftad..."
- ❌ Lösenord matchar inte: "Lösenorden matchar inte"
- ❌ För kort lösenord: "Lösenordet måste vara minst 6 tecken"
- ❌ Lösenordsfält tomt: "Detta fält är obligatoriskt"

---

## 📊 Checklista för godkänt test

- [ ] Alla 5 e-postmallar uppdaterade med `/auth/callback`
- [ ] MALL 3 innehåller `&type=invite` i länken
- [ ] Site URL korrekt konfigurerad
- [ ] Redirect URLs inkluderar wildcard (`/**`)
- [ ] Callback-sidan fungerar (visar laddning)
- [ ] Användarinbjudan visar set-password-formulär
- [ ] Lösenord kan skapas och sparas
- [ ] Lösenordsåterställning visar reset-formulär
- [ ] Automatisk redirect efter success
- [ ] Alla felmeddelanden på svenska
- [ ] Ingen går direkt till login utan att se bekräftelse/formulär
- [ ] Inbjuden användare kan logga in efter att ha skapat lösenord

---

## 🚨 Felsökning

### **"Användare hamnar bara på login"**
➡️ **Lösning:** Uppdatera e-postmallarna med `/auth/callback` enligt ovan

### **"Invalid confirmation link"**
➡️ **Lösning:** Kontrollera att `{{ .TokenHash }}` finns i e-postmallen

### **"Callback-sidan laddar för alltid"**
➡️ **Lösning:** Kontrollera att `type` parameter finns i URL:en

### **"E-post kommer inte fram"**
➡️ **Lösning:** 
1. Kolla Spam/Skräppost
2. Verifiera SMTP-inställningar
3. Kolla Supabase Logs → Auth Logs

---

## 📞 Support

**Problem kvarstår?**
- **LexFlares Support:** ops@lexflares.com (24/7)
- **Supabase Docs:** [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)

---

**Uppdaterad:** 2025-10-23  
**Version:** 2.0 (med callback-support)  
**För:** Svenska Bro Aktiebolag - LexHub  
**Av:** LexFlares Development Team
