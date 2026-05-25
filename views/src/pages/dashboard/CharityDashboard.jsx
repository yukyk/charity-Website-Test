import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Building2, FolderOpen, CreditCard,
  Megaphone, User, Plus, Pencil, CheckCircle, XCircle,
  Clock, Download, MapPin, Eye, EyeOff, Lock,
  ChevronRight, FileText, Camera, X,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { formatCurrency, formatDate, formatRelativeTime, truncate, getInitials } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvExport';
import {
  getMyCharity, registerCharity, updateCharity,
  getCharityProjects, addProject, updateProject,
  getCharityDonations, getImpactReports, addImpactReport,
} from '../../api/charity';
import { getProfile, updateProfile, changePassword as changePasswordAPI } from '../../api/user';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',        Icon: LayoutDashboard },
  { id: 'charity',   label: 'My Charity',      Icon: Building2       },
  { id: 'projects',  label: 'Projects',        Icon: FolderOpen      },
  { id: 'donations', label: 'Donations',       Icon: CreditCard      },
  { id: 'reports',   label: 'Impact Reports',  Icon: Megaphone       },
  { id: 'profile',   label: 'Profile',         Icon: User            },
];

const CATEGORIES = ['education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other'];

const STATUS_VARIANT = { completed: 'success', pending: 'warning', failed: 'error', refunded: 'neutral' };
const PROJ_STATUS_VARIANT = { active: 'success', completed: 'info', paused: 'warning' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STR_COL = ['', '#EF4444', '#F59E0B', '#22C55E', '#15803D'];
const STR_LBL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

// ── Micro components ─────────────────────────────────────────────────────────

function Skel({ w = '100%', h = 16, r = 6, style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function PwBar({ password }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= s ? STR_COL[s] : 'var(--color-border)', transition: 'background 0.3s' }} />)}
      </div>
      <span style={{ fontSize: 12, color: STR_COL[s], fontWeight: 600 }}>{STR_LBL[s]}</span>
    </div>
  );
}

function StatCard({ label, value, sub, gradient }) {
  return (
    <div style={{ background: gradient, borderRadius: 'var(--radius-md)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function StatusBanner({ charity, onReapply }) {
  if (!charity) return null;
  const cfg = {
    pending:  { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', Icon: Clock,        text: 'Your charity is under review. We\'ll notify you within 48 hours.' },
    rejected: { bg: '#FEE2E2', border: '#EF4444', color: '#991B1B', Icon: XCircle,      text: charity.adminNote || 'Your charity application was rejected.' },
    approved: { bg: '#D1FAE5', border: '#22C55E', color: '#065F46', Icon: CheckCircle,  text: 'Your charity is verified and live on GiveHope ✓' },
  };
  const c = cfg[charity.status];
  if (!c) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, marginBottom: 24 }}>
      <c.Icon size={20} style={{ color: c.border, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, color: c.color, lineHeight: 1.5 }}>{c.text}</span>
      </div>
      {charity.status === 'rejected' && (
        <button onClick={onReapply} style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', background: 'rgba(239,68,68,0.12)', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          Edit & Reapply
        </button>
      )}
    </div>
  );
}

// ── Charity Preview Card ──────────────────────────────────────────────────────

