import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Heart, TrendingUp, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { getCharities } from '../api/charities';
import CharityCard from '../components/shared/CharityCard';
import Button from '../components/ui/Button';
import useCountUp from '../hooks/useCountUp';
import { formatNumber } from '../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CATEGORIES = [
  { label: 'Education', emoji: '📚', value: 'education' },
  { label: 'Health', emoji: '🏥', value: 'health' },
  { label: 'Environment', emoji: '🌱', value: 'environment' },
  { label: 'Poverty', emoji: '🤝', value: 'poverty' },
  { label: 'Disaster Relief', emoji: '🆘', value: 'disaster' },
  { label: 'Animals', emoji: '🐾', value: 'animals' },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: 'Browse Charities',
    desc: 'Explore verified charities across education, health, environment, and more — all in one place.',
  },
  {
    icon: Heart,
    title: 'Choose & Donate',
    desc: 'Select an amount, add a personal message, and donate securely via Razorpay in under a minute.',
  },
  {
    icon: TrendingUp,
    title: 'See Your Impact',
    desc: 'Receive a receipt, real updates, and impact reports directly from the charity you supported.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Regular Donor',
    text: 'GiveHope made it so easy to find a cause I truly believe in. The impact reports keep me motivated to give every month.',
    initials: 'PS',
  },
  {
    name: 'Arjun Mehta',
    role: 'Donor since 2023',
    text: 'I love how transparent everything is. I can see exactly where my money goes and the real difference it makes in people\'s lives.',
    initials: 'AM',
  },
  {
    name: 'Nisha Patel',
    role: 'Corporate Donor',
    text: 'Our team uses GiveHope for CSR donations. The platform is professional, secure, and the support team is excellent.',
    initials: 'NP',
  },
];

