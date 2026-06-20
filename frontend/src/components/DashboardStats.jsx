import React from 'react';

export default function DashboardStats({ loading, stats, variant }) {
  if (loading) {
    return (
      <div className="card">
        <div style={{ color: 'var(--muted)' }}>Loading stats...</div>
      </div>
    );
  }

  const items = [
    { label: 'Total Invested', value: stats?.totalInvested ?? 0 },
    { label: 'Profit', value: stats?.profitValue ?? 0 },
    { label: 'Investments', value: stats?.investmentsCount ?? 0 },
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {items.map((it) => (
          <div
            key={it.label}
            style={{ flex: 1, minWidth: 200, padding: 10, borderRight: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{it.label}</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>{Number(it.value).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {variant === 'admin' ? (
        <div style={{ color: 'var(--muted)', marginTop: 10, fontSize: 13 }}>
          Admin stats will be wired after backend endpoints are confirmed.
        </div>
      ) : null}
    </div>
  );
}