function CharityPreviewCard({ data }) {
  const raised = parseFloat(data?.raisedAmount || 0);
  const goal   = parseFloat(data?.goalAmount   || 0);
  const name   = data?.name || 'Charity Name';
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ height: 140, background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {data?.logoUrl ? (
          <img src={data.logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <span style={{ fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>{name[0]}</span>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <Badge variant="info">{data?.category || 'other'}</Badge>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>{name}</h3>
        {data?.location && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 8 }}>
            <MapPin size={12} /><span>{data.location}</span>
          </div>
        )}
        {data?.description && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: goal > 0 ? 12 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.description}
          </p>
        )}
        {goal > 0 && (
          <>
            <ProgressBar value={raised} max={goal} showPercentage={false} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(raised)} raised</span>
              <span style={{ color: 'var(--color-text-muted)' }}>of {formatCurrency(goal)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Register Charity CTA ──────────────────────────────────────────────────────

function RegisterCharity({ onRegistered }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: registerCharity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-charity'] });
      toast.success('Charity registered! Awaiting admin approval.');
      setOpen(false);
    },
    onError: err => toast.error(err.message),
  });

  const taStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)' };
  const selStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--color-text)', cursor: 'pointer' };

  return (
    <>
      <div style={{ textAlign: 'center', padding: '64px 32px' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(13,110,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--color-primary)' }}>
          <Building2 size={36} />
        </div>
        <h2 style={{ marginBottom: 10 }}>Register Your Charity</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Get your charity listed on GiveHope and start accepting transparent donations from donors worldwide.
        </p>
        <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
          <Plus size={16} /> Register Charity
        </Button>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Register Your Charity" maxWidth="600px">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="form-group">
            <Input label="Charity Name" placeholder="e.g., GreenEarth Foundation" error={errors.name?.message}
              {...register('name', { required: 'Name is required' })} />
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea placeholder="What does your charity do?" rows={3} style={taStyle} {...register('description', { required: 'Description is required' })} />
              {errors.description && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.description.message}</span>}
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Mission</label>
              <textarea placeholder="Your charity's mission statement" rows={2} style={taStyle} {...register('mission')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Category</label>
                <select style={selStyle} {...register('category', { required: true })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <Input label="Location" placeholder="City, Country" {...register('location')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Registration Number" placeholder="REG-12345" {...register('registrationNumber')} />
              <Input label="Goal Amount (₹)" type="number" placeholder="500000" error={errors.goalAmount?.message}
                {...register('goalAmount', { required: 'Goal amount is required', min: { value: 1, message: 'Must be positive' } })} />
            </div>
            <Input label="Website URL" type="url" placeholder="https://yourcharity.org" {...register('websiteUrl')} />
            <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting || mutation.isPending}>
              Register Charity
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Overview Section ──────────────────────────────────────────────────────────

function OverviewSection({ charity, charityId, donations, donationsLoading, onTabChange }) {
  const raised    = parseFloat(charity?.raisedAmount || 0);
  const goal      = parseFloat(charity?.goalAmount   || 0);
  const pct       = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const donors    = useMemo(() => new Set((donations || []).map(d => d.userId)).size, [donations]);
  const recent    = (donations || []).slice(0, 10);
  const isLoading = donationsLoading;

  return (
    <div>
      <StatusBanner charity={charity} onReapply={() => onTabChange('charity')} />

      <h2 style={{ marginBottom: 6, fontSize: 'clamp(20px,2.5vw,26px)' }}>Charity Overview</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 15 }}>{charity?.name}</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }} className="cd-stats-grid">
        <StatCard label="Total Raised"   value={formatCurrency(raised)} gradient="linear-gradient(135deg,#0D6E6E,#094F4F)" />
        <StatCard label="Goal Amount"    value={formatCurrency(goal)}   gradient="linear-gradient(135deg,#D97706,#92400E)" />
        <StatCard label="Progress"       value={`${pct}%`}             gradient="linear-gradient(135deg,#16A34A,#14532D)" />
        <StatCard label="Total Donors"   value={donors}                gradient="linear-gradient(135deg,#7C3AED,#4C1D95)" />
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Fundraising Progress</h3>
        <ProgressBar value={raised} max={goal} label={`${formatCurrency(raised)} raised of ${formatCurrency(goal)}`} />
      </div>

      {/* Recent donations */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 16 }}>Recent Donations</h3>
          <button onClick={() => onTabChange('donations')} style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
        </div>
        {isLoading ? (
          [0,1,2].map(i => <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <Skel w="30%" h={13} /><Skel w="18%" h={13} /><Skel w="18%" h={13} /><Skel w="15%" h={20} r={999} />
          </div>)
        ) : recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>No donations received yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead><tr>{['Donor','Amount','Project','Date','Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
              <tbody>
                {recent.map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 500 }}>{d.isAnonymous ? 'Anonymous' : (d.user?.name || '—')}</td>
                    <td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(d.amount)}</td>
                    <td style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>{d.project?.title || 'General'}</td>
                    <td style={{ padding: '12px 0', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.createdAt)}</td>
                    <td style={{ padding: '12px 0' }}><Badge variant={STATUS_VARIANT[d.status] || 'neutral'}>{d.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <button onClick={() => onTabChange('projects')} style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-primary)', background: 'rgba(13,110,110,0.03)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-primary)', fontWeight: 600, fontSize: 15, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,110,110,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,110,110,0.03)'}
        >
          <Plus size={22} /> Add New Project
        </button>
        <button onClick={() => onTabChange('reports')} style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-accent)', background: 'rgba(244,165,53,0.03)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, color: '#B45309', fontWeight: 600, fontSize: 15, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,165,53,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,165,53,0.03)'}
        >
          <Megaphone size={22} /> Post Impact Report
        </button>
      </div>
    </div>
  );
}

