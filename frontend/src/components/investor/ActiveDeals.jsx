import React from 'react';

export default function ActiveDeals({ investments, loading }) {
  if (loading) return <div className="alert">Loading active deals…</div>;

  const rows = Array.isArray(investments) ? investments : [];

  if (rows.length === 0) {
    return <div style={{ color: 'var(--muted)' }}>No active deals yet.</div>;
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Active Deals</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Deal
              </th>
              <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Status
              </th>
              <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Amount
              </th>
              <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id || inv.investment_id}>
                <td style={{ padding: '10px 6px' }}>#{inv.deal_id}</td>
                <td style={{ padding: '10px 6px' }}>
                  <StatusPill status={inv.status} />
                </td>
                <td style={{ padding: '10px 6px' }}>{inv.amount_invested ?? inv.amount ?? 0}</td>
                <td style={{ padding: '10px 6px' }}>{inv.profit ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase();
  let color = 'rgba(255,255,255,0.18)';
  let textColor = 'var(--text)';

  if (['verified', 'active', 'completed', 'funded'].includes(s)) {
    color = 'rgba(46,204,113,0.18)';
    textColor = 'var(--ok)';
  } else if (['pending'].includes(s)) {
    color = 'rgba(91,140,255,0.18)';
    textColor = 'var(--primary)';
  } else if (['closed', 'refunded'].includes(s)) {
    color = 'rgba(255,77,77,0.18)';
    textColor = 'var(--danger)';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        background: color,
        color: textColor,
        border: '1px solid rgba(255,255,255,0.08)',
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {status || '—'}
    </span>
  );
}

