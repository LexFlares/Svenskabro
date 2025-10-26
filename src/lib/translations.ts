import { useState, useEffect } from "react";
export type Language = "sv" | "en";

export type TranslationKey =
  | "title"
  | "dashboard"
  | "bridges"
  | "jobs"
  | "journal"
  | "deviations"
  | "documents"
  | "contacts"
  | "settings"
  | "ai_assistant"
  | "admin"
  | "logout"
  | "login"
  | "new_job"
  | "new_bridge"
  | "select_bridge"
  | "start_time"
  | "end_time"
  | "total_time"
  | "responsible_user"
  | "materials"
  | "notes"
  | "status"
  | "add_job"
  | "save_job"
  | "cancel"
  | "add_bridge"
  | "bridge_name"
  | "latitude"
  | "longitude"
  | "description"
  | "save_bridge"
  | "all_bridges"
  | "edit_bridge"
  | "delete_bridge"
  | "select_responsible_user"
  | "time_spent"
  | "actions"
  | "edit"
  | "delete"
  | "view"
  | "are_you_sure_delete_job"
  | "confirm_delete"
  | "add_deviation"
  | "report_deviation"
  | "deviation_type"
  | "deviation_description"
  | "suggested_action"
  | "upload_photos"
  | "submit_deviation"
  | "all_deviations"
  | "reported_by"
  | "no_deviations_found"
  | "deviation_details"
  | "all_documents"
  | "upload_document"
  | "document_title"
  | "document_category"
  | "document_content"
  | "file_url"
  | "version"
  | "save_document"
  | "no_documents_found"
  | "document_details"
  | "all_contacts"
  | "add_contact"
  | "contact_name"
  | "role"
  | "phone"
  | "email"
  | "company"
  | "save_contact"
  | "no_contacts_found"
  | "theme"
  | "language"
  | "light"
  | "dark"
  | "system"
  | "ask_ai_assistant"
  | "admin_panel"
  | "manage_users"
  | "user_name"
  | "user_email"
  | "user_role"
  | "user_status"
  | "invite_user"
  | "full_name"
  | "send_invitation"
  | "work_groups"
  | "create_work_group"
  | "group_name"
  | "invite_members"
  | "join_work_group"
  | "invitation_code"
  | "join"
  | "active"
  | "inactive"
  | "pending"
  | "employee"
  | "admin_role"
  | "about_lexflares"
  | "my_account"
  | "chat"
  | "online"
  | "offline"
  | "away"
  | "send_message"
  | "realtime_chat"
  | "video_call"
  | "audio_call"
  | "incoming_call"
  | "accept"
  | "decline"
  | "call_ended"
  | "save_qr_code"
  | "scan_qr_code"
  | "traffic_alerts"
  | "traffic_notifications_settings"
  | "sync_status"
  | "sync_data"
  | "unsynced_changes"
  | "all_synced"
  | "last_sync"
  | "never"
  | "sync_now"
  | "map_view"
  | "list_view"
  | "search"
  | "open"
  | "in_progress"
  | "closed"
  | "loading"
  | "error"
  | "retry"
  | "are_you_sure"
  | "delete_confirmation_message"
  | "yes"
  | "no"
  | "filter"
  | "new_deviation"
  | "unknown_user"
  | "proposal"
  | "photos"
  | "message"
  | "new_document"
  | "created_by"
  | "name"
  | "close"
  | "noJobsToday"
  | "dailyReport"
  | "greeting"
  | "attachedReport"
  | "numberOfJobs"
  | "bestRegards"
  | "bridgeRegister"
  | "startNewJob"
  | "contactsTitle"
  | "kmaDocuments"
  | "welcomeBack"
  | "lastActivity"
  | "safetyFirst"
  | "safetyMessage"
  | "biometricNotSupported"
  | "invalidCredentials"
  | "password"
  | "biometricLogin"
  | "copied"
  | "inviteCodeCopied"
  | "inviteLinkCopied"
  | "qrDownloaded"
  | "emailMissing"
  | "enterEmailAddress"
  | "emailSent"
  | "inviteSentTo"
  | "inviteParticipants"
  | "inviteDescription"
  | "inviteCode"
  | "inviteLink"
  | "showQRCode"
  | "qrCodeTitle"
  | "qrCodeDescription"
  | "downloadQRCode"
  | "sendEmail"
  | "sendInviteEmail"
  | "enterEmail"
  | "emailAddress"
  | "sending"
  | "sendInvite"
  | "page"
  | "madeByLexHub"
  | "bridgeId"
  | "date"
  | "jobReport"
  | "gpsPosition"
  | "hours"
  | "back"
  | "adminTitle"
  | "jobsThisWeek"
  | "avgTime"
  | "totalDeviations"
  | "userManagement"
  | "save"
  | "rateLimitError"
  | "aiError"
  | "summarizeDiary"
  | "suggestAction"
  | "explainKMA"
  | "typeMessage"
  | "searchBridges"
  | "showOnMap"
  | "startJob"
  | "fetchTrafficInfo"
  | "trafficInfo"
  | "loadingTrafficInfo"
  | "noTrafficInfo"
  | "noBridges"
  | "lexChatEncryption"
  | "call"
  | "admins"
  | "staff"
  | "emergency"
  | "loadingInvite"
  | "welcomeToTheGroup"
  | "mustBeLoggedIn"
  | "joining"
  | "joinGroup"
  | "developedBy"
  | "for"
  | "noJobs"
  | "journalTitle"
  | "completed"
  | "reported"
  | "exportPDF"
  | "all"
  | "photo"
  | "jobSaved"
  | "selectBridgePlaceholder"
  | "fetchingGPS"
  | "confirmClear"
  | "dataCleared"
  | "settingsTitle"
  | "darkMode"
  | "lightMode"
  | "clearData";