function StatCounter({ target, prefix = '', suffix = '', label, delay = 0 }) {
  const [count, ref] = useCountUp(target, { duration: 2200, delay });
  return (
    <div ref={ref}>
      <div className="stat-number">{prefix}{formatNumber(count)}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ImpactCounter({ target, prefix = '', suffix = '', label, delay = 0 }) {
  const [count, ref] = useCountUp(target, { duration: 2400, delay });
  return (
    <div ref={ref}>
      <div className="impact-number">{prefix}{formatNumber(count)}{suffix}</div>
      <div className="impact-label">{label}</div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 176 }} />
      <div style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 20, width: '65%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 13, width: '100%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 7, width: '100%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '55%' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['charities', 'featured'],
    queryFn: () => getCharities({ limit: 3, page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const featured = data?.data?.slice(0, 3) || [];

  return (
    <motion.div {...pageVariants}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>

        <div className="container hero-inner">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', borderRadius: 999,
              padding: '6px 16px', marginBottom: 24,
            }}>
              <Heart size={14} color="var(--color-accent)" fill="var(--color-accent)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                Trusted by 12,000+ donors across India
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800, color: '#fff',
              lineHeight: 1.15, marginBottom: 20,
            }}>
              Your Kindness Can<br />
              <span style={{ color: 'var(--color-accent)' }}>Change a Life</span> Today
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.80)', lineHeight: 1.65, maxWidth: 520 }}>
              Browse 150+ verified charities. Donate securely. Receive real impact reports.
              Every rupee goes directly to the cause you care about.
            </p>

            <div className="hero-ctas">
              <Button variant="accent" size="lg" onClick={() => navigate('/charities')}>
                Browse Charities
                <ArrowRight size={18} style={{ marginLeft: 6 }} />
              </Button>
              <button
                onClick={() => navigate('/about')}
                style={{
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.30)', borderRadius: 'var(--radius-md)',
                  padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              >
                Learn How It Works
              </button>
            </div>

            <div className="hero-stats">
              <StatCounter target={150} suffix="+" label="Verified Charities" delay={200} />
              <StatCounter target={12000} suffix="+" label="Generous Donors" delay={400} />
              <StatCounter target={4800000} prefix="₹" label="Total Raised" delay={600} />
            </div>
          </motion.div>

          {/* Floating mini-cards (desktop only) */}
          <div className="hero-cards">
            {[
              { title: 'Clean Water Initiative', raised: 285000, goal: 500000, category: 'Environment' },
              { title: 'Girls Education Fund', raised: 142000, goal: 200000, category: 'Education' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                style={{
                  background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)',
                  borderRadius: 16, padding: '20px 24px',
                  border: '1px solid rgba(255,255,255,0.20)',
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  {item.category}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                  {item.title}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((item.raised / item.goal) * 100)}%`,
                    background: 'var(--color-accent)', borderRadius: 999,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                    ₹{(item.raised / 100000).toFixed(1)}L raised
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {Math.round((item.raised / item.goal) * 100)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: '#fff' }}>
        <div className="container">
          <div className="section-heading">
            <h2>How GiveHope Works</h2>
            <p>Transparent, secure, and simple — your donation reaches the right people.</p>
          </div>
          <div className="hiw-grid">
            {HOW_IT_WORKS.flatMap((step, i) => {
              const elements = [
                <motion.div
                  key={step.title}
                  className="hiw-step"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <div className="hiw-icon">
                    <step.icon size={32} />
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', color: '#fff',
                    fontSize: 13, fontWeight: 700, marginBottom: 14,
                  }}>
                    {i + 1}
                  </div>
                  <h3 style={{ fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.65 }}>{step.desc}</p>
                </motion.div>,
              ];
              if (i < HOW_IT_WORKS.length - 1) {
                elements.push(
                  <div key={`conn-${i}`} className="hiw-connector">
                    <ChevronRight size={28} />
                  </div>,
                );
              }
              return elements;
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED CHARITIES ───────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-heading">
            <h2>Featured Charities</h2>
            <p>Verified organizations making real change right now.</p>
          </div>

          <motion.div
            className="grid-3"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {isLoading
              ? [1, 2, 3].map((n) => <CardSkeleton key={n} />)
              : featured.map((charity) => (
                  <motion.div key={charity.id} variants={cardVariants}>
                    <CharityCard charity={charity} showActions />
                  </motion.div>
                ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Button variant="secondary" size="lg" onClick={() => navigate('/charities')}>
              View All Charities
              <ArrowRight size={16} style={{ marginLeft: 6 }} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ──────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-primary-dark)' }}>
        <div className="container">
          <div className="section-heading" style={{ marginBottom: 56 }}>
            <h2 style={{ color: '#fff' }}>Our Collective Impact</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)' }}>Numbers that prove every donation matters.</p>
          </div>
          <div className="impact-grid">
            <ImpactCounter target={150} suffix="+" label="Verified Charities" delay={0} />
            <ImpactCounter target={12000} suffix="+" label="Active Donors" delay={200} />
            <ImpactCounter target={48} prefix="₹" suffix="L+" label="Funds Raised" delay={400} />
            <ImpactCounter target={89000} suffix="+" label="Lives Impacted" delay={600} />
          </div>
        </div>
      </section>

      {/* ── CATEGORY STRIP ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="section-heading" style={{ marginBottom: 32 }}>
            <h2>Donate to What You Care About</h2>
            <p>Pick a cause that speaks to your heart.</p>
          </div>
          <div className="cat-strip">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className="cat-pill"
                onClick={() => navigate(`/charities?category=${cat.value}`)}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="section-heading">
            <h2>What Our Donors Say</h2>
            <p>Real stories from real people making a difference.</p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} fill="var(--color-accent)" color="var(--color-accent)" />
                  ))}
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20, fontSize: 15 }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER / CTA ────────────────────────────────────────── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--color-accent) 0%, #e8920f 100%)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 style={{ color: '#1A1A2E', marginBottom: 16, fontSize: 'clamp(24px, 3vw, 36px)' }}>
              Ready to Make a Difference?
            </h2>
            <p style={{
              color: 'rgba(26,26,46,0.72)', fontSize: 18,
              maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.65,
            }}>
              Join thousands of donors who are changing lives through GiveHope.
              It only takes a minute.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Start Donating Today
              </Button>
              <button
                onClick={() => navigate('/charities')}
                style={{
                  background: 'rgba(255,255,255,0.30)', color: '#1A1A2E',
                  border: '1.5px solid rgba(255,255,255,0.50)', borderRadius: 'var(--radius-md)',
                  padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Browse Charities
              </button>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
