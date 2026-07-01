import React from 'react';

export default function InvestmentHistory({ investments, loading }) {
  if (loading) return <div className="alert">Loading investment history…</div>;

  const rows = Array.isArray(investments) ? investments : [];

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Investment History</h3>
      {rows.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No past deals found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Deal</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Capital</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Profit</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Total</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Date</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Outcome</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id || inv.investment_id}>
                  {(() => {
                    const capital = Number(inv.amount_invested ?? inv.amount ?? 0);
                    const profit = Number(inv.profit ?? 0);
                    const total = capital + profit;
                    return (
                      <>
                  <td style={{ padding: '10px 6px' }}>#{inv.deal_id}</td>
                  <td style={{ padding: '10px 6px' }}>{capital.toLocaleString()} KES</td>
                  <td style={{ padding: '10px 6px' }}>{profit.toLocaleString()} KES</td>
                  <td style={{ padding: '10px 6px' }}>{total.toLocaleString()} KES</td>
                  <td style={{ padding: '10px 6px' }}>{formatDate(inv.investment_date)}</td>
                  <td style={{ padding: '10px 6px' }}>{inv.status || '—'}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <button className="btn" style={{ padding: '8px 10px' }} disabled>
                      Download
                    </button>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ height: 10 }} />
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
        Receipt/report download will be enabled once backend provides generated receipt endpoints.
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString();
}

