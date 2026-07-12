import type { EmailTemplate } from './welcome.template';

export interface SubscriptionReceiptTemplateCtx {
  name: string;
  plan: string;
  amountInr: number;
  paymentRef: string;
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

export function subscriptionReceiptTemplate(ctx: SubscriptionReceiptTemplateCtx): EmailTemplate {
  const subject = `Payment receipt — SiteBank ${ctx.plan} plan`;
  const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(ctx.amountInr);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;width:100%;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Payment Receipt</h1>
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${ctx.name},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Thank you for your payment. Your subscription has been activated.
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:28px;">
            <table cellpadding="0" cellspacing="0" style="width:100%;">
              <tbody>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Plan</td>
                  <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${ctx.plan}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount</td>
                  <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${amountFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td>
                  <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Reference</td>
                  <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;font-family:monospace;">${ctx.paymentRef}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${ctx.frontendUrl}/dashboard/billing" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">View Billing History</a>
          </div>
          ${footer(ctx.frontendUrl)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Payment Receipt — SiteBank ${ctx.plan} plan\n\nHi ${ctx.name},\n\nThank you for your payment. Your subscription has been activated.\n\nPlan: ${ctx.plan}\nAmount: ${amountFormatted}\nDate: ${dateStr}\nReference: ${ctx.paymentRef}\n\nView billing history: ${ctx.frontendUrl}/dashboard/billing\n\n---\nSiteBank — Property listing platform · ${ctx.frontendUrl}\nThis is a transactional email regarding your account.`;

  return { subject, html, text };
}
