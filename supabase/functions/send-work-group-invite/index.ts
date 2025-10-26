import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteEmailRequest {
  groupId: string;
  inviteCode: string;
  recipientEmail: string;
  recipientName?: string;
  hostName: string;
  groupName: string;
  inviteUrl: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { 
      groupId, 
      inviteCode, 
      recipientEmail, 
      recipientName,
      hostName, 
      groupName,
      inviteUrl 
    }: InviteEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !hostName || !groupName || !inviteUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: recipientEmail, hostName, groupName, inviteUrl' 
        }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Email content in both Swedish and English
    const emailSubject = `${hostName} har bjudit in dig till LexHub / ${hostName} invited you to LexHub`;
    
    const emailBodyHTML = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till ${groupName}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0C0C0C;
      color: #F5F5F5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #E76F51 0%, #F4A261 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin-bottom: 10px;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #E76F51;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      line-height: 1.6;
      margin-bottom: 16px;
      color: #D1D1D1;
    }
    .invite-code {
      background: rgba(231, 111, 81, 0.1);
      border: 2px solid #E76F51;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      color: #E76F51;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #E76F51 0%, #F4A261 100%);
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: #1a1a1a;
      padding: 30px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .footer p {
      font-size: 14px;
      color: #888;
      margin: 5px 0;
    }
    .powered-by {
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">LEXHUB</div>
      <p style="color: white; margin: 0;">Powered by LexFlares</p>
    </div>
    
    <div class="content">
      <h1>🎉 Du har blivit inbjuden! / You've been invited!</h1>
      
      <p><strong>${hostName}</strong> har bjudit in dig till arbetsgruppen "<strong>${groupName}</strong>" i LexHub.</p>
      <p><strong>${hostName}</strong> invited you to the work group "<strong>${groupName}</strong>" in LexHub.</p>
      
      <div class="invite-code">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #999;">INBJUDNINGSKOD / INVITE CODE</p>
        <div class="code">${inviteCode}</div>
      </div>
      
      <p>Gå med i gruppen genom att:</p>
      <ol style="color: #D1D1D1;">
        <li>Klicka på knappen nedan / Click the button below</li>
        <li>Eller använd inbjudningskoden ovan i appen / Or use the invite code above in the app</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">
          Gå med nu / Join Now →
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #888;">
        Om du inte känner igen den här inbjudan kan du ignorera det här mejlet.
      </p>
      <p style="font-size: 14px; color: #888;">
        If you don't recognize this invitation, you can ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Svenska Bro Aktiebolag</strong></p>
      <p>Professionell broinspektion och underhåll</p>
      <div class="powered-by">
        Made with ❤️ by LexFlares | LexHub Platform
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailBodyText = `
${hostName} har bjudit in dig till LexHub / ${hostName} invited you to LexHub

Du har blivit inbjuden till arbetsgruppen "${groupName}"
You've been invited to the work group "${groupName}"

Inbjudningskod / Invite Code: ${inviteCode}

Gå med genom att besöka / Join by visiting:
${inviteUrl}

---
Powered by LexFlares | LexHub Platform
Svenska Bro Aktiebolag
    `;

    // Send email using Supabase built-in SMTP (via auth.admin.inviteUserByEmail API)
    // Note: For production, configure SMTP settings in Supabase Dashboard -> Settings -> Auth -> SMTP Settings
    
    // Alternative: Use a dedicated email service API (SendGrid, Resend, etc.)
    // For now, we'll use fetch to call an external email API if configured
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LexHub <noreply@lexflares.com>',
        to: [recipientEmail],
        subject: emailSubject,
        html: emailBodyHTML,
        text: emailBodyText,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email send failed:', errorText);
      
      // Fallback: Log the invitation for manual follow-up
      console.log('MANUAL EMAIL FOLLOW-UP REQUIRED:');
      console.log(`To: ${recipientEmail}`);
      console.log(`Group: ${groupName}`);
      console.log(`Invite Code: ${inviteCode}`);
      console.log(`URL: ${inviteUrl}`);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Email service unavailable. Invitation logged for manual follow-up.',
          inviteUrl,
          inviteCode 
        }),
        { 
          status: 200, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailId: emailData.id,
        inviteUrl 
      }),
      { 
        status: 200, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-work-group-invite:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );
  }
});