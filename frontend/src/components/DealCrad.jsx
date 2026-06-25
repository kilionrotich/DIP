import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DealCrad({ deal }) {
  const navigate = useNavigate();
  const id = deal?._id || deal?.id || deal?.deal_id;

  const title = deal?.title || deal?.name || 'Untitled deal';
  const description = deal?.description || '';


  return (
    <div className="card" style={{ flex: '0 0 320px', minWidth: 280 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
      <div style={{ color: 'var(--muted)', minHeight: 44 }}>
        {description ? (description.length > 90 ? description.slice(0, 90) + '…' : description) : 'No description.'}
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Goal</div>
        <div style={{ fontWeight: 800 }}>{deal?.goal || deal?.target || '-'}</div>
      </div>

      <div style={{ height: 14 }} />

      <button
        className="btn primary"
        onClick={() => navigate(`/deal/${id}`)}
        disabled={!id}
        style={{ width: '100%' }}
      >
        View Details
      </button>
    </div>
  );
}


