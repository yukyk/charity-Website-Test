import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const page = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

function TelescopeIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Stars */}
      <circle cx="30"  cy="25"  r="2.5" fill="#F4A535" opacity="0.7" />
      <circle cx="195" cy="18"  r="2"   fill="#F4A535" opacity="0.5" />
      <circle cx="60"  cy="55"  r="1.5" fill="#0D6E6E" opacity="0.5" />
      <circle cx="180" cy="60"  r="2.5" fill="#F4A535" opacity="0.6" />
      <circle cx="15"  cy="80"  r="1.5" fill="#0D6E6E" opacity="0.4" />
      <circle cx="200" cy="100" r="2"   fill="#F4A535" opacity="0.5" />
      {/* Shadow */}
      <ellipse cx="110" cy="193" rx="55" ry="7" fill="rgba(13,110,110,0.10)" />
      {/* Tripod legs */}
      <line x1="100" y1="152" x2="68"  y2="188" stroke="#0D6E6E" strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="152" x2="110" y2="188" stroke="#0D6E6E" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="152" x2="152" y2="188" stroke="#0D6E6E" strokeWidth="4" strokeLinecap="round" />
      {/* Telescope body */}
      <rect x="56" y="100" width="108" height="32" rx="16" fill="#0D6E6E" transform="rotate(-22 110 116)" />
      <rect x="72" y="105" width="76"  height="22" rx="11" fill="#128080" transform="rotate(-22 110 116)" />
      {/* Eyepiece */}
      <circle cx="154" cy="88" r="14" fill="#094F4F" />
      <circle cx="154" cy="88" r="9"  fill="#0D6E6E" />
      <circle cx="157" cy="85" r="3"  fill="rgba(255,255,255,0.25)" />
      {/* Lens cap / big end */}
      <circle cx="68"  cy="133" r="18" fill="#F4A535" />
      <circle cx="68"  cy="133" r="12" fill="#FFB84D" />
      <circle cx="63"  cy="128" r="4"  fill="rgba(255,255,255,0.3)" />
      {/* Mounting knob */}
      <circle cx="108" cy="148" r="8" fill="#094F4F" />
      <circle cx="108" cy="148" r="5" fill="#0D6E6E" />
      {/* Person silhouette */}
      <circle cx="170" cy="110" r="14" fill="#F4A535" opacity="0.9" />
      <path d="M158 132 Q170 124 182 132 L185 165 H155 Z" fill="#0D6E6E" opacity="0.9" rx="4" />
      {/* Person eye to eyepiece line (looking) */}
      <line x1="162" y1="110" x2="154" y2="95" stroke="rgba(244,165,53,0.4)" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <motion.div {...page}>
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Giant background 404 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -52%)',
          fontSize: 'clamp(140px, 28vw, 280px)',
          fontWeight: 900, lineHeight: 1,
          color: 'rgba(13,110,110,0.05)',
          userSelect: 'none', pointerEvents: 'none',
          letterSpacing: '-0.04em',
          zIndex: 0,
        }}>
          404
        </div>

        {/* Foreground content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TelescopeIllustration />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <h1 style={{
              fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800,
              marginBottom: 12, color: 'var(--color-text)',
            }}>
              Oops! This page took a detour
            </h1>
            <p style={{
              color: 'var(--color-text-muted)', fontSize: 16,
              maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.7,
            }}>
              We looked everywhere but couldn't find what you're searching for.
              It may have moved, been renamed, or never existed.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/">
                <Button variant="primary" size="lg">Go Home</Button>
              </Link>
              <Link to="/charities">
                <Button variant="secondary" size="lg">Browse Charities</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
