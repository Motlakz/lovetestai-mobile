export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { subheading: string; paragraphs?: string[]; bullets?: string[] }[];
}

export interface LegalDoc {
  title: string;
  url: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
}

const LAST_UPDATED = '2026-05-18';

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  url: 'https://lovetestai.com/privacy-policy',
  lastUpdated: LAST_UPDATED,
  intro:
    'This policy describes what the Love Test AI mobile app collects and how it is used. For the web version of this policy, tap the link at the bottom of this sheet.',
  sections: [
    {
      heading: '1. What we collect',
      paragraphs: ['For app functionality, the only personal identifiers we collect are:'],
      bullets: [
        'A display name (username) you choose during onboarding, used to show your name in the app and to identify you to a paired partner.',
        'A device identifier generated on first launch, used to associate your device with features like partner invites.',
        'Inputs you submit to AI tools and calculators (names, birthdates, zodiac signs, quiz responses, relationship context, poem prompts) so we can generate the result you requested.',
      ],
    },
    {
      heading: '2. Account types',
      bullets: [
        'Guest (anonymous) accounts: created automatically on first launch using Firebase Anonymous Authentication. No email or identity is collected.',
        'Google sign-in: your Google account info (such as email and display name) is processed by Google and Firebase Authentication per their policies and used solely to authenticate you.',
      ],
    },
    {
      heading: '3. Guest account caveat',
      paragraphs: [
        'Guest accounts are temporary. Signing out of a guest account permanently ends that session — you will lose access to data tied to it (including any active partner pair). For persistence across devices or sign-outs, sign in with Google.',
      ],
    },
    {
      heading: '4. Local-only data',
      paragraphs: [
        'The following lives only on your device and is never uploaded: your profile fields, saved creations (letters, poems, notes, quotes), saved test results, journal entries, daily prompts, streak, and in-app inbox.',
      ],
    },
    {
      heading: '5. Partner pair feature & encryption',
      paragraphs: [
        'If you pair with another user, content you choose to share (daily prompts, reflections, shared test results, shared creations) is uploaded to Firestore in end-to-end encrypted form. The encryption key is derived on-device from a shared secret. We do not hold this key and cannot read your shared content. Account identifiers (UID, display name, device ID) are stored alongside encrypted content so the app can route messages to the right pair.',
      ],
    },
    {
      heading: '6. How we use data',
      bullets: [
        'To generate the AI outputs you request.',
        'To route partner messages between paired devices.',
        'To measure and improve feature usage and product quality.',
        'To review feedback you submit and support quality improvements.',
      ],
    },
    {
      heading: '7. Sharing',
      paragraphs: ['Data is shared with service providers used to run the app:'],
      bullets: [
        'Google Gemini and OpenAI (AI inference for your generation requests)',
        'Google Firebase (Authentication, Firestore for encrypted partner data, and Analytics)',
        'Google AdMob (advertising — see below)',
      ],
    },
    {
      heading: '8. Advertising',
      paragraphs: [
        'The mobile app displays advertisements via Google AdMob to support free access. AdMob and its partners may process device identifiers and technical data per Google\'s policies. We do not share your in-app content (profile, creations, partner messages) with ad networks.',
      ],
    },
    {
      heading: '9. Feedback',
      paragraphs: [
        'If you submit feedback from the app, your rating, optional comments, and optional email are stored in Firestore for product improvement.',
      ],
    },
    {
      heading: '10. Retention',
      paragraphs: [
        'Feedback records and analytics data are retained for operational and product improvement purposes. We may delete or anonymize records when no longer needed. Local-only data is retained on your device until you delete it or uninstall the app.',
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDoc = {
  title: 'Terms of Service',
  url: 'https://lovetestai.com/terms-of-service',
  lastUpdated: LAST_UPDATED,
  sections: [
    {
      heading: '1. Acceptance',
      paragraphs: [
        'By using the Love Test AI mobile app, you agree to these Terms. If you do not agree, do not use the app.',
      ],
    },
    {
      heading: '2. Service Scope',
      paragraphs: [
        'Love Test AI provides entertainment-oriented compatibility tools and AI-generated outputs. Results are informational and are not professional counseling, legal, medical, or financial advice.',
      ],
    },
    {
      heading: '3. Accounts',
      paragraphs: [
        'You may use the app as a guest (anonymous account) or by signing in with Google. Guest accounts are temporary: if you sign out, your guest session ends and you lose access to data tied to it, including any active partner pair. To preserve access across sign-outs and devices, use Google sign-in.',
      ],
    },
    {
      heading: '4. Partner pairing & encrypted content',
      paragraphs: [
        'The app includes a partner pair feature that lets two users link via an invite code and exchange daily prompts, reflections, test results, and creations. Content you share with your partner is end-to-end encrypted on your device before being uploaded. We cannot read or recover this content. If you lose your invite/partner code or sign out of a guest account, you may permanently lose access to your shared history.',
      ],
    },
    {
      heading: '5. Local data and your responsibility',
      paragraphs: [
        'Profile information, saved creations, journal entries, daily prompts, streaks, and your in-app inbox are stored only on your device. Uninstalling, clearing app data, or losing the device will permanently delete this content. You are responsible for any backups you wish to keep.',
      ],
    },
    {
      heading: '6. User responsibilities',
      bullets: [
        'Provide lawful input and use the app in good faith.',
        'Do not attempt abuse, scraping, denial-of-service, or unauthorized access.',
        'Do not use outputs for harassment, discrimination, or unlawful conduct.',
        'Do not use the partner pair feature, AI generation tools, or any other part of the app to harass, threaten, impersonate, or send unlawful content to another person.',
      ],
    },
    {
      heading: '7. Advertising',
      paragraphs: [
        'The app is free and supported by advertising. We display ads inside the app to fund continued development. By using the app, you agree that ads may appear during your sessions.',
      ],
    },
    {
      heading: '8. AI output disclaimer',
      paragraphs: [
        'AI outputs — test results, generated letters, poems, and other generated content — may be inaccurate, incomplete, or subjective, and are entertainment-oriented rather than professional advice. You are responsible for how you interpret and use any result.',
      ],
    },
    {
      heading: '9. Availability and changes',
      paragraphs: [
        'We may update, suspend, or discontinue features at any time. We may also update these Terms and publish the revised version on the website.',
      ],
    },
    {
      heading: '10. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, Love Test AI is provided "as is" without warranties, and we are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the app.',
      ],
    },
  ],
};
