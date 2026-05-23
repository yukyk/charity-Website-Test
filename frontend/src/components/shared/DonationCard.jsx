import Badge from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const statusVariant = {
  completed: 'success',
  pending:   'warning',
  failed:    'error',
  refunded:  'neutral',
};

export default function DonationCard({ donation }) {
  const {
    amount, currency = 'INR', status,
    charityName, createdAt, message, isAnonymous,
  } = donation;

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-primary)', marginBottom: 4 }}>
            {formatCurrency(amount, currency)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: message ? 8 : 0 }}>
            to {charityName}
          </div>
          {message && (
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
              "{message}"
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <Badge variant={statusVariant[status] || 'neutral'}>{status}</Badge>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {formatDate(createdAt)}
          </span>
          {isAnonymous && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Anonymous</span>
          )}
        </div>
      </div>
    </div>
  );
}
