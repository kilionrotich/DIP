import React from 'react';
import { useNavigate } from 'react-router-dom';

function formatKES(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString()} KES`;
}

export default function AdminDealCard({ deal, onEdit, onCancel, onClose }) {
  const navigate = useNavigate();
  const id = deal?._id ?? deal?.deal_id ?? deal?.id;

  const title = deal?.title || deal?.name || 'Untitled deal';
  const description = deal?.description || '';

  const status = deal?.status?.toLowerCase() || 'open';
  const isOpen = status === 'open';
  const isApproved = status === 'approved';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';

  return (
    <div className="card" style={{ flex: '0 0 320px', minWidth: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>{title}</h3>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 800,
            background: isOpen ? 'rgba(91,140,255,0.15)' : isApproved ? 'rgba(46,204,113,0.15)' : isCancelled ? 'rgba(231,76,60,0.15)' : isCompleted ? 'rgba(155,89,182,0.15)' : 'rgba(241,196,15,0.15)',
            color: isOpen ? '#5b8cff' : isApproved ? '#2ecc71' : isCancelled ? '#e74c3c' : isCompleted ? '#9b59b6' : '#f1c40f',
            textTransform: 'uppercase',
          }}
        >
          {status}
        </span>
      </div>

      <div style={{ color: 'var(--muted)', minHeight: 44 }}>
        {description
          ? description.length > 90
            ? description.slice(0, 90) + '…'
            : description
          : 'No description.'}
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Goal</div>
        <div style={{ fontWeight: 800 }}>{formatKES(deal?.fixed_amount ?? deal?.goal ?? deal?.target ?? deal?.amount_required)}</div>
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

      <div style={{ height: 10 }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {isApproved && (
          <button
            className="btn"
            type="button"
            onClick={() => onClose?.(deal)}
            disabled={!id}
            style={{ flex: 1, minWidth: 80, background: 'rgba(155,89,182,0.15)', borderColor: 'rgba(155,89,182,0.6)' }}
          >
            Close
          </button>
        )}
        <button
          className="btn"
          type="button"
          onClick={() => onEdit?.(deal)}
          disabled={!id || !isOpen}
          style={{ flex: 1, minWidth: 80 }}
        >
          Edit
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => onCancel?.(deal)}
          disabled={!id || !isOpen}
          style={{ flex: 1, minWidth: 80, opacity: isCancelled ? 0.6 : 1 }}
          title={isOpen ? 'Cancel deal' : 'Deal is not active'}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

