/**
 * RegistrationHeader.jsx
 *
 * Ported from registration-platform-demo:
 *   /components/shell/registration-header.tsx
 *
 * Changes from source:
 *   - Converted TSX → JSX (dropped type annotations)
 *   - colors.green → #378BDA (platform accent)
 *   - aria-label updated to "Step 4 of 8" (password step in registration)
 *   - Removed 'use client' directive (not Next.js)
 *   - Removed @/theme/tokens import — colour inlined
 *
 * SVGs are verbatim from the source file.
 */

const ACCENT = '#378BDA';

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4 6.5 10l6 6"
        stroke={ACCENT}
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressAvatar() {
  /* Arc: 87.5% (315° of 360°) — Step 7 of 8.
     Circle centred at (21,21), radius 19 (within 42×42 viewBox, strokeWidth 4 → fits well).
     Start: top (21, 2). End: 315° clockwise from top = (7.56, 7.56).
     large-arc-flag=1 (arc > 180°), sweep-flag=1 (clockwise in SVG coords). */
  return (
    <svg
      role="img"
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Step 7 of 8"
    >
      {/* Person silhouette */}
      <path
        d="M11 30.6012C12.4707 27.3225 16.1325 25 20.4169 25C24.8731 25 28.6556 27.5124 30 31"
        stroke="#4A4A4A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="21" cy="18" r="6" stroke="#4A4A4A" strokeWidth="3" />

      {/* Progress track (grey) */}
      <circle
        cx="21"
        cy="21"
        r="19"
        stroke="#DCDCDC"
        strokeWidth="4"
        fill="none"
      />

      {/* Progress arc (blue) — 87.5% (315° = Step 7 of 8) — Figma 2026-05-26 */}
      <path
        d="M21 2 A19 19 0 1 1 7.56 7.56"
        stroke="#378BDA"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function RegistrationHeader({ onBack }) {
  return (
    <header
      style={{
        background: '#fff',
        padding: '13px 31px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          margin: '-13px 0', /* keep header height stable, expand touch target */
          borderRadius: 8,
        }}
      >
        <BackArrow />
      </button>

      {/* Centred avatar — flex-1 pushes it to the visual centre */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressAvatar />
      </div>

      {/* Spacer matching back button width — keeps avatar optically centred */}
      <div style={{ width: 44, height: 44 }} aria-hidden="true" />
    </header>
  );
}
