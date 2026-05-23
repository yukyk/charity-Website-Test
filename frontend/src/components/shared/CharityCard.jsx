import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatCurrency, truncate } from '../../utils/formatters';

const categoryVariant = {
  education:   'info',
  health:      'success',
  environment: 'success',
  poverty:     'warning',
  disaster:    'error',
  animals:     'info',
  other:       'neutral',
};

export default function CharityCard({ charity }) {
  const {
    id, name, category, description,
    location, goalAmount, raisedAmount, logoUrl,
  } = charity;

  const raised = parseFloat(raisedAmount || 0);
  const goal   = parseFloat(goalAmount   || 0);

  return (
    <motion.div
      className="card"
      style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      transition={{ duration: 0.22 }}
    >
      <Link to={`/charities/${id}`} style={{ display: 'block', color: 'inherit' }}>
        {/* Hero image / gradient placeholder */}
        <div style={{
          height: 176,
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
              {name[0]}
            </span>
          )}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <Badge variant={categoryVariant[category] || 'neutral'}>{category}</Badge>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          <h3 style={{ marginBottom: 8, fontSize: 17 }}>{name}</h3>

          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 10 }}>
              <MapPin size={13} />
              <span>{location}</span>
            </div>
          )}

          {description && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              {truncate(description, 100)}
            </p>
          )}

          {goal > 0 && (
            <>
              <ProgressBar value={raised} max={goal} showPercentage={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatCurrency(raised)} raised
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  of {formatCurrency(goal)}
                </span>
              </div>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
