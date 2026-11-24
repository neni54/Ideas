// SIDEYE wordmark. Typographic: heavy condensed caps; over "EYE" a hairline with a burgundy
// point pushed to the right — a glance out of the corner of the eye, abstract, not an icon.
// Letters use currentColor, so it reads on dark and light backgrounds alike.

export const BRAND = {
  name: 'SIDEYE',
  tagline: 'You know the words. Now get the meaning.',
  message: 'Learn English through culture, sarcasm, real conversations and everything that gets lost in translation.',
};

export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`logo ${className}`} style={{ fontSize: size }} role="img" aria-label={BRAND.name}>
      <span aria-hidden>SID</span>
      <span className="logo-eye" aria-hidden>
        EYE
      </span>
    </span>
  );
}
