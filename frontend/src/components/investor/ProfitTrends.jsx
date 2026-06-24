import React from 'react';

export default function ProfitTrends() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Profit Trends</h3>
      <div style={{ color: 'var(--muted)' }}>
        Coming soon — profit history time-series endpoint not available in this version.
      </div>
      <div style={{ height: 12 }} />
      <div
        style={{
          borderRadius: 12,
          border: '1px dashed rgba(255,255,255,0.18)',
          padding: 16,
          color: 'var(--muted)',
          minHeight: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Line chart placeholder
      </div>
    </div>
  );
}

