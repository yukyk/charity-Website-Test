import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
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

export default function CharityCard({ charity, showActions = false }) {
  const navigate = useNavigate();
  const {
    id, name, category, description,
    location, goalAmount, raisedAmount, logoUrl,
  } = charity;

  const raised = parseFloat(raisedAmount || 0);
  const goal   = parseFloat(goalAmount   || 0);

  return (
    <motion.div
      className="card"
      style={{ overflow: 'hidden', padding: 0 }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      transition={{ duration: 0.22 }}
    >
      {/* Clickable card body → charity detail page */}
      <Link to={`/charities/${id}`} style={{ display: 'block', color: 'inherit' }}>
        {/* Hero image / gradient */}
        <div style={{
          height: 176,
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
              {name[0]}
            </span>
          )}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <Badge variant={categoryVariant[category] || 'neutral'}>{category}</Badge>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: showActions ? '20px 24px 16px' : '20px 24px 24px' }}>
          <h3 style={{ marginBottom: 8, fontSize: 17 }}>{name}</h3>

          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 10 }}>
              <MapPin size={13} />
              <span>{location}</span>
            </div>
          )}

          {description && (
            <p style={{
              color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6,
              marginBottom: goal > 0 ? 16 : 0,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {truncate(description, 120)}
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

      {/* Action buttons — outside the Link to avoid nested anchors */}
      {showActions && (
        <div style={{
          padding: '0 24px 20px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 8,
        }}>
          <Button
            variant="accent"
            size="sm"
            fullWidth
            onClick={() => navigate(`/donate/${id}`)}
          >
            Donate Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/charities/${id}`)}
          >
            Details
          </Button>
        </div>
      )}
    </motion.div>
  );
}
