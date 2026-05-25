import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, TrendingUp, Globe, Award, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const VALUES = [
  {
    icon: Shield,
    title: 'Transparency First',
    desc: 'Every charity is verified. Every rupee is tracked. Donors always see exactly where their money goes.',
  },
  {
    icon: Heart,
    title: 'Human-Centred',
    desc: 'Behind every donation is a real person with a real story. We keep that humanity at the centre of everything we build.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'Our platform is shaped daily by the donors, charities, and volunteers who use and believe in it.',
  },
  {
    icon: TrendingUp,
    title: 'Long-Term Impact',
    desc: 'We don\'t chase one-time donations. We build lasting relationships between donors and causes they truly believe in.',
  },
];

const TRUST_POINTS = [
  'All charities are manually verified by our team before listing',
  'End-to-end encrypted payment processing via Razorpay',
  'Detailed impact reports from every charity we list',
  'Your data is never sold or shared with third parties',
  'SSL secured and PCI-DSS compliant payment flow',
  'Dedicated support team available Mon–Sat, 9am–6pm IST',
];

export default function About() {
  const navigate = useNavigate();

  return (
    <motion.div {...pageVariants}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        padding: '96px 0 80px', position: 'relative', overflow: 'hidden',
      }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="about-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#about-dots)" />
        </svg>

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', borderRadius: 999,
              padding: '6px 18px', marginBottom: 24,
            }}>
              <Heart size={14} color="var(--color-accent)" fill="var(--color-accent)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                Founded with purpose. Built with care.
              </span>
            </div>

            <h1 style={{
              color: '#fff', fontSize: 'clamp(30px, 4.5vw, 52px)',
              fontWeight: 800, marginBottom: 20, lineHeight: 1.15,
            }}>
              About <span style={{ color: 'var(--color-accent)' }}>GiveHope</span>
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.78)', fontSize: 18, lineHeight: 1.65,
              maxWidth: 600, margin: '0 auto 36px',
            }}>
              We're building the most trusted charity platform in India — connecting compassionate
              donors with verified organisations that make real, measurable change.
            </p>

            <Button variant="accent" size="lg" onClick={() => navigate('/charities')}>
              Browse Charities
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div className="container">
          <div className="about-mission-grid">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div style={{
                display: 'inline-block', background: 'rgba(13,110,110,0.08)',
                borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600,
                color: 'var(--color-primary)', textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 20,
              }}>
                Our Mission
              </div>
              <h2 style={{ marginBottom: 20, lineHeight: 1.25 }}>
                Making Giving Simple,<br />Transparent & Impactful
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 16, lineHeight: 1.75, marginBottom: 16 }}>
                GiveHope was born out of a simple frustration: it was too hard to know if your
                donation was actually making a difference. Too many platforms lacked transparency,
                accountability, or a human touch.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 16, lineHeight: 1.75 }}>
                We built GiveHope to fix that. Every charity on our platform is personally verified.
                Every donation is tracked. And every donor receives genuine impact updates — not just
                a "thank you" email.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div style={{
                background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
                padding: 40, border: '1px solid var(--color-border)',
              }}>
                {[
                  {
                    icon: Globe,
                    title: 'Pan-India Network',
                    desc: 'We partner with charities across 28 states, covering every major cause from rural education to urban healthcare.',
                  },
                  {
                    icon: Award,
                    title: 'Zero Platform Fee',
                    desc: 'We believe in maximising every rupee. We charge no platform fee — only standard payment gateway charges apply.',
                  },
                  {
                    icon: Shield,
                    title: 'Rigorous Vetting',
                    desc: 'Every charity undergoes a manual review of registration, financials, and on-ground operations before approval.',
                  },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div
                    key={title}
                    style={{
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                      marginBottom: i < 2 ? 28 : 0,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(13,110,110,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-primary)', flexShrink: 0,
                    }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 17, marginBottom: 6 }}>{title}</h4>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-heading">
            <h2>What We Stand For</h2>
            <p>Four principles guide every decision we make at GiveHope.</p>
          </div>
          <div className="grid-4">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(13,110,110,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)', marginBottom: 18,
                }}>
                  <v.icon size={26} />
                </div>
                <h4 style={{ fontSize: 17, marginBottom: 10 }}>{v.title}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-primary-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: '#fff', marginBottom: 16 }}>Why Donors Trust GiveHope</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              Security and transparency aren't features for us — they're the foundation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, maxWidth: 720, margin: '0 auto' }}>
            {TRUST_POINTS.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px',
                }}
              >
                <CheckCircle size={20} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15 }}>{point}</span>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Button variant="accent" size="lg" onClick={() => navigate('/contact')}>
              Get In Touch
            </Button>
          </div>
        </div>
      </section>

    </motion.div>
  );
}