// ── My Charity Section ────────────────────────────────────────────────────────

function CharityProfileSection({ charity, charityId }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', description: '', mission: '', category: 'other', location: '', registrationNumber: '', goalAmount: '', websiteUrl: '', logoUrl: '' },
  });

  useEffect(() => {
    if (charity) reset({ name: charity.name || '', description: charity.description || '', mission: charity.mission || '', category: charity.category || 'other', location: charity.location || '', registrationNumber: charity.registrationNumber || '', goalAmount: charity.goalAmount || '', websiteUrl: charity.websiteUrl || '', logoUrl: charity.logoUrl || '' });
  }, [charity, reset]);

  const formValues = watch();
  const previewData = useMemo(() => ({ ...charity, ...formValues }), [charity, formValues]);

  const mutation = useMutation({
    mutationFn: data => updateCharity(charityId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-charity'] }); toast.success('Charity profile updated!'); },
    onError: err => toast.error(err.message),
  });

  const taStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)' };
  const selStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--color-text)', cursor: 'pointer' };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px,2.5vw,26px)' }}>My Charity Profile</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }} className="charity-edit-grid">
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
            <div className="form-group">
              <Input label="Charity Name" placeholder="Your charity's official name" error={errors.name?.message}
                {...register('name', { required: 'Name is required' })} />
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea rows={3} style={taStyle} placeholder="What does your charity do?" {...register('description')} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Mission Statement</label>
                <textarea rows={2} style={taStyle} placeholder="Your charity's core mission" {...register('mission')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Category</label>
                  <select style={selStyle} {...register('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <Input label="Location" placeholder="City, Country" {...register('location')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Registration Number" placeholder="REG-12345" {...register('registrationNumber')} />
                <Input label="Goal Amount (₹)" type="number" placeholder="500000" {...register('goalAmount')} />
              </div>
              <Input label="Website URL" type="url" placeholder="https://yourcharity.org" {...register('websiteUrl')} />
              <Input label="Logo URL" type="url" placeholder="https://..." {...register('logoUrl')} />
              <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting || mutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>Live Preview</p>
          <CharityPreviewCard data={previewData} />
        </div>
      </div>
      <style>{`.charity-edit-grid { @media (max-width: 900px) { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

// ── Projects Section ──────────────────────────────────────────────────────────

function ProjectsSection({ charityId }) {
  const qc = useQueryClient();
  const [modalProject, setModalProject] = useState(null); // null=closed, {}=new, {id,...}=edit

  const { data, isLoading } = useQuery({
    queryKey: ['charity-projects', charityId],
    queryFn: () => getCharityProjects(charityId),
    enabled: !!charityId,
  });
  const projects = data?.data ?? [];

  const isEdit = modalProject && modalProject.id;
  const mutation = useMutation({
    mutationFn: d => isEdit ? updateProject(charityId, modalProject.id, d) : addProject(charityId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['charity-projects', charityId] });
      toast.success(isEdit ? 'Project updated!' : 'Project added!');
      setModalProject(null);
    },
    onError: err => toast.error(err.message),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => {
    if (modalProject) reset({ title: modalProject.title || '', description: modalProject.description || '', targetAmount: modalProject.targetAmount || '', imageUrl: modalProject.imageUrl || '', status: modalProject.status || 'active' });
  }, [modalProject, reset]);

  const taStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)' };
  const selStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--color-text)', cursor: 'pointer' };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px,2.5vw,26px)' }}>Projects</h2>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {/* Add card */}
          <button onClick={() => setModalProject({})} style={{ padding: 28, borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', transition: 'all 0.2s', minHeight: 160 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(13,110,110,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus size={28} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Add New Project</span>
          </button>

          {/* Project cards */}
          {projects.map(p => {
            const raised = parseFloat(p.raisedAmount || 0);
            const target = parseFloat(p.targetAmount || 0);
            return (
              <div key={p.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h4 style={{ fontSize: 15, flex: 1, marginRight: 8 }}>{p.title}</h4>
                  <Badge variant={PROJ_STATUS_VARIANT[p.status] || 'neutral'}>{p.status}</Badge>
                </div>
                {p.description && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
                {target > 0 && (
                  <>
                    <ProgressBar value={raised} max={target} showPercentage={false} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, marginBottom: 14 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(raised)}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>of {formatCurrency(target)}</span>
                    </div>
                  </>
                )}
                <button onClick={() => setModalProject(p)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!modalProject} onClose={() => setModalProject(null)} title={isEdit ? 'Edit Project' : 'Add New Project'} maxWidth="480px">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="form-group">
            <Input label="Project Title" placeholder="e.g., Build 10 Schools" error={errors.title?.message}
              {...register('title', { required: 'Title is required' })} />
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea rows={3} style={taStyle} placeholder="What will this project achieve?" {...register('description')} />
            </div>
            <Input label="Target Amount (₹)" type="number" placeholder="100000" error={errors.targetAmount?.message}
              {...register('targetAmount', { required: 'Target amount is required' })} />
            <Input label="Image URL" type="url" placeholder="https://..." {...register('imageUrl')} />
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Status</label>
              <select style={selStyle} {...register('status')}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting || mutation.isPending}>
              {isEdit ? 'Save Changes' : 'Add Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Donations Section ─────────────────────────────────────────────────────────

function CharityDonationsSection({ charityId, donations, isLoading }) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    return (donations || []).filter(x => new Date(x.createdAt) >= d && x.status === 'completed').reduce((s,x) => s + parseFloat(x.amount||0), 0);
  }, [donations]);

  const thisMonth = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
    return (donations || []).filter(x => new Date(x.createdAt) >= d && x.status === 'completed').reduce((s,x) => s + parseFloat(x.amount||0), 0);
  }, [donations]);

  const allTime = useMemo(() => (donations || []).filter(x => x.status === 'completed').reduce((s,x) => s + parseFloat(x.amount||0), 0), [donations]);

  const handleExport = () => {
    exportToCSV(`donations-${new Date().toISOString().slice(0,10)}.csv`, donations || [], [
      { label: 'Donor',      value: d => d.isAnonymous ? 'Anonymous' : (d.user?.name || '—') },
      { label: 'Amount',     value: d => d.amount },
      { label: 'Project',    value: d => d.project?.title || 'General' },
      { label: 'Date',       value: d => formatDate(d.createdAt) },
      { label: 'Payment ID', value: d => d.paymentId || '—' },
      { label: 'Status',     value: d => d.status },
    ]);
    toast.success('CSV exported!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)' }}>Donations Received</h2>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!donations?.length}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }} className="cd-stats-grid">
        <StatCard label="Today"      value={formatCurrency(today)}    gradient="linear-gradient(135deg,#0D6E6E,#094F4F)" />
        <StatCard label="This Month" value={formatCurrency(thisMonth)} gradient="linear-gradient(135deg,#D97706,#92400E)" />
        <StatCard label="All Time"   value={formatCurrency(allTime)}  gradient="linear-gradient(135deg,#16A34A,#14532D)" />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24 }}>{[0,1,2,3].map(i => <div key={i} style={{ display: 'flex', gap: 10, padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}><Skel w="25%" h={13} /><Skel w="15%" h={13} /><Skel w="20%" h={13} /><Skel w="15%" h={13} /><Skel w="18%" h={20} r={999} /></div>)}</div>
        ) : (donations || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CreditCard size={36} style={{ color: 'var(--color-border)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No donations received yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead style={{ background: 'rgba(13,110,110,0.04)' }}>
                <tr>{['Donor','Amount','Project','Date','Payment ID','Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '11px 18px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(donations || []).map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,110,110,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '13px 18px', fontWeight: 500 }}>{d.isAnonymous ? <em style={{ color: 'var(--color-text-muted)' }}>Anonymous</em> : (d.user?.name || '—')}</td>
                    <td style={{ padding: '13px 18px', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatCurrency(d.amount)}</td>
                    <td style={{ padding: '13px 18px', color: 'var(--color-text-muted)' }}>{d.project?.title || 'General Fund'}</td>
                    <td style={{ padding: '13px 18px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.createdAt)}</td>
                    <td style={{ padding: '13px 18px' }}><code style={{ fontSize: 11, background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>{(d.paymentId||d.id||'').toString().slice(0,14)}…</code></td>
                    <td style={{ padding: '13px 18px' }}><Badge variant={STATUS_VARIANT[d.status]||'neutral'}>{d.status}</Badge></td>
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

// ── Impact Reports Section ────────────────────────────────────────────────────

function ImpactReportsSection({ charityId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 2000;

  const { data, isLoading } = useQuery({
    queryKey: ['impact-reports', charityId],
    queryFn: () => getImpactReports(charityId),
    enabled: !!charityId,
  });
  const reports = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: d => addImpactReport(charityId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impact-reports', charityId] });
      toast.success('Impact report posted! Donors have been notified.');
      setOpen(false); reset(); setCharCount(0);
    },
    onError: err => toast.error(err.message),
  });

  const taStyle = { width: '100%', padding: '11px 13px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)' }}>Impact Reports</h2>
        <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} /> Post New Report
        </Button>
      </div>

      {isLoading ? (
        <div>{[0,1,2].map(i => <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24 }}><div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%', marginTop: 8, flexShrink: 0 }} /><div className="skeleton" style={{ flex: 1, height: 120, borderRadius: 'var(--radius-md)' }} /></div>)}</div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 32px' }}>
          <Megaphone size={40} style={{ color: 'var(--color-border)', margin: '0 auto 14px' }} />
          <h3 style={{ marginBottom: 8 }}>No impact reports yet</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>Share the difference you're making with your donors.</p>
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Post First Report</Button>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--color-border)' }} />
          {reports.map((r, i) => (
            <motion.div key={r.id} style={{ position: 'relative', marginBottom: 24 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ position: 'absolute', left: -24, top: 10, width: 12, height: 12, borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid #fff', boxShadow: '0 0 0 2px var(--color-primary)' }} />
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 15 }}>{r.title}</h4>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>{formatDate(r.createdAt)}</span>
                </div>
                {r.imageUrl && <img src={r.imageUrl} alt={r.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />}
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{r.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => { setOpen(false); reset(); setCharCount(0); }} title="Post Impact Report" maxWidth="520px">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="form-group">
            <Input label="Report Title" placeholder="e.g., 50 Children Now in School!" error={errors.title?.message}
              {...register('title', { required: 'Title is required' })} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Content</label>
                <span style={{ fontSize: 12, color: charCount > MAX_CHARS * 0.9 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>{charCount}/{MAX_CHARS}</span>
              </div>
              <textarea rows={6} style={taStyle} maxLength={MAX_CHARS} placeholder="Share the impact your donations have made…"
                {...register('content', { required: 'Content is required', onChange: e => setCharCount(e.target.value.length) })}
              />
              {errors.content && <span style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.content.message}</span>}
            </div>
            <Input label="Image URL (optional)" type="url" placeholder="https://..." {...register('imageUrl')} />
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)', fontSize: 13, color: '#065F46', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              All donors who have contributed to this charity will be notified via email.
            </div>
            <Button type="submit" variant="accent" size="md" fullWidth loading={isSubmitting || mutation.isPending}>
              Post Report & Notify Donors
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Profile Section (reused from UserDashboard pattern) ───────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [tab, setTab] = useState('info');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const { data: profileData, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const profile = profileData?.data || user;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '', address: user?.address || '' },
  });
  useEffect(() => { if (profileData?.data) { const p = profileData.data; reset({ name: p.name || '', phone: p.phone || '', address: p.address || '' }); } }, [profileData, reset]);

  const pwForm = useForm();
  const newPw = pwForm.watch('newPassword', '');

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: d => { updateUser(d.data); qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile updated!'); },
    onError: err => toast.error(err.message),
  });

  async function onPwSubmit(data) {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    try { await changePasswordAPI({ currentPassword: data.currentPassword, newPassword: data.newPassword }); toast.success('Password updated!'); pwForm.reset(); } catch(err) { toast.error(err.message); }
  }

  const taStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: 'var(--color-text)' };
  const eyeBtn = (show, toggle) => (<button type="button" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>);

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 'clamp(20px,2.5vw,26px)' }}>Account</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['info','password'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--color-primary)' : 'var(--color-border)', color: tab === t ? '#fff' : 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {t === 'info' ? 'Personal Info' : 'Change Password'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card" style={{ padding: 32, maxWidth: 540 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <Avatar name={profile?.name} src={avatarPreview || profile?.avatarUrl} size="xl" />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} className="av-overlay">
                <Camera size={22} color="#fff" style={{ opacity: 0, transition: 'opacity 0.2s' }} className="av-cam" />
              </div>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) { setAvatarPreview(URL.createObjectURL(f)); toast.success('Photo preview updated!'); } }} />
            </div>
          </div>
          {isLoading ? <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{[0,1,2,3].map(i => <Skel key={i} h={46} />)}</div> : (
            <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} noValidate>
              <div className="form-group">
                <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
                <Input label="Email" type="email" value={profile?.email||''} disabled onChange={() => {}} style={{ background: '#f5f5f5', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />
                <Input label="Phone" type="tel" {...register('phone')} />
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Address</label>
                  <textarea rows={2} style={taStyle} {...register('address')} />
                </div>
                <Button type="submit" variant="primary" size="md" fullWidth loading={isSubmitting || profileMutation.isPending}>Save Changes</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: 32, maxWidth: 460 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(13,110,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--color-primary)' }}><Lock size={22} /></div>
          <form onSubmit={pwForm.handleSubmit(onPwSubmit)} noValidate>
            <div className="form-group">
              <Input label="Current Password" type={showCur?'text':'password'} rightElement={eyeBtn(showCur, () => setShowCur(v=>!v))} error={pwForm.formState.errors.currentPassword?.message} {...pwForm.register('currentPassword', { required: 'Required' })} />
              <div>
                <Input label="New Password" type={showNew?'text':'password'} rightElement={eyeBtn(showNew, () => setShowNew(v=>!v))} error={pwForm.formState.errors.newPassword?.message} {...pwForm.register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
                <PwBar password={newPw} />
              </div>
              <Input label="Confirm New Password" type={showCon?'text':'password'} rightElement={eyeBtn(showCon, () => setShowCon(v=>!v))} error={pwForm.formState.errors.confirmPassword?.message} {...pwForm.register('confirmPassword', { required: 'Required' })} />
              <Button type="submit" variant="primary" size="md" fullWidth loading={pwForm.formState.isSubmitting}>Update Password</Button>
            </div>
          </form>
        </div>
      )}

      <style>{`.av-overlay:hover{background:rgba(0,0,0,0.38)!important}.av-overlay:hover .av-cam{opacity:1!important}`}</style>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ activeTab, setActiveTab, user, charityName }) {
  return (
    <aside className="dashboard-sidebar" style={{ width: 236, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <Avatar name={user?.name} size="md" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            {charityName && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charityName}</div>}
          </div>
        </div>
        <span className="badge badge-warning" style={{ fontSize: 10 }}>Charity Admin</span>
      </div>
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 8, marginBottom: 2, border: 'none', background: active ? 'rgba(13,110,110,0.08)' : 'transparent', color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: active ? 700 : 500, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s', borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(13,110,110,0.04)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} /> <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
      </div>
    </aside>
  );
}

function MobileTabBar({ activeTab, setActiveTab }) {
  const short = ['Home','Charity','Projects','Donations','Reports','Account'];
  return (
    <div className="dashboard-mobile-tabs" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#fff', borderTop: '1px solid var(--color-border)', display: 'none' }}>
      {TABS.map(({ id, Icon }, i) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 2px', border: 'none', background: 'transparent', color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'inherit', cursor: 'pointer', fontSize: 9, fontWeight: active ? 700 : 400 }}>
            <Icon size={19} /> <span>{short[i]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function CharityDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: charityData, isLoading: charityLoading } = useQuery({
    queryKey: ['my-charity'],
    queryFn: getMyCharity,
    retry: 1,
  });
  const charity   = charityData?.data;
  const charityId = charity?.id;

  const { data: donationsData, isLoading: donationsLoading } = useQuery({
    queryKey: ['charity-donations', charityId],
    queryFn: () => getCharityDonations(charityId, { limit: 100 }),
    enabled: !!charityId,
  });
  const donations = donationsData?.data ?? [];

  const CONTENT = charity ? {
    overview:  <OverviewSection charity={charity} charityId={charityId} donations={donations} donationsLoading={donationsLoading} onTabChange={setActiveTab} />,
    charity:   <CharityProfileSection charity={charity} charityId={charityId} />,
    projects:  <ProjectsSection charityId={charityId} />,
    donations: <CharityDonationsSection charityId={charityId} donations={donations} isLoading={donationsLoading} />,
    reports:   <ImpactReportsSection charityId={charityId} />,
    profile:   <ProfileSection />,
  } : {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} charityName={charity?.name} />
        <div style={{ flex: 1, background: 'var(--color-bg)', overflowX: 'hidden' }}>
          <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 28px 96px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {charityLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Skel h={48} w="40%" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="cd-stats-grid">
                      {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />)}
                    </div>
                    <Skel h={200} r={16} />
                  </div>
                ) : !charity ? (
                  <RegisterCharity />
                ) : (
                  CONTENT[activeTab]
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <style>{`
        @media (max-width: 767px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-mobile-tabs { display: flex !important; }
          .cd-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 479px) {
          .cd-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .charity-edit-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
}
