import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  LayoutDashboard, Building2, Users, CreditCard, Bell,
  CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle,
  ChevronDown, Search, Download, Eye, Trash2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminCharities, approveCharity, rejectCharity,
  getAdminUsers, deactivateUser, getAllDonations,
} from '../../api/admin';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../../api/user';
import { exportToCSV } from '../../utils/csvExport';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

/* ── constants ─────────────────────────────────────────────────────────── */
const page = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'charities',   label: 'Charities',    Icon: Building2 },
  { id: 'users',       label: 'Users',        Icon: Users },
  { id: 'donations',   label: 'Donations',    Icon: CreditCard },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
];

const CHART_COLORS = {
  primary:  '#0D6E6E',
  accent:   '#F4A535',
  success:  '#22C55E',
  error:    '#EF4444',
  purple:   '#8B5CF6',
  blue:     '#3B82F6',
  orange:   '#F97316',
};

const CATEGORY_COLORS = {
  education:   CHART_COLORS.primary,
  health:      CHART_COLORS.success,
  environment: CHART_COLORS.blue,
  poverty:     CHART_COLORS.accent,
  disaster:    CHART_COLORS.error,
  animals:     CHART_COLORS.orange,
  other:       CHART_COLORS.purple,
};

function fmt(n) {
  const num = parseFloat(n) || 0;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)   return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── shared sub-components ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, Icon, color = CHART_COLORS.primary }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      display: 'flex', gap: 16, alignItems: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Skel({ w = '100%', h = 16, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <motion.div {...fade} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Dashboard overview ─────────────────────────────────────────────────── */
function DashboardSection() {
  const { data: charitiesData, isPending: loadingCharities } = useQuery({
    queryKey: ['admin-charities-all'],
    queryFn: () => getAdminCharities({ limit: 1000 }),
    staleTime: 60000,
  });
  const { data: usersData, isPending: loadingUsers } = useQuery({
    queryKey: ['admin-users-all'],
    queryFn: () => getAdminUsers({ limit: 1000 }),
    staleTime: 60000,
  });
  const { data: donationsData, isPending: loadingDonations } = useQuery({
    queryKey: ['admin-donations-all'],
    queryFn: () => getAllDonations({ limit: 500, status: 'completed' }),
    staleTime: 60000,
  });

  const charities  = charitiesData?.data  || charitiesData  || [];
  const users      = usersData?.data      || usersData      || [];
  const donations  = donationsData?.data  || donationsData  || [];

  const pending    = charities.filter(c => c.status === 'pending');
  const approved   = charities.filter(c => c.status === 'approved');
  const totalRaised = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  /* monthly bar chart — last 6 months */
  const barData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ month: d.toLocaleString('en-IN', { month: 'short' }), year: d.getFullYear(), m: d.getMonth(), total: 0 });
    }
    donations.forEach(don => {
      const d = new Date(don.createdAt);
      const slot = months.find(m => m.m === d.getMonth() && m.year === d.getFullYear());
      if (slot) slot.total += parseFloat(don.amount || 0);
    });
    return months.map(m => ({ name: m.month, Donations: Math.round(m.total) }));
  }, [donations]);

  /* pie chart — by category */
  const pieData = useMemo(() => {
    const map = {};
    approved.forEach(c => { map[c.category] = (map[c.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [approved]);

  /* recent signups — last 5 users */
  const recentUsers = useMemo(() => [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [users]);

  const loading = loadingCharities || loadingUsers || loadingDonations;

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Platform Overview</h2>

      {pending.length > 0 && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #F4A535', borderRadius: 12,
          padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertTriangle size={20} color="#D97706" />
          <span style={{ fontWeight: 600, color: '#92400E' }}>
            {pending.length} {pending.length === 1 ? 'charity is' : 'charities are'} awaiting approval
          </span>
        </div>
      )}

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              <Skel w={48} h={48} r={12} />
              <div style={{ marginTop: 12 }}><Skel w={80} h={22} /></div>
              <div style={{ marginTop: 8 }}><Skel w={120} h={14} /></div>
            </div>
          ))
        ) : (<>
          <StatCard label="Total Charities"    value={charities.length}  sub={`${pending.length} pending`}  Icon={Building2}   color={CHART_COLORS.primary} />
          <StatCard label="Registered Users"   value={users.length}      sub="all time"                      Icon={Users}       color={CHART_COLORS.blue} />
          <StatCard label="Completed Donations" value={donations.length} sub="verified payments"             Icon={CreditCard}  color={CHART_COLORS.success} />
          <StatCard label="Total Raised"       value={fmt(totalRaised)}  sub="across all charities"         Icon={TrendingUp}  color={CHART_COLORS.accent} />
        </>)}
      </div>

      {/* charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Monthly Donations (Last 6 Months)</h3>
          {loading ? <Skel w="100%" h={200} r={8} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Donated']} />
                <Bar dataKey="Donations" fill={CHART_COLORS.primary} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Approved Charities by Category</h3>
          {loading || pieData.length === 0 ? (
            loading ? <Skel w="100%" h={200} r={8} /> :
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No approved charities yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] || CHART_COLORS.purple} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* recent signups */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Recent Signups</h3>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Skel h={20} /></div>)
        ) : recentUsers.length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>No users yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Name', 'Email', 'Role', 'Verified', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '10px 12px', color: '#6B7280' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge variant={u.role === 'admin' ? 'error' : 'default'}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge variant={u.isVerified ? 'success' : 'warning'}>
                        {u.isVerified ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B7280' }}>{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Charities management ──────────────────────────────────────────────── */
function CharitiesSection() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [rejectNote, setRejectNote]       = useState('');
  const [viewTarget, setViewTarget]       = useState(null);

  const { data, isPending } = useQuery({
    queryKey: ['admin-charities'],
    queryFn: () => getAdminCharities({ limit: 500 }),
    staleTime: 30000,
  });
  const list = data?.data || data || [];

  const approveMut = useMutation({
    mutationFn: (id) => approveCharity(id),
    onSuccess: () => {
      toast.success('Charity approved!');
      qc.invalidateQueries({ queryKey: ['admin-charities'] });
      qc.invalidateQueries({ queryKey: ['admin-charities-all'] });
      setApproveTarget(null);
    },
    onError: () => toast.error('Failed to approve charity'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }) => rejectCharity(id, { adminNote: note }),
    onSuccess: () => {
      toast.success('Charity rejected');
      qc.invalidateQueries({ queryKey: ['admin-charities'] });
      qc.invalidateQueries({ queryKey: ['admin-charities-all'] });
      setRejectTarget(null);
      setRejectNote('');
    },
    onError: () => toast.error('Failed to reject charity'),
  });

  const filtered = useMemo(() => {
    let result = list;
    if (filter !== 'all') result = result.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, filter, search]);

  const STATUS_TABS = [
    { id: 'all', label: `All (${list.length})` },
    { id: 'pending',  label: `Pending (${list.filter(c => c.status === 'pending').length})` },
    { id: 'approved', label: `Approved (${list.filter(c => c.status === 'approved').length})` },
    { id: 'rejected', label: `Rejected (${list.filter(c => c.status === 'rejected').length})` },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Charity Management</h2>

      {/* filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: filter === t.id ? 'var(--color-primary)' : '#F3F4F6',
            color: filter === t.id ? '#fff' : 'var(--color-text)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search charities…"
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {isPending ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No charities found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Name', 'Category', 'Owner', 'Status', 'Raised', 'Registered', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ textTransform: 'capitalize', color: '#6B7280' }}>{c.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{c.User?.name || c.user?.name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={c.status === 'approved' ? 'success' : c.status === 'pending' ? 'warning' : 'error'}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{fmt(c.raisedAmount)}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                      <button onClick={() => setViewTarget(c)} title="View" style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                        <Eye size={14} />
                      </button>
                      {c.status === 'pending' && (<>
                        <button onClick={() => setApproveTarget(c)} title="Approve" style={{ background: '#D1FAE5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                          <CheckCircle size={14} color="#16A34A" />
                        </button>
                        <button onClick={() => { setRejectTarget(c); setRejectNote(''); }} title="Reject" style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                          <XCircle size={14} color="#DC2626" />
                        </button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View modal */}
      <AnimatePresence>
        {viewTarget && (
          <Modal open title={viewTarget.name} onClose={() => setViewTarget(null)} width={540}>
            <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
              {[
                ['Category', viewTarget.category],
                ['Status', viewTarget.status],
                ['Email', viewTarget.email],
                ['Location', viewTarget.location || '—'],
                ['Registration #', viewTarget.registrationNumber || '—'],
                ['Goal', fmt(viewTarget.goalAmount)],
                ['Raised', fmt(viewTarget.raisedAmount)],
                ['Website', viewTarget.websiteUrl || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#6B7280', minWidth: 130 }}>{label}:</span>
                  <span style={{ textTransform: label === 'Category' || label === 'Status' ? 'capitalize' : 'none' }}>{val}</span>
                </div>
              ))}
              {viewTarget.description && (
                <div>
                  <div style={{ fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Description:</div>
                  <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>{viewTarget.description}</p>
                </div>
              )}
              {viewTarget.adminNote && (
                <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontWeight: 600, color: '#DC2626' }}>Admin Note: </span>
                  <span style={{ color: '#7F1D1D' }}>{viewTarget.adminNote}</span>
                </div>
              )}
              {viewTarget.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <Button variant="primary" style={{ flex: 1 }} onClick={() => { setViewTarget(null); setApproveTarget(viewTarget); }}>Approve</Button>
                  <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setViewTarget(null); setRejectTarget(viewTarget); setRejectNote(''); }}>Reject</Button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Approve confirm modal */}
      <AnimatePresence>
        {approveTarget && (
          <Modal open title="Approve Charity" onClose={() => setApproveTarget(null)}>
            <p style={{ color: '#374151', marginBottom: 24 }}>
              Approve <strong>{approveTarget.name}</strong>? They will receive an email notification and their charity will go live.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="primary" style={{ flex: 1 }} onClick={() => approveMut.mutate(approveTarget.id)} disabled={approveMut.isPending}>
                {approveMut.isPending ? 'Approving…' : 'Yes, Approve'}
              </Button>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setApproveTarget(null)}>Cancel</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <Modal open title="Reject Charity" onClose={() => { setRejectTarget(null); setRejectNote(''); }}>
            <p style={{ color: '#374151', marginBottom: 12 }}>
              Reject <strong>{rejectTarget.name}</strong>? Please provide a reason.
            </p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (required)…"
              rows={4}
              style={{
                width: '100%', borderRadius: 10, border: '1.5px solid #E5E7EB', padding: 12,
                fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="primary"
                style={{ flex: 1, background: '#EF4444' }}
                onClick={() => rejectMut.mutate({ id: rejectTarget.id, note: rejectNote })}
                disabled={rejectMut.isPending || !rejectNote.trim()}
              >
                {rejectMut.isPending ? 'Rejecting…' : 'Reject Charity'}
              </Button>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setRejectTarget(null); setRejectNote(''); }}>Cancel</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Users management ──────────────────────────────────────────────────── */
function UsersSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const { data, isPending } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers({ limit: 500 }),
    staleTime: 30000,
  });
  const list = data?.data || data || [];

  const deactivateMut = useMutation({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: () => {
      toast.success('User deactivated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-users-all'] });
      setDeactivateTarget(null);
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>User Management</h2>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {isPending ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No users found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Name', 'Email', 'Role', 'Verified', 'Phone', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={u.role === 'admin' ? 'error' : 'default'}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={u.isVerified ? 'success' : 'warning'}>
                      {u.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setViewTarget(u)} title="View" style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                        <Eye size={14} />
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => setDeactivateTarget(u)} title="Deactivate" style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View user modal */}
      <AnimatePresence>
        {viewTarget && (
          <Modal open title="User Profile" onClose={() => setViewTarget(null)}>
            <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
              {[
                ['Name', viewTarget.name],
                ['Email', viewTarget.email],
                ['Role', viewTarget.role],
                ['Verified', viewTarget.isVerified ? 'Yes' : 'No'],
                ['Phone', viewTarget.phone || '—'],
                ['Joined', fmtDate(viewTarget.createdAt)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#6B7280', minWidth: 90 }}>{label}:</span>
                  <span>{val}</span>
                </div>
              ))}
              {viewTarget.address && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#6B7280', minWidth: 90 }}>Address:</span>
                  <span>{viewTarget.address}</span>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Deactivate confirm modal */}
      <AnimatePresence>
        {deactivateTarget && (
          <Modal open title="Deactivate User" onClose={() => setDeactivateTarget(null)}>
            <p style={{ color: '#374151', marginBottom: 8 }}>
              Deactivate <strong>{deactivateTarget.name}</strong>? This action removes their account from the platform.
            </p>
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 24 }}>⚠️ This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="primary"
                style={{ flex: 1, background: '#EF4444' }}
                onClick={() => deactivateMut.mutate(deactivateTarget.id)}
                disabled={deactivateMut.isPending}
              >
                {deactivateMut.isPending ? 'Deactivating…' : 'Yes, Deactivate'}
              </Button>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── All Donations ─────────────────────────────────────────────────────── */
function DonationsSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data, isPending } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => getAllDonations({ limit: 1000 }),
    staleTime: 30000,
  });
  const list = data?.data || data || [];

  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter) result = result.filter(d => d.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.User?.name?.toLowerCase().includes(q) ||
        d.Charity?.name?.toLowerCase().includes(q) ||
        d.paymentId?.toLowerCase().includes(q)
      );
    }
    if (from) result = result.filter(d => new Date(d.createdAt) >= new Date(from));
    if (to)   result = result.filter(d => new Date(d.createdAt) <= new Date(to + 'T23:59:59'));
    return result;
  }, [list, statusFilter, search, from, to]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    exportToCSV('donations.csv', filtered, [
      { label: 'Date',     value: d => fmtDate(d.createdAt) },
      { label: 'Donor',    value: d => d.isAnonymous ? 'Anonymous' : (d.User?.name || '—') },
      { label: 'Charity',  value: d => d.Charity?.name || '—' },
      { label: 'Amount',   value: d => parseFloat(d.amount || 0).toFixed(2) },
      { label: 'Currency', value: d => d.currency || 'INR' },
      { label: 'Status',   value: d => d.status },
      { label: 'Gateway',  value: d => d.paymentGateway || '—' },
      { label: 'Payment ID', value: d => d.paymentId || '—' },
    ]);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>All Donations</h2>
        <Button variant="secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={15} /> Export CSV
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Donor, charity, payment ID…"
            style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Statuses</option>
          {['pending', 'completed', 'failed', 'refunded'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {isPending ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No donations found</div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Date', 'Donor', 'Charity', 'Amount', 'Status', 'Gateway', 'Payment ID'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '11px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(d.createdAt)}</td>
                    <td style={{ padding: '11px 16px' }}>{d.isAnonymous ? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Anonymous</span> : (d.User?.name || '—')}</td>
                    <td style={{ padding: '11px 16px' }}>{d.Charity?.name || '—'}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge variant={d.status === 'completed' ? 'success' : d.status === 'pending' ? 'warning' : 'error'}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#6B7280', textTransform: 'capitalize' }}>{d.paymentGateway || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12 }}>{d.paymentId ? d.paymentId.slice(0, 20) + '…' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span style={{ padding: '7px 16px', color: '#6B7280', fontSize: 14 }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Notifications ─────────────────────────────────────────────────────── */
function NotificationsSection() {
  const qc = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
    staleTime: 15000,
  });
  const notifs = data?.data || data || [];

  const markOneMut = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });
  const markAllMut = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['admin-notifications'] }); },
  });

  const unread = notifs.filter(n => !n.isRead).length;

  const NOTIF_ICONS = {
    donation_confirmed:  { color: CHART_COLORS.success,  bg: '#D1FAE5' },
    charity_approved:    { color: CHART_COLORS.primary,   bg: '#CCFBF1' },
    charity_rejected:    { color: CHART_COLORS.error,     bg: '#FEE2E2' },
    impact_report:       { color: CHART_COLORS.blue,      bg: '#DBEAFE' },
    reminder:            { color: CHART_COLORS.accent,    bg: '#FEF3C7' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Notifications</h2>
        {unread > 0 && (
          <Button variant="secondary" onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}>
            {markAllMut.isPending ? 'Marking…' : `Mark all read (${unread})`}
          </Button>
        )}
      </div>

      {isPending ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9CA3AF' }}>
          <Bell size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => {
            const style = NOTIF_ICONS[n.type] || { color: '#6B7280', bg: '#F3F4F6' };
            return (
              <div key={n.id} onClick={() => !n.isRead && markOneMut.mutate(n.id)}
                style={{
                  background: '#fff', borderRadius: 14, padding: '14px 18px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  display: 'flex', gap: 14, alignItems: 'flex-start', cursor: n.isRead ? 'default' : 'pointer',
                  borderLeft: n.isRead ? '4px solid transparent' : `4px solid ${style.color}`,
                  opacity: n.isRead ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={16} color={style.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(n.createdAt)}</p>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
function Sidebar({ active, onTabChange, unreadCount }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: '#fff', borderRight: '1px solid #E5E7EB',
      height: 'calc(100vh - 64px)', position: 'sticky', top: 64,
      overflowY: 'auto', padding: '24px 0',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #E5E7EB', marginBottom: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#FEE2E2', color: '#DC2626', borderRadius: 20,
          padding: '4px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
          Platform Admin
        </div>
      </div>

      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onTabChange(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--color-text)',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                marginBottom: 2, textAlign: 'left', position: 'relative',
                transition: 'background 0.15s, color 0.15s',
              }}>
              <Icon size={18} />
              {label}
              {id === 'notifications' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 10,
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'var(--color-primary)',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ── Mobile tab bar ────────────────────────────────────────────────────── */
function MobileTabBar({ active, onTabChange, unreadCount }) {
  const SHORT = { dashboard: 'Overview', charities: 'Charities', users: 'Users', donations: 'Donations', notifications: 'Alerts' };
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#fff', borderTop: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: 60, padding: '0 4px',
    }}>
      {TABS.map(({ id, Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onTabChange(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', position: 'relative',
          }}>
            {id === 'notifications' && unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 'calc(50% - 16px)',
                width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)',
              }} />
            )}
            <Icon size={20} color={isActive ? 'var(--color-primary)' : '#9CA3AF'} />
            <span style={{ fontSize: 10, color: isActive ? 'var(--color-primary)' : '#9CA3AF', fontWeight: isActive ? 600 : 400 }}>
              {SHORT[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: unreadData } = useQuery({
    queryKey: ['admin-unread-count'],
    queryFn: () => getUnreadCount(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
  const unreadCount = unreadData?.count ?? unreadData?.data?.count ?? 0;

  const SECTION_MAP = {
    dashboard:     <DashboardSection />,
    charities:     <CharitiesSection />,
    users:         <UsersSection />,
    donations:     <DonationsSection />,
    notifications: <NotificationsSection />,
  };

  return (
    <motion.div {...page} style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width: 767px) {
          .admin-sidebar { display: none !important; }
          .admin-mobile-tabs { display: flex !important; }
          .admin-content { padding: 20px 16px 80px !important; }
        }
        @media (min-width: 768px) {
          .admin-mobile-tabs { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div className="admin-sidebar">
          <Sidebar active={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
        </div>

        <main className="admin-content" style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} {...fade}>
              {SECTION_MAP[activeTab]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="admin-mobile-tabs" style={{ display: 'none' }}>
        <MobileTabBar active={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
      </div>
    </motion.div>
  );
}