export const translations: Record<Language, Record<string, string>> = {
  sv: {
    title: "Svenska Bro App",
    dashboard: "Översikt",
    bridges: "Broar",
    jobs: "Arbeten",
    journal: "Journal",
    deviations: "Avvikelser",
    documents: "Dokument",
    contacts: "Kontakter",
    settings: "Inställningar",
    ai_assistant: "AI-Assistent",
    admin: "Admin",
    logout: "Logga ut",
    login: "Logga in",
    new_job: "Nytt Arbete",
    new_bridge: "Ny Bro",
    select_bridge: "Välj bro",
    start_time: "Starttid",
    end_time: "Sluttid",
    total_time: "Total tid",
    responsible_user: "Ansvarig",
    materials: "Material",
    notes: "Anteckningar",
    status: "Status",
    add_job: "Lägg till arbete",
    save_job: "Spara arbete",
    cancel: "Avbryt",
    add_bridge: "Lägg till bro",
    bridge_name: "Brons namn",
    latitude: "Latitud",
    longitude: "Longitud",
    description: "Beskrivning",
    save_bridge: "Spara bro",
    all_bridges: "Alla broar",
    edit_bridge: "Redigera bro",
    delete_bridge: "Ta bort bro",
    select_responsible_user: "Välj ansvarig användare",
    time_spent: "Tidsåtgång (timmar)",
    actions: "Åtgärder",
    edit: "Redigera",
    delete: "Ta bort",
    view: "Visa",
    are_you_sure_delete_job: "Är du säker på att du vill ta bort detta arbete?",
    confirm_delete: "Ja, ta bort",
    add_deviation: "Lägg till avvikelse",
    report_deviation: "Rapportera Avvikelse",
    deviation_type: "Typ av avvikelse",
    deviation_description: "Beskrivning av avvikelse",
    suggested_action: "Förslag på åtgärd",
    upload_photos: "Ladda upp bilder",
    submit_deviation: "Skicka in avvikelse",
    all_deviations: "Alla avvikelser",
    reported_by: "Rapporterad av",
    no_deviations_found: "Inga avvikelser hittades",
    deviation_details: "Avvikelsedetaljer",
    all_documents: "Alla dokument",
    upload_document: "Ladda upp dokument",
    document_title: "Titel",
    document_category: "Kategori",
    document_content: "Innehåll",
    file_url: "Fillänk",
    version: "Version",
    save_document: "Spara dokument",
    no_documents_found: "Inga dokument hittades",
    document_details: "Dokumentdetaljer",
    all_contacts: "Alla kontakter",
    add_contact: "Lägg till kontakt",
    contact_name: "Namn",
    role: "Roll",
    phone: "Telefon",
    email: "E-post",
    company: "Företag",
    save_contact: "Spara kontakt",
    no_contacts_found: "Inga kontakter hittades",
    theme: "Tema",
    language: "Språk",
    light: "Ljus",
    dark: "Mörk",
    system: "System",
    ask_ai_assistant: "Fråga AI-assistenten",
    admin_panel: "Adminpanel",
    manage_users: "Hantera användare",
    user_name: "Användarnamn",
    user_email: "E-post",
    user_role: "Roll",
    user_status: "Status",
    invite_user: "Bjud in användare",
    full_name: "Fullständigt namn",
    send_invitation: "Skicka inbjudan",
    work_groups: "Arbetsgrupper",
    create_work_group: "Skapa arbetsgrupp",
    group_name: "Gruppnamn",
    invite_members: "Bjud in medlemmar",
    join_work_group: "Gå med i arbetsgrupp",
    invitation_code: "Inbjudningskod",
    join: "Gå med",
    active: "Aktiv",
    inactive: "Inaktiv",
    pending: "Väntar",
    employee: "Anställd",
    admin_role: "Administratör",
    about_lexflares: "Om Lexflares",
    my_account: "Mitt konto",
    chat: "Chatt",
    online: "Online",
    offline: "Offline",
    away: "Frånvarande",
    send_message: "Skicka meddelande",
    realtime_chat: "Realtidschatt",
    video_call: "Videosamtal",
    audio_call: "Ljudsamtal",
    incoming_call: "Inkommande samtal",
    accept: "Acceptera",
    decline: "Neka",
    call_ended: "Samtal avslutat",
    save_qr_code: "Spara QR-kod",
    scan_qr_code: "Skanna QR-kod",
    traffic_alerts: "Trafikvarningar",
    traffic_notifications_settings: "Inställningar för trafiknotiser",
    sync_status: "Synk-status",
    sync_data: "Synka data",
    unsynced_changes: "Osynkade ändringar",
    all_synced: "Allt är synkat",
    last_sync: "Senaste synk",
    never: "aldrig",
    sync_now: "Synka nu",
    map_view: "Kartvy",
    list_view: "Listvy",
    search: "Sök",
    open: "Öppen",
    in_progress: "Pågående",
    closed: "Stängd",
    loading: "Laddar",
    error: "Fel",
    retry: "Försök igen",
    are_you_sure: "Är du säker?",
    delete_confirmation_message: "Denna åtgärd kan inte ångras.",
    yes: "Ja",
    no: "Nej",
    filter: "Filter",
    new_deviation: "Ny avvikelse",
    unknown_user: "Okänd användare",
    proposal: "Förslag",
    photos: "Bilder",
    message: "Meddelande",
    new_document: "Nytt dokument",
    created_by: "Skapad av",
    name: "Namn",
    close: "Stäng",
    noJobsToday: "Inga jobb idag",
    dailyReport: "Daglig rapport",
    greeting: "Hälsning",
    attachedReport: "Bifogad rapport",
    numberOfJobs: "Antal jobb",
    bestRegards: "Med vänliga hälsningar",
    bridgeRegister: "Broregister",
    startNewJob: "Starta nytt jobb",
    contactsTitle: "Kontakter",
    kmaDocuments: "KMA Dokument",
    welcomeBack: "Välkommen tillbaka",
    lastActivity: "Senaste aktivitet",
    safetyFirst: "Säkerheten först",
    safetyMessage: "Var alltid medveten om din omgivning.",
    biometricNotSupported: "Biometrisk inloggning stöds inte",
    invalidCredentials: "Felaktiga inloggningsuppgifter",
    password: "Lösenord",
    biometricLogin: "Biometrisk inloggning",
    copied: "Kopierad",
    inviteCodeCopied: "Inbjudningskod kopierad",
    inviteLinkCopied: "Inbjudningslänk kopierad",
    qrDownloaded: "QR-kod nedladdad",
    emailMissing: "E-post saknas",
    enterEmailAddress: "Ange e-postadress",
    emailSent: "E-post skickad",
    inviteSentTo: "Inbjudan skickad till",
    inviteParticipants: "Bjud in deltagare",
    inviteDescription: "Bjud in deltagare till din arbetsgrupp",
    inviteCode: "Inbjudningskod",
    inviteLink: "Inbjudningslänk",
    showQRCode: "Visa QR-kod",
    qrCodeTitle: "QR-kod",
    qrCodeDescription: "Skanna för att gå med i gruppen",
    downloadQRCode: "Ladda ner QR-kod",
    sendEmail: "Skicka e-post",
    sendInviteEmail: "Skicka inbjudan via e-post",
    enterEmail: "Ange e-post",
    emailAddress: "E-postadress",
    sending: "Skickar...",
    sendInvite: "Skicka inbjudan",
    page: "Sida",
    madeByLexHub: "Gjord av LexHub",
    bridgeId: "Bro ID",
    date: "Datum",
    jobReport: "Jobbrapport",
    gpsPosition: "GPS Position",
    hours: "timmar",
    back: "Tillbaka",
    adminTitle: "Adminpanel",
    jobsThisWeek: "Jobb denna vecka",
    avgTime: "Genomsnittlig tid",
    totalDeviations: "Totala avvikelser",
    userManagement: "Användarhantering",
    save: "Spara",
    rateLimitError: "Rate limit överskriden",
    aiError: "AI-fel",
    summarizeDiary: "Summera dagbok",
    suggestAction: "Föreslå åtgärd",
    explainKMA: "Förklara KMA",
    typeMessage: "Skriv meddelande...",
    searchBridges: "Sök broar",
    showOnMap: "Visa på kartan",
    startJob: "Starta jobb",
    fetchTrafficInfo: "Hämta trafikinfo",
    trafficInfo: "Trafikinformation",
    loadingTrafficInfo: "Laddar trafikinformation...",
    noTrafficInfo: "Ingen trafikinformation tillgänglig",
    noBridges: "Inga broar",
    lexChatEncryption: "LexChat kryptering",
    call: "Ring",
    admins: "Administratörer",
    staff: "Personal",
    emergency: "Nödsituation",
    loadingInvite: "Laddar inbjudan...",
    welcomeToTheGroup: "Välkommen till gruppen!",
    mustBeLoggedIn: "Du måste vara inloggad",
    joining: "Ansluter...",
    joinGroup: "Gå med i grupp",
    developedBy: "Utvecklad av",
    for: "för",
    noJobs: "Inga jobb",
    journalTitle: "Journal",
    completed: "Avslutade",
    reported: "Rapporterade",
    exportPDF: "Exportera PDF",
    all: "Alla",
    photo: "Foto",
    jobSaved: "Jobb sparat",
    selectBridgePlaceholder: "Välj en bro",
    fetchingGPS: "Hämtar GPS...",
    confirmClear: "Bekräfta rensning",
    dataCleared: "Data rensad",
    settingsTitle: "Inställningar",
    darkMode: "Mörkt läge",
    lightMode: "Ljust läge",
    clearData: "Rensa data"
  },
  en: {
    title: "Swedish Bridge App",
    dashboard: "Dashboard",
    bridges: "Bridges",
    jobs: "Jobs",
    journal: "Journal",
    deviations: "Deviations",
    documents: "Documents",
    contacts: "Contacts",
    settings: "Settings",
    ai_assistant: "AI Assistant",
    admin: "Admin",
    logout: "Logout",
    login: "Login",
    new_job: "New Job",
    new_bridge: "New Bridge",
    select_bridge: "Select bridge",
    start_time: "Start time",
    end_time: "End time",
    total_time: "Total time",
    responsible_user: "Responsible",
    materials: "Materials",
    notes: "Notes",
    status: "Status",
    add_job: "Add job",
    save_job: "Save job",
    cancel: "Cancel",
    add_bridge: "Add bridge",
    bridge_name: "Bridge name",
    latitude: "Latitude",
    longitude: "Longitude",
    description: "Description",
    save_bridge: "Save bridge",
    all_bridges: "All bridges",
    edit_bridge: "Edit bridge",
    delete_bridge: "Delete bridge",
    select_responsible_user: "Select responsible user",
    time_spent: "Time spent (hours)",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    are_you_sure_delete_job: "Are you sure you want to delete this job?",
    confirm_delete: "Yes, delete",
    add_deviation: "Add deviation",
    report_deviation: "Report Deviation",
    deviation_type: "Type of deviation",
    deviation_description: "Description of deviation",
    suggested_action: "Suggested action",
    upload_photos: "Upload photos",
    submit_deviation: "Submit deviation",
    all_deviations: "All deviations",
    reported_by: "Reported by",
    no_deviations_found: "No deviations found",
    deviation_details: "Deviation details",
    all_documents: "All documents",
    upload_document: "Upload document",
    document_title: "Title",
    document_category: "Category",
    document_content: "Content",
    file_url: "File URL",
    version: "Version",
    save_document: "Save document",
    no_documents_found: "No documents found",
    document_details: "Document details",
    all_contacts: "All contacts",
    add_contact: "Add contact",
    contact_name: "Name",
    role: "Role",
    phone: "Phone",
    email: "Email",
    company: "Company",
    save_contact: "Save contact",
    no_contacts_found: "No contacts found",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
    ask_ai_assistant: "Ask AI assistant",
    admin_panel: "Admin Panel",
    manage_users: "Manage Users",
    user_name: "Username",
    user_email: "Email",
    user_role: "Role",
    user_status: "Status",
    invite_user: "Invite User",
    full_name: "Full name",
    send_invitation: "Send Invitation",
    work_groups: "Work Groups",
    create_work_group: "Create Work Group",
    group_name: "Group Name",
    invite_members: "Invite Members",
    join_work_group: "Join Work Group",
    invitation_code: "Invitation Code",
    join: "Join",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    employee: "Employee",
    admin_role: "Administrator",
    about_lexflares: "About Lexflares",
    my_account: "My Account",
    chat: "Chat",
    online: "Online",
    offline: "Offline",
    away: "Away",
    send_message: "Send message",
    realtime_chat: "Real-time Chat",
    video_call: "Video Call",
    audio_call: "Audio Call",
    incoming_call: "Incoming Call",
    accept: "Accept",
    decline: "Decline",
    call_ended: "Call Ended",
    save_qr_code: "Save QR Code",
    scan_qr_code: "Scan QR Code",
    traffic_alerts: "Traffic Alerts",
    traffic_notifications_settings: "Traffic Notification Settings",
    sync_status: "Sync Status",
    sync_data: "Sync Data",
    unsynced_changes: "Unsynced Changes",
    all_synced: "All Synced",
    last_sync: "Last Sync",
    never: "never",
    sync_now: "Sync Now",
    map_view: "Map View",
    list_view: "List View",
    search: "Search",
    open: "Open",
    in_progress: "In Progress",
    closed: "Closed",
    loading: "Loading",
    error: "Error",
    retry: "Retry",
    are_you_sure: "Are you sure?",
    delete_confirmation_message: "This action cannot be undone.",
    yes: "Yes",
    no: "No",
    filter: "Filter",
    new_deviation: "New Deviation",
    unknown_user: "Unknown user",
    proposal: "Proposal",
    photos: "Photos",
    message: "Message",
    new_document: "New Document",
    created_by: "Created by",
    name: "Name",
    close: "Close",
    noJobsToday: "No jobs today",
    dailyReport: "Daily report",
    greeting: "Greeting",
    attachedReport: "Attached report",
    numberOfJobs: "Number of jobs",
    bestRegards: "Best regards",
    bridgeRegister: "Bridge register",
    startNewJob: "Start new job",
    contactsTitle: "Contacts",
    kmaDocuments: "KMA Documents",
    welcomeBack: "Welcome back",
    lastActivity: "Last activity",
    safetyFirst: "Safety first",
    safetyMessage: "Always be aware of your surroundings.",
    biometricNotSupported: "Biometric login not supported",
    invalidCredentials: "Invalid credentials",
    password: "Password",
    biometricLogin: "Biometric login",
    copied: "Copied",
    inviteCodeCopied: "Invite code copied",
    inviteLinkCopied: "Invite link copied",
    qrDownloaded: "QR code downloaded",
    emailMissing: "Email missing",
    enterEmailAddress: "Enter email address",
    emailSent: "Email sent",
    inviteSentTo: "Invite sent to",
    inviteParticipants: "Invite participants",
    inviteDescription: "Invite participants to your work group",
    inviteCode: "Invite code",
    inviteLink: "Invite link",
    showQRCode: "Show QR code",
    qrCodeTitle: "QR Code",
    qrCodeDescription: "Scan to join the group",
    downloadQRCode: "Download QR code",
    sendEmail: "Send email",
    sendInviteEmail: "Send invite email",
    enterEmail: "Enter email",
    emailAddress: "Email address",
    sending: "Sending...",
    sendInvite: "Send invite",
    page: "Page",
    madeByLexHub: "Made by LexHub",
    bridgeId: "Bridge ID",
    date: "Date",
    jobReport: "Job report",
    gpsPosition: "GPS Position",
    hours: "hours",
    back: "Back",
    adminTitle: "Admin Panel",
    jobsThisWeek: "Jobs this week",
    avgTime: "Average time",
    totalDeviations: "Total deviations",
    userManagement: "User management",
    save: "Save",
    rateLimitError: "Rate limit exceeded",
    aiError: "AI error",
    summarizeDiary: "Summarize diary",
    suggestAction: "Suggest action",
    explainKMA: "Explain KMA",
    typeMessage: "Type message...",
    searchBridges: "Search bridges",
    showOnMap: "Show on map",
    startJob: "Start job",
    fetchTrafficInfo: "Fetch traffic info",
    trafficInfo: "Traffic info",
    loadingTrafficInfo: "Loading traffic info...",
    noTrafficInfo: "No traffic info available",
    noBridges: "No bridges",
    lexChatEncryption: "LexChat encryption",
    call: "Call",
    admins: "Admins",
    staff: "Staff",
    emergency: "Emergency",
    loadingInvite: "Loading invite...",
    welcomeToTheGroup: "Welcome to the group!",
    mustBeLoggedIn: "You must be logged in",
    joining: "Joining...",
    joinGroup: "Join group",
    developedBy: "Developed by",
    for: "for",
    noJobs: "No jobs",
    journalTitle: "Journal",
    completed: "Completed",
    reported: "Reported",
    exportPDF: "Export PDF",
    all: "All",
    photo: "Photo",
    jobSaved: "Job saved",
    selectBridgePlaceholder: "Select a bridge",
    fetchingGPS: "Fetching GPS...",
    confirmClear: "Confirm clear",
    dataCleared: "Data cleared",
    settingsTitle: "Settings",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    clearData: "Clear data"
  },
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>("sv");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && ["sv", "en"].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    setLanguage(lang);
    // Consider reloading the page to apply language changes everywhere
    // window.location.reload();
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return { t, language, changeLanguage, setLanguage };
};
