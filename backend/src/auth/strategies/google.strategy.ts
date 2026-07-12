import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger('GoogleStrategy');

  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      config.get<string>('GOOGLE_CALLBACK_URL') ??
      `${config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'}/api/v1/auth/google/callback`;

    if (!clientID || !clientSecret) {
      // Passport requires non-empty values; provide placeholders so the strategy
      // registers cleanly. Routes will return 401 since calls won't authenticate.
      GoogleStrategy.logger.warn(
        'GOOGLE_CLIENT_ID/SECRET not set — Google OAuth disabled (login still works for email/password).',
      );
    }

    super({
      clientID: clientID || 'disabled',
      clientSecret: clientSecret || 'disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const emails = profile.emails;
    const photos = profile.photos;
    const user = {
      id: profile.id,
      email: emails?.[0]?.value ?? '',
      name: profile.displayName,
      photo: photos?.[0]?.value,
    };
    done(null, user);
  }
}
