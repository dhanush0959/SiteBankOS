export function agencyInviteTemplate(opts: {
  agencyName: string;
  ownerName: string;
  inviteUrl: string;
  frontendUrl: string;
}) {
  return {
    subject: `Invitation to join ${opts.agencyName} on SiteBank`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">SiteBank</h1>
          <p style="color: #666; font-size: 14px;">Real Estate Smart Sharing</p>
        </div>
        
        <h2 style="color: #333;">You've been invited!</h2>
        
        <p style="color: #444; line-height: 1.6;">
          <strong>${opts.ownerName}</strong> from <strong>${opts.agencyName}</strong> has invited you to join their team on SiteBank.
        </p>
        
        <p style="color: #444; line-height: 1.6;">
          As part of the agency, you'll be able to manage shared properties, track leads collectively, and use professional branding for all your smart links.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${opts.inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Accept Invitation & Get Started
          </a>
        </div>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px;">
          If you don't have an account yet, you'll be prompted to create one using this email address.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 11px; text-align: center;">
          &copy; 2026 SiteBank. All rights reserved.<br>
          <a href="${opts.frontendUrl}" style="color: #999;">${opts.frontendUrl}</a>
        </p>
      </div>
    `,
  };
}
