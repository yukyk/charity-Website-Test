import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Heart, Bell, User, Lock,
  ChevronLeft, ChevronRight, FileText, CheckCheck,
  TrendingUp, Camera, Search, Eye, EyeOff, X,
  Wallet, Building2, CreditCard,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import {
  getMyDonations, getNotifications,
  markNotificationRead, markAllNotificationsRead,
  getProfile, updateProfile, changePassword as changePasswordAPI,
  getUnreadCount,
} from '../../api/user';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',      label: 'Overview',        Icon: LayoutDashboard },
  { id: 'donations',     label: 'My Donations',    Icon: Heart           },
  { id: 'notifications', label: 'Notifications',   Icon: Bell            },
  { id: 'profile',       label: 'Profile',         Icon: User            },
  { id: 'password',      label: 'Change Password', Icon: Lock            },
];

const STATUS_VARIANT = {
  completed: 'success',
  pending:   'warning',
  failed:    'error',
  refunded:  'neutral',
};

const NOTIF_CONFIG = {
  donation_confirmed: { Icon: Heart,      color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)'  },
  charity_approved:   { Icon: CheckCheck, color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)'  },
  charity_rejected:   { Icon: X,          color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.12)'  },
  impact_report:      { Icon: TrendingUp, color: 'var(--color-primary)', bg: 'rgba(13,110,110,0.10)' },
  reminder:           { Icon: Bell,       color: 'var(--color-accent)',  bg: 'rgba(244,165,53,0.12)' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STR_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STR_COLORS = ['', '#EF4444', '#F59E0B', '#22C55E', '#15803D'];

// ── Micro components ─────────────────────────────────────────────────────────

function Skel({ w = '100%', h = 16, r = 6, style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function PwStrengthBar({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: s <= score ? STR_COLORS[score] : 'var(--color-border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: STR_COLORS[score], fontWeight: 600 }}>
        {STR_LABELS[score]}
      </span>
    </div>
  );
}

function StatCard({ label, value, Icon, gradient }) {
  return (
    <div style={{ background: gradient, borderRadius: 'var(--radius-md)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Icon size={17} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1, position: 'relative' }}>{value}</div>
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────

function ReceiptModal({ donation, onClose }) {
  if (!donation) return null;
  const rows = [
    { label: 'Receipt #',  value: (donation.paymentId || donation.id || '').toString().slice(0, 16).toUpperCase() || '—' },
    { label: 'Charity',    value: donation.charity?.name || '—' },
    { label: 'Project',    value: donation.project?.title || 'General Fund' },
    { label: 'Donor',      value: donation.isAnonymous ? 'Anonymous' : (donation.user?.name || '—') },
    { label: 'Amount',     value: formatCurrency(donation.amount) },
    { label: 'Date',       value: formatDate(donation.createdAt) },
    { label: 'Payment ID', value: donation.paymentId || donation.paymentOrderId || '—' },
    { label: 'Status',     value: <Badge variant={STATUS_VARIANT[donation.status] || 'neutral'}>{donation.status}</Badge> },
  ];

  return (
    <Modal isOpen={!!donation} onClose={onClose} title="" maxWidth="460px">
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
            <path d="M16 26C16 26 6 19.6 6 12.5C6 9.4 8.4 7 11.5 7C13.2 7 14.8 7.9 16 9.3C17.2 7.9 18.8 7 20.5 7C23.6 7 26 9.4 26 12.5C26 19.6 16 26 16 26Z" fill="white" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-primary)' }}>GiveHope</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>Donation Receipt</p>

        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20, textAlign: 'left' }}>
          {rows.map(({ label, value }, i) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 16px',
              borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
              background: i % 2 === 0 ? '#fff' : 'rgba(13,110,110,0.02)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}
        >
          <FileText size={16} /> Download as PDF
        </button>
      </div>
    </Modal>
  );
}

// ── Overview Section ──────────────────────────────────────────────────────────

function OverviewSection({ allDonations, isLoading, onTabChange }) {
  const { user } = useAuthStore();

  const stats = useMemo(() => {
    const done = allDonations.filter(d => d.status === 'completed');
    const total = done.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    const charities = new Set(done.map(d => d.charityId)).size;
    return { total, charities, count: done.length };
  }, [allDonations]);

  const recent = allDonations.slice(0, 5);

  const supportedCharities = useMemo(() => {
    const seen = new Set();
    return allDonations
      .filter(d => {
        if (d.status !== 'completed' || seen.has(d.charityId)) return false;
        seen.add(d.charityId);
        return true;
      })
      .map(d => ({ id: d.charityId, name: d.charity?.name || 'Charity', logo: d.charity?.logoUrl }));
  }, [allDonations]);

  return (
    <div>
      <h2 style={{ marginBottom: 6, fontSize: 'clamp(20px, 2.5vw, 26px)' }}>
        {getGreeting()}, {user?.name?.split(' ')[0]} 👋
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 28, fontSize: 15 }}>
        Here's a summary of your giving journey.
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }} className="stats-grid">
        {isLoading ? (
          [0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-md)' }} />)
        ) : (
          <>
            <StatCard label="Total Donated"        value={formatCurrency(stats.total)} Icon={Wallet}    gradient="linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" />
            <StatCard label="Charities Supported"  value={stats.charities}             Icon={Building2} gradient="linear-gradient(135deg, #D97706, #92400E)" />
            <StatCard label="Donations Made"       value={stats.count}                 Icon={Heart}     gradient="linear-gradient(135deg, #16A34A, #14532D)" />
          </>
        )}
      </div>

      {/* Recent donations */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 16 }}>Recent Donations</h3>
          <button onClick={() => onTabChange('donations')} style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All →
          </button>
        </div>

        {isLoading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
              <Skel w="35%" h={13} /> <Skel w="20%" h={13} /> <Skel w="20%" h={13} /> <Skel w="15%" h={20} r={999} />
            </div>
          ))
        ) : recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-text-muted)' }}>
            <Heart size={34} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
            <p style={{ fontSize: 14 }}>No donations yet.{' '}
              <a href="/charities" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Browse charities →</a>
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr>
                  {['Charity', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 500 }}>{d.charity?.name || '—'}</td>
                    <td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatCurrency(d.amount)}</td>
                    <td style={{ padding: '12px 0', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.createdAt)}</td>
                    <td style={{ padding: '12px 0' }}><Badge variant={STATUS_VARIANT[d.status] || 'neutral'}>{d.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charities supported — horizontal scroll */}
      {supportedCharities.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 18 }}>Charities You've Supported</h3>
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {supportedCharities.map(c => (
              <a key={c.id} href={`/charities/${c.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 68, textDecoration: 'none' }}>
                <Avatar name={c.name} src={c.logo} size="lg" />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3, maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {c.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Impact quote */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: 'var(--radius-md)', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -32, right: -32, width: 120, height: 120, borderRadius: '50%', background: 'rgba(244,165,53,0.15)' }} />
        <Heart size={26} fill="var(--color-accent)" color="var(--color-accent)" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.55, marginBottom: 8, maxWidth: 500, position: 'relative' }}>
          {stats.charities > 0
            ? `Your donations have helped ${stats.charities} ${stats.charities === 1 ? 'charity' : 'charities'} make a real difference!`
            : 'Every rupee you give changes a life. Start your journey today!'}
        </p>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', position: 'relative' }}>
          {stats.count > 0 ? `${stats.count} donation${stats.count !== 1 ? 's' : ''} and counting 💝` : 'Browse verified charities below.'}
        </span>
      </div>
    </div>
  );
}

// ── Donations Section ─────────────────────────────────────────────────────────

function DonationsSection({ allDonations, isLoading }) {
  const [page, setPage]             = useState(1);
  const [filters, setFilters]       = useState({ search: '', status: '', from: '', to: '' });
  const [receiptDonation, setReceipt] = useState(null);

  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    return allDonations.filter(d => {
      if (filters.status && d.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!d.charity?.name?.toLowerCase().includes(q)) return false;
      }
      if (filters.from && new Date(d.createdAt) < new Date(filters.from)) return false;
      if (filters.to   && new Date(d.createdAt) > new Date(filters.to + 'T23:59:59')) return false;
      return true;
    });
  }, [allDonations, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = filters.search || filters.status || filters.from || filters.to;

  const clearFilters = () => { setFilters({ search: '', status: '', from: '', to: '' }); setPage(1); };
  const setFilter    = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--color-text)' };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px, 2.5vw, 26px)' }}>My Donations</h2>

      {/* Filter bar */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', gap: 12 }} className="filter-grid">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input placeholder="Search charity…" value={filters.search} onChange={e => setFilter('search', e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
          {/* Status */}
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          {/* Date range */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
            <input type="date" value={filters.to}   onChange={e => setFilter('to',   e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
          </div>
        </div>
        {hasFilters && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={clearFilters} style={{ fontSize: 13, color: 'var(--color-error)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              <X size={13} /> Clear filters
            </button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>— {filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--color-border)' : undefined }}>
                <Skel w="28%" h={13} /> <Skel w="18%" h={13} /> <Skel w="18%" h={13} /> <Skel w="14%" h={20} r={999} /> <Skel w="10%" h={30} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--color-text-muted)' }}>
            <Heart size={40} style={{ margin: '0 auto 14px', opacity: 0.18 }} />
            <h3 style={{ marginBottom: 8, color: 'var(--color-text)' }}>{hasFilters ? 'No matching donations' : 'No donations yet'}</h3>
            <p style={{ fontSize: 14 }}>{hasFilters ? 'Try adjusting your filters.' : 'Make your first donation to see it here.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="don-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead style={{ background: 'rgba(13,110,110,0.04)' }}>
                  <tr>
                    {['Charity', 'Project', 'Amount', 'Date', 'Payment ID', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 18px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(d => (
                    <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,110,110,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '13px 18px', fontWeight: 500, maxWidth: 150 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.charity?.name || '—'}</span>
                      </td>
                      <td style={{ padding: '13px 18px', color: 'var(--color-text-muted)', maxWidth: 120 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.project?.title || 'General'}</span>
                      </td>
                      <td style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatCurrency(d.amount)}</td>
                      <td style={{ padding: '13px 18px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.createdAt)}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <code style={{ fontSize: 11, background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>
                          {(d.paymentId || d.id || '').toString().slice(0, 14)}…
                        </code>
                      </td>
                      <td style={{ padding: '13px 18px' }}><Badge variant={STATUS_VARIANT[d.status] || 'neutral'}>{d.status}</Badge></td>
                      <td style={{ padding: '13px 18px' }}>
                        <button
                          onClick={() => setReceipt(d)}
                          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(13,110,110,0.08)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,110,110,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,110,110,0.08)'}
                        >
                          <Eye size={13} /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="don-cards" style={{ padding: 16 }}>
              {paginated.map(d => (
                <div key={d.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{d.charity?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{d.project?.title || 'General Fund'}</div>
                    </div>
                    <Badge variant={STATUS_VARIANT[d.status] || 'neutral'}>{d.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(d.amount)}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(d.createdAt)}</div>
                    </div>
                    <button onClick={() => setReceipt(d)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(13,110,110,0.08)', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={15} />
            </Button>
            <span style={{ fontSize: 13, fontWeight: 600, padding: '0 4px' }}>{safePage} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      <ReceiptModal donation={receiptDonation} onClose={() => setReceipt(null)} />

      <style>{`
        .don-table { display: block; }
        .don-cards  { display: none; }
        @media (max-width: 600px) {
          .don-table { display: none; }
          .don-cards  { display: block; }
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Notifications Section ─────────────────────────────────────────────────────

function NotificationsSection() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ page: 1, limit: 50 }),
  });

  const notifications = data?.data ?? [];
  const unread = notifications.filter(n => !n.isRead);

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('All notifications marked as read');
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Notifications</h2>
        {unread.length > 0 && (
          <Button variant="ghost" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck size={14} /> Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: 24 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: i < 4 ? '1px solid var(--color-border)' : undefined }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skel w="78%" h={13} style={{ marginBottom: 8 }} />
                <Skel w="28%" h={11} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ marginBottom: 8 }}>You're all caught up!</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>No new notifications right now.</p>
          </motion.div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          {notifications.map((n, i) => {
            const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.reminder;
            const NIcon = cfg.Icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne.mutate(n.id)}
                style={{
                  display: 'flex', gap: 14, padding: '18px 20px',
                  borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                  borderLeft: !n.isRead ? '3px solid var(--color-primary)' : '3px solid transparent',
                  background: !n.isRead ? 'rgba(13,110,110,0.02)' : '#fff',
                  cursor: !n.isRead ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = 'rgba(13,110,110,0.05)'; }}
                onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.background = 'rgba(13,110,110,0.02)'; }}
              >
                {!n.isRead && (
                  <div style={{ position: 'absolute', top: 20, right: 20, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                )}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                  <NIcon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 4, fontWeight: n.isRead ? 400 : 600, color: 'var(--color-text)' }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatRelativeTime(n.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Profile Section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const profile = profileData?.data || user;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '', address: user?.address || '' },
  });

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data;
      reset({ name: p.name || '', phone: p.phone || '', address: p.address || '' });
    }
  }, [profileData, reset]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: data => {
      updateUser(data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
    onError: err => toast.error(err.message),
  });

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setAvatarPreview(URL.createObjectURL(file));
    toast.success('Photo preview updated — upload feature coming soon!');
  };

  const taStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)', transition: 'border-color 0.2s, box-shadow 0.2s' };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Profile</h2>
      <div className="card" style={{ padding: 32, maxWidth: 540 }}>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
            <Avatar name={profile?.name} src={avatarPreview || profile?.avatarUrl} size="xl" />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }} className="av-overlay">
              <Camera size={22} color="#fff" style={{ opacity: 0, transition: 'opacity 0.2s' }} className="av-cam" />
            </div>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2, 3].map(i => <Skel key={i} h={46} />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
            <div className="form-group">
              <Input label="Full Name" placeholder="Your full name" error={errors.name?.message}
                {...register('name', { required: 'Name is required' })} />

              <Input label="Email Address" type="email" value={profile?.email || ''} disabled onChange={() => {}}
                style={{ background: '#f5f5f5', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />

              <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message}
                {...register('phone', {
                  pattern: { value: /^[+\d\s()-]{7,20}$/, message: 'Enter a valid phone number' },
                })} />

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>Address</label>
                <textarea placeholder="Your address (optional)" rows={3} style={taStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(13,110,110,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                  {...register('address')}
                />
              </div>

              <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting || mutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        .av-overlay:hover { background: rgba(0,0,0,0.38) !important; }
        .av-overlay:hover .av-cam { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ── Change Password Section ───────────────────────────────────────────────────

function ChangePasswordSection() {
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const newPw = watch('newPassword', '');

  async function onSubmit(data) {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await changePasswordAPI({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated successfully!');
      reset();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}>
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Change Password</h2>
      <div className="card" style={{ padding: 32, maxWidth: 460 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(13,110,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--color-primary)' }}>
          <Lock size={24} />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <Input label="Current Password" type={showCur ? 'text' : 'password'} placeholder="Your current password"
              error={errors.currentPassword?.message} rightElement={eyeBtn(showCur, () => setShowCur(v => !v))}
              {...register('currentPassword', { required: 'Current password is required' })} />

            <div>
              <Input label="New Password" type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters"
                error={errors.newPassword?.message} rightElement={eyeBtn(showNew, () => setShowNew(v => !v))}
                {...register('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'At least 8 characters required' } })} />
              <PwStrengthBar password={newPw} />
            </div>

            <Input label="Confirm New Password" type={showCon ? 'text' : 'password'} placeholder="Repeat new password"
              error={errors.confirmPassword?.message} rightElement={eyeBtn(showCon, () => setShowCon(v => !v))}
              {...register('confirmPassword', { required: 'Please confirm your password' })} />

            <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ activeTab, setActiveTab, user, unreadCount }) {
  return (
    <aside className="dashboard-sidebar" style={{
      width: 236, flexShrink: 0, background: '#fff',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto',
    }}>
      {/* User identity */}
      <div style={{ padding: '24px 18px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
          <Avatar name={user?.name} size="md" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
          </div>
        </div>
        <span className="badge badge-info" style={{ fontSize: 11 }}>Donor</span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              border: 'none', background: active ? 'rgba(13,110,110,0.08)' : 'transparent',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
              borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(13,110,110,0.04)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === 'notifications' && unreadCount > 0 && (
                <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer email */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </p>
      </div>
    </aside>
  );
}

// ── Mobile Tab Bar ────────────────────────────────────────────────────────────

function MobileTabBar({ activeTab, setActiveTab, unreadCount }) {
  return (
    <div className="dashboard-mobile-tabs" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: '1px solid var(--color-border)',
      display: 'none',
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 2px', border: 'none', background: 'transparent',
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontFamily: 'inherit', cursor: 'pointer', fontSize: 10, fontWeight: active ? 700 : 400,
          }}>
            <div style={{ position: 'relative' }}>
              <Icon size={20} />
              {id === 'notifications' && unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--color-primary)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 999, padding: '1px 4px', minWidth: 14, textAlign: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: donationsData, isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => getMyDonations({ page: 1, limit: 100 }),
    staleTime: 2 * 60 * 1000,
  });
  const allDonations = donationsData?.data ?? [];

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    retry: false,
  });
  const unreadCount = unreadData?.data?.count ?? 0;

  const CONTENT = {
    overview:      <OverviewSection allDonations={allDonations} isLoading={donationsLoading} onTabChange={setActiveTab} />,
    donations:     <DonationsSection allDonations={allDonations} isLoading={donationsLoading} />,
    notifications: <NotificationsSection />,
    profile:       <ProfileSection />,
    password:      <ChangePasswordSection />,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} unreadCount={unreadCount} />

        <div style={{ flex: 1, background: 'var(--color-bg)', overflowX: 'hidden' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 28px 96px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {CONTENT[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

      <style>{`
        @media (max-width: 767px) {
          .dashboard-sidebar    { display: none !important; }
          .dashboard-mobile-tabs { display: flex !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </motion.div>
  );
}
