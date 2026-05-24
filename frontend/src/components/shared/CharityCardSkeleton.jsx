export default function CharityCardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      {/* Image hero */}
      <div className="skeleton" style={{ height: 176, borderRadius: 0 }} />

      {/* Content */}
      <div style={{ padding: '20px 24px 24px' }}>
        {/* Badge */}
        <div style={{ marginBottom: 10 }}>
          <div className="skeleton" style={{ height: 20, width: 72, borderRadius: 999 }} />
        </div>

        {/* Title */}
        <div className="skeleton" style={{ height: 20, width: '72%', marginBottom: 10 }} />

        {/* Location */}
        <div className="skeleton" style={{ height: 13, width: '44%', marginBottom: 14 }} />

        {/* Description lines */}
        <div className="skeleton" style={{ height: 13, width: '100%', marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 13, width: '85%',  marginBottom: 18 }} />

        {/* Progress bar */}
        <div className="skeleton" style={{ height: 10, borderRadius: 999, marginBottom: 10 }} />

        {/* Raised / Goal row */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 13, width: '36%' }} />
          <div className="skeleton" style={{ height: 13, width: '26%' }} />
        </div>
      </div>
    </div>
  );
}
