import type { EmailTemplate } from './welcome.template';

export interface NewLeadTemplateCtx {
  agentName: string;
  leadName?: string;
  leadPhone?: string;
  propertyTitle: string;
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

export function newLeadTemplate(ctx: NewLeadTemplateCtx): EmailTemplate {
  const subject = `New lead for "${ctx.propertyTitle}"`;

  const leadNameRow = ctx.leadName
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Name</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${ctx.leadName}</td></tr>`
    : '';

  const leadPhoneRow = ctx.leadPhone
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Phone</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;"><a href="tel:${ctx.leadPhone}" style="color:#2563eb;">${ctx.leadPhone}</a></td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;width:100%;">
        <tr><td>
          <div style="display:inline-block;background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px;">New Lead</div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">You have a new lead!</h1>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${ctx.agentName},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Someone expressed interest in your property listing:
          </p>
          <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">📍 ${ctx.propertyTitle}</p>
          </div>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
            <tbody>
              ${leadNameRow}
              ${leadPhoneRow}
            </tbody>
          </table>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${ctx.frontendUrl}/dashboard/leads" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">View Lead in Dashboard</a>
          </div>
          ${footer(ctx.frontendUrl)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines: string[] = [
    `New lead for "${ctx.propertyTitle}"`,
    '',
    `Hi ${ctx.agentName},`,
    '',
    `Someone expressed interest in your property: ${ctx.propertyTitle}`,
    '',
  ];
  if (ctx.leadName) textLines.push(`Name: ${ctx.leadName}`);
  if (ctx.leadPhone) textLines.push(`Phone: ${ctx.leadPhone}`);
  textLines.push('', `View in dashboard: ${ctx.frontendUrl}/dashboard/leads`);
  textLines.push('', '---', `SiteBank — Property listing platform · ${ctx.frontendUrl}`, 'This is a transactional email regarding your account.');

  return { subject, html, text: textLines.join('\n') };
}
