import type { EmailTemplate } from './welcome.template';

export interface PasswordResetTemplateCtx {
  name: string;
  resetUrl: string;
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

export function passwordResetTemplate(ctx: PasswordResetTemplateCtx): EmailTemplate {
  const subject = 'Reset your SiteBank password';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;width:100%;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${ctx.name},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Click the button below to choose a new password.
            This link expires in 1 hour.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${ctx.resetUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">Reset Password</a>
          </div>
          <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${ctx.resetUrl}" style="color:#2563eb;word-break:break-all;">${ctx.resetUrl}</a>
          </p>
          <p style="margin:0 0 0;color:#6b7280;font-size:13px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not change.
          </p>
          ${footer(ctx.frontendUrl)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Reset your SiteBank password\n\nHi ${ctx.name},\n\nWe received a request to reset your password. Visit the link below to choose a new password (expires in 1 hour):\n${ctx.resetUrl}\n\nIf you didn't request a password reset, you can safely ignore this email.\n\n---\nSiteBank — Property listing platform · ${ctx.frontendUrl}\nThis is a transactional email regarding your account.`;

  return { subject, html, text };
}
