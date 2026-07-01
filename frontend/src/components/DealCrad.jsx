import React from 'react';
import { useNavigate } from 'react-router-dom';

function formatKES(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString()} KES`;
}


export default function DealCrad({ deal }) {
  const navigate = useNavigate();
  const id = deal?._id || deal?.id || deal?.deal_id;

  const title = deal?.title || deal?.name || 'Untitled deal';
  const description = deal?.description || '';
  const status = deal?.status?.toLowerCase() || 'open';

  // Show status badge for open deals (investor view)
  const showBadge = status === 'open';

  return (
    <div className="card" style={{ flex: '0 0 320px', minWidth: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>{title}</h3>
        {showBadge && (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 800,
              background: 'rgba(46,204,113,0.15)',
              color: '#2ecc71',
              textTransform: 'uppercase',
            }}
          >
            Open
          </span>
        )}
      </div>
      <div style={{ color: 'var(--muted)', minHeight: 44 }}>
        {description ? (description.length > 90 ? description.slice(0, 90) + '…' : description) : 'No description.'}
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Goal</div>
        <div style={{ fontWeight: 800 }}>
          {formatKES(deal?.fixed_amount ?? deal?.goal ?? deal?.target ?? deal?.amount_required)}

        </div>
      </div>

      {deal?.expected_return ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Expected Return</div>
          <div style={{ fontWeight: 800, color: '#2ecc71' }}>
            {(() => {
              const raw = deal?.expected_return;
              const cleaned = String(raw ?? '').replace('%', '');
              const n = Number(cleaned);
              return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-';
            })()}
          </div>
        </div>
      ) : null}


      <div style={{ height: 14 }} />

      <button
        className="btn primary"
        onClick={() => navigate(`/deal/${id}`)}
        disabled={!id}
        style={{ width: '100%' }}
      >
        Accept & Invest
      </button>
    </div>
  );
}


