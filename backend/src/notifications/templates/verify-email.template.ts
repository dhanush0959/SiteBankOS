import type { EmailTemplate } from './welcome.template';

export interface VerifyEmailTemplateCtx {
  name: string;
  verifyUrl: string;
  frontendUrl: string;
}

function footer(frontendUrl: string): string {
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.5;">
      <p style="margin:0;">SiteBank — Property listing platform · <a href="${frontendUrl}" style="color:#6b7280;">${frontendUrl}</a></p>
      <p style="margin:4px 0 0;">This is a transactional email regarding your account.</p>
    </div>
  `;
}

export function verifyEmailTemplate(ctx: VerifyEmailTemplateCtx): EmailTemplate {
  const subject = 'Verify your SiteBank email address';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;width:100%;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Verify your email address</h1>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${ctx.name},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Please verify your email address by clicking the button below. This link expires in 24 hours.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${ctx.verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">Verify Email</a>
          </div>
          <p style="margin:0 0 32px;color:#6b7280;font-size:13px;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${ctx.verifyUrl}" style="color:#2563eb;word-break:break-all;">${ctx.verifyUrl}</a>
          </p>
          <p style="margin:0 0 0;color:#6b7280;font-size:13px;">
            If you didn't create a SiteBank account, you can safely ignore this email.
          </p>
          ${footer(ctx.frontendUrl)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Verify your SiteBank email address\n\nHi ${ctx.name},\n\nPlease verify your email address by visiting:\n${ctx.verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create a SiteBank account, you can safely ignore this email.\n\n---\nSiteBank — Property listing platform · ${ctx.frontendUrl}\nThis is a transactional email regarding your account.`;

  return { subject, html, text };
}
