import React from 'react';

function formatMoney(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function InvestorKPICards({ kpis, loading }) {
  if (loading) {
    return (
      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <h4>Loading KPIs…</h4>
          <p style={{ color: 'var(--muted)' }}>Please wait</p>
        </div>
      </div>
    );
  }

  const items = [
    { label: 'Total Invested', value: kpis?.totalInvested ?? 0, kind: 'neutral' },
    { label: 'Current Value', value: kpis?.currentValue ?? 0, kind: 'neutral' },
    { label: 'ROI', value: kpis?.roi ?? 0, kind: 'profit', suffix: '%' },
    { label: 'Profits', value: kpis?.profits ?? 0, kind: 'profit' },
  ];

  return (
    <div className="dashboard-stats">
      {items.map((it) => (
        <div
          key={it.label}
          className={`dashboard-stat ${it.kind === 'profit' ? 'profit' : ''}`}
        >
          <h4>{it.label}</h4>
          <p>
            {it.label === 'ROI'
              ? `${Number(it.value ?? 0).toFixed(2)}${it.suffix || ''}`
              : formatMoney(it.value ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
}

