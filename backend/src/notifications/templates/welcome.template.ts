export interface WelcomeTemplateCtx {
  name: string;
  frontendUrl: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function footer(frontendUrl: string): string {
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.5;">
      <p style="margin:0;">SiteBank — Property listing platform · <a href="${frontendUrl}" style="color:#6b7280;">${frontendUrl}</a></p>
      <p style="margin:4px 0 0;">This is a transactional email regarding your account.</p>
    </div>
  `;
}

export function welcomeTemplate(ctx: WelcomeTemplateCtx): EmailTemplate {
  const subject = `Welcome to SiteBank, ${ctx.name}!`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;width:100%;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827;">Welcome to SiteBank 🏡</h1>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${ctx.name},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            We're thrilled to have you on board. SiteBank helps real estate agents list properties,
            generate smart shareable links, and convert leads — all in one place.
          </p>
          <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6;">
            Get started by adding your first property listing.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${ctx.frontendUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">Go to Dashboard</a>
          </div>
          ${footer(ctx.frontendUrl)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Welcome to SiteBank, ${ctx.name}!\n\nWe're thrilled to have you on board. SiteBank helps real estate agents list properties, generate smart shareable links, and convert leads — all in one place.\n\nGet started: ${ctx.frontendUrl}/dashboard\n\n---\nSiteBank — Property listing platform · ${ctx.frontendUrl}\nThis is a transactional email regarding your account.`;

  return { subject, html, text };
}
