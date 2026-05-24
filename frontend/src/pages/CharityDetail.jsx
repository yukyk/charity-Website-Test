import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin, Globe, Heart, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getCharity } from '../api/charities';
import { getCharityDonations, getImpactReports } from '../api/charity';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { formatCurrency, formatRelativeTime, getInitials } from '../utils/formatters';

const page = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

const CATEGORY_VARIANT = {
  education:   'info',
  health:      'success',
  environment: 'success',
  poverty:     'warning',
  disaster:    'error',
  animals:     'info',
  other:       'neutral',
};

const PROJECT_STATUS_VARIANT = {
  active:    'success',
  completed: 'info',
  paused:    'warning',
};

const IMPACT_TEXT = {
  education:   'school supplies for 2 children',
  health:      'medical checkups for 3 people',
  environment: '10 trees planted',
  poverty:     'meals for a family for a week',
  animals:     'care for 5 shelter animals',
  disaster:    'emergency kits for 2 families',
  other:       'meaningful support to this cause',
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skel({ h = 20, w = '100%', br = 8, mb = 0 }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, width: w, borderRadius: br, marginBottom: mb, flexShrink: 0 }}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="container" style={{ padding: '32px 20px 80px' }}>
      <Skel h={300} br={24} mb={24} />
      <div className="charity-detail-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skel h={42} w="55%" />
          <Skel h={18} w="38%" />
          <Skel h={110} />
          <Skel h={26} w="28%" />
          <Skel h={80} />
          <Skel h={80} />
        </div>
        <div>
          <Skel h={500} br={16} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CharityDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [selectedAmount,   setSelectedAmount]   = useState(500);
  const [customAmount,     setCustomAmount]     = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [message,          setMessage]          = useState('');
  const [isAnonymous,      setIsAnonymous]      = useState(false);
  const [expandedReports,  setExpandedReports]  = useState(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: charityRes, isLoading, error: charityError } = useQuery({
    queryKey: ['charity', id],
    queryFn:  () => getCharity(id),
    retry: 1,
  });

  const { data: impactRes } = useQuery({
    queryKey: ['impact-reports', id],
    queryFn:  () => getImpactReports(id),
    retry: false,
    enabled: !!id,
  });

  // Only fetch donations when authenticated — the endpoint requires auth,
  // and the API client redirects to /login on 401.
  const { data: donationsRes } = useQuery({
    queryKey: ['charity-donations', id],
    queryFn:  () => getCharityDonations(id, { limit: 10 }),
    enabled:  isAuthenticated && !!id,
    retry: false,
  });

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) return <PageSkeleton />;

  if (charityError || !charityRes) {
    return (
      <motion.div {...page}>
        <div className="container py-24 text-center">
          <h2 style={{ marginBottom: 12 }}>Charity not found</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            This charity doesn't exist or may have been removed.
          </p>
          <Button variant="primary" onClick={() => navigate('/charities')}>
            Browse Charities
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const charity       = charityRes?.data || charityRes;
  const projects      = charity.projects      || [];
  const impactReports = impactRes?.data       || charity.impactReports || [];
  const donations     = donationsRes?.data    || [];
  const donorTotal    = donationsRes?.pagination?.total ?? donations.length;

  const raised = parseFloat(charity.raisedAmount || 0);
  const goal   = parseFloat(charity.goalAmount   || 0);

  const effectiveAmount = customAmount
    ? (parseFloat(customAmount) || 0)
    : (selectedAmount || 0);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleDonate() {
    if (effectiveAmount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?redirect=/charities/${id}`);
      return;
    }
    navigate(`/donate/${id}`, {
      state: {
        amount:      effectiveAmount,
        projectId:   selectedProjectId || null,
        message:     message.trim(),
        isAnonymous,
      },
    });
  }

  function toggleReport(reportId) {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      next.has(reportId) ? next.delete(reportId) : next.add(reportId);
      return next;
    });
  }

  const charityInitials = getInitials(charity.name);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div {...page}>

      {/* Pending/rejected banner */}
      {charity.status !== 'approved' && (
        <div style={{
          background: 'rgba(244,165,53,0.10)',
          borderBottom: '1px solid rgba(244,165,53,0.25)',
          padding: '12px 20px',
          textAlign: 'center',
        }}>
          <span style={{ color: '#B45309', fontWeight: 600, fontSize: 14 }}>
            ⚠️ This charity is currently pending review and not yet approved for donations.
          </span>
        </div>
      )}

      <div className="container" style={{ padding: '32px 20px 80px' }}>
        <div className="charity-detail-layout">

          {/* ══════════════════════════════════════════════════════════════
              LEFT — Main content
          ══════════════════════════════════════════════════════════════ */}
          <div>

            {/* Section 1 — Hero Banner */}
            <div style={{
              height: 300,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 24,
            }}>
              {charity.logoUrl ? (
                <img
                  src={charity.logoUrl}
                  alt={charity.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontSize: 100,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.22)',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {charityInitials}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 style={{ marginBottom: 12 }}>{charity.name}</h1>

            {/* Badges row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {charity.category && (
                <Badge variant={CATEGORY_VARIANT[charity.category] || 'neutral'}>
                  {charity.category}
                </Badge>
              )}
              {charity.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <MapPin size={13} />
                  {charity.location}
                </span>
              )}
              {charity.status === 'approved' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: 14, fontWeight: 600 }}>
                  <CheckCircle size={13} />
                  Verified
                </span>
              )}
            </div>

            {/* Website link */}
            {charity.websiteUrl && (
              <a
                href={charity.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--color-primary)',
                  fontSize: 14,
                  marginBottom: 36,
                }}
              >
                <Globe size={14} />
                {charity.websiteUrl}
                <ExternalLink size={12} />
              </a>
            )}

            {/* Section 2 — Fundraising Progress */}
            {goal > 0 && (
              <div className="card" style={{ padding: '22px 28px', marginBottom: 40 }}>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
                    {formatCurrency(raised)}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 10, fontSize: 16 }}>
                    of {formatCurrency(goal)} goal
                  </span>
                </div>
                <ProgressBar value={raised} max={goal} showPercentage />
                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-muted)' }}>
                  {donorTotal > 0
                    ? `❤️ ${donorTotal} donor${donorTotal !== 1 ? 's' : ''} have contributed`
                    : 'Be the first to contribute!'}
                </p>
              </div>
            )}

            {/* Section 3 — About */}
            {(charity.description || charity.mission) && (
              <div style={{ marginBottom: 40 }}>
                {charity.description && (
                  <>
                    <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>About Us</h2>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: charity.mission ? 32 : 0 }}>
                      {charity.description}
                    </p>
                  </>
                )}
                {charity.mission && (
                  <>
                    <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>Our Mission</h2>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                      {charity.mission}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Section 4 — Projects */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 18 }}>Our Projects</h2>
              {projects.length === 0 ? (
                <div style={{
                  padding: 32,
                  background: 'rgba(13,110,110,0.04)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}>
                  No projects added yet.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: 16,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--color-border) transparent',
                }}>
                  {projects.map((project, i) => {
                    const pRaised  = parseFloat(project.raisedAmount || 0);
                    const pGoal    = parseFloat(project.targetAmount  || 0);
                    const isSel    = selectedProjectId === project.id;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedProjectId(isSel ? '' : project.id)}
                        style={{
                          minWidth: 200,
                          flexShrink: 0,
                          background: isSel ? 'rgba(13,110,110,0.06)' : '#fff',
                          border: `2px solid ${isSel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '14px 16px',
                          cursor: 'pointer',
                          transition: 'border-color 0.18s, background 0.18s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <Badge variant={PROJECT_STATUS_VARIANT[project.status] || 'neutral'}>
                            {project.status}
                          </Badge>
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.45, marginBottom: 10 }}>
                          {project.title}
                        </p>
                        {pGoal > 0 && (
                          <>
                            <ProgressBar value={pRaised} max={pGoal} showPercentage={false} />
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                              {formatCurrency(pRaised)} of {formatCurrency(pGoal)}
                            </p>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 5 — Impact Reports */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 18 }}>Impact Reports</h2>
              {impactReports.length === 0 ? (
                <div style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'rgba(13,110,110,0.04)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    background: 'rgba(13,110,110,0.10)',
                    borderRadius: 'var(--radius-md)',
                    margin: '0 auto 16px',
                  }} />
                  <p style={{ color: 'var(--color-text-muted)' }}>
                    No impact reports yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  {/* Vertical timeline line */}
                  <div style={{
                    position: 'absolute',
                    left: 9,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    background: 'var(--color-primary)',
                    opacity: 0.18,
                    borderRadius: 2,
                  }} />

                  {impactReports.map((report) => {
                    const isExpanded = expandedReports.has(report.id);
                    const isLong     = (report.content || '').length > 240;
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: 24, position: 'relative' }}
                      >
                        {/* Timeline dot */}
                        <div style={{
                          position: 'absolute',
                          left: -28,
                          top: 18,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          border: '3px solid #fff',
                          boxShadow: '0 0 0 2px var(--color-primary)',
                        }} />

                        <div style={{
                          background: '#fff',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                          {report.createdAt && (
                            <span style={{
                              display: 'inline-block',
                              marginBottom: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              background: 'rgba(13,110,110,0.08)',
                              padding: '2px 10px',
                              borderRadius: 999,
                            }}>
                              {new Date(report.createdAt).toLocaleString('en-IN', {
                                month: 'short', year: 'numeric',
                              })}
                            </span>
                          )}
                          <h4 style={{ marginBottom: 8, fontSize: 15 }}>{report.title}</h4>
                          <p style={{
                            fontSize: 14,
                            color: 'var(--color-text-muted)',
                            lineHeight: 1.7,
                            display: (isLong && !isExpanded) ? '-webkit-box' : 'block',
                            WebkitLineClamp: (isLong && !isExpanded) ? 3 : undefined,
                            WebkitBoxOrient: (isLong && !isExpanded) ? 'vertical' : undefined,
                            overflow: (isLong && !isExpanded) ? 'hidden' : 'visible',
                          }}>
                            {report.content}
                          </p>
                          {isLong && (
                            <button
                              onClick={() => toggleReport(report.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: 0,
                                fontFamily: 'inherit',
                              }}
                            >
                              {isExpanded
                                ? <><ChevronUp size={14} /> Show less</>
                                : <><ChevronDown size={14} /> Read more</>
                              }
                            </button>
                          )}
                          {report.imageUrl && (
                            <img
                              src={report.imageUrl}
                              alt={report.title}
                              style={{
                                width: '100%',
                                borderRadius: 'var(--radius-sm)',
                                marginTop: 12,
                                objectFit: 'cover',
                                maxHeight: 220,
                              }}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 6 — Recent Donations */}
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 18 }}>Recent Supporters</h2>
              {donations.length === 0 ? (
                <div style={{
                  padding: 32,
                  background: 'rgba(13,110,110,0.04)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}>
                  Be the first to donate! ❤️
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {donations.slice(0, 10).map((donation) => (
                    <div
                      key={donation.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 16px',
                        background: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Heart size={15} fill="currentColor" style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14 }}>
                        <strong>
                          {donation.isAnonymous ? 'Someone' : (donation.user?.name || 'A donor')}
                        </strong>{' '}donated{' '}
                        <strong style={{ color: 'var(--color-primary)' }}>
                          {formatCurrency(donation.amount)}
                        </strong>
                      </span>
                      {donation.createdAt && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          {formatRelativeTime(donation.createdAt)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          {/* end left column */}

          {/* ══════════════════════════════════════════════════════════════
              RIGHT — Donation Widget
          ══════════════════════════════════════════════════════════════ */}
          <div>
            <div
              className="card"
              style={{ padding: 28, borderTop: '4px solid var(--color-primary)', position: 'sticky', top: 88 }}
            >
              <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>
                Support {charity.name}
              </h3>

              {/* Quick amount grid (2 rows × 3) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {PRESET_AMOUNTS.map((amt) => {
                  const isActive = !customAmount && selectedAmount === amt;
                  return (
                    <motion.button
                      key={amt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      style={{
                        padding: '9px 4px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isActive ? 'var(--color-primary)' : '#fff',
                        color: isActive ? '#fff' : 'var(--color-text)',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        lineHeight: 1,
                      }}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Or enter amount (₹)
                </p>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1500"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setSelectedAmount(null);
                  }}
                  className="input-field"
                />
              </div>

              {/* Project selector */}
              {projects.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    Donate towards
                  </p>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">General Donation</option>
                    {projects
                      .filter((p) => p.status === 'active')
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Message */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Message (optional)
                </p>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Leave a message of support... (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field"
                    style={{ resize: 'none', paddingBottom: 24, fontSize: 14 }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}>
                    {message.length}/200
                  </span>
                </div>
              </div>

              {/* Anonymous toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Donate Anonymously</span>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  aria-pressed={isAnonymous}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    background: isAnonymous ? 'var(--color-primary)' : 'var(--color-border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: isAnonymous ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {/* Donate button */}
              <Button variant="accent" size="lg" fullWidth onClick={handleDonate}>
                Donate {effectiveAmount > 0 ? `₹${effectiveAmount.toLocaleString('en-IN')}` : ''} →
              </Button>

              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 10 }}>
                🔒 Secured by Razorpay • Receipts provided
              </p>

              {/* Impact preview */}
              {effectiveAmount > 0 && (
                <motion.div
                  key={effectiveAmount}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    background: 'rgba(13,110,110,0.07)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    color: 'var(--color-primary)',
                    lineHeight: 1.6,
                  }}
                >
                  Your{' '}
                  <strong>₹{effectiveAmount.toLocaleString('en-IN')}</strong>{' '}
                  could provide{' '}
                  {IMPACT_TEXT[charity.category] || IMPACT_TEXT.other}
                </motion.div>
              )}
            </div>
          </div>
          {/* end right sidebar */}

        </div>
      </div>

      {/* Mobile FAB */}
      <div className="donation-fab">
        <Button variant="accent" size="md" onClick={handleDonate}>
          ❤️ Donate {effectiveAmount > 0 ? `₹${effectiveAmount.toLocaleString('en-IN')}` : ''} →
        </Button>
      </div>

    </motion.div>
  );
}
