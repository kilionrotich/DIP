import React from 'react';
import { useNavigate } from 'react-router-dom';

function StatusPill({ status }) {
  const s = String(status || 'open').toLowerCase();
  let color = 'rgba(255,255,255,0.18)';
  let textColor = 'var(--text)';

  if (s === 'approved') {
    color = 'rgba(46,204,113,0.18)';
    textColor = 'var(--ok)';
  } else if (s === 'open') {
    color = 'rgba(91,140,255,0.18)';
    textColor = 'var(--primary)';
  } else if (s === 'completed') {
    color = 'rgba(155,89,182,0.18)';
    textColor = '#c39bd3';
  } else if (s === 'cancelled') {
    color = 'rgba(255,77,77,0.18)';
    textColor = 'var(--danger)';
  }

  const labels = {
    open: 'Active',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: color,
        color: textColor,
        border: '1px solid rgba(255,255,255,0.08)',
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {labels[s] || status || 'Active'}
    </span>
  );
}

export default function AdminDealCard({ deal, onEdit, onCancel, onApprove, onClose }) {
  const navigate = useNavigate();
  const id = deal?._id ?? deal?.deal_id ?? deal?.id;

  const title = deal?.title || deal?.name || 'Untitled deal';
  const description = deal?.description || '';

  const status = String(deal?.status || 'open').toLowerCase();
  const isOpen = status === 'open';
  const isApproved = status === 'approved';
  const isLocked = status === 'cancelled' || status === 'completed';

  return (
    <div className="card" style={{ flex: '0 0 320px', minWidth: 280, opacity: isLocked ? 0.75 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
        <StatusPill status={deal?.status} />
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
        <div style={{ fontWeight: 800 }}>{deal?.fixed_amount || deal?.amount_required || deal?.goal || deal?.target || '-'}</div>
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

      {/* Lifecycle actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {isOpen ? (
          <button
            className="btn primary"
            type="button"
            onClick={() => onApprove?.(deal)}
            disabled={!id}
            style={{ flex: 1, minWidth: 120 }}
            title="Approve deal for investor visibility"
          >
            Approve
          </button>
        ) : null}

        {isApproved ? (
          <button
            className="btn"
            type="button"
            onClick={() => onClose?.(deal)}
            disabled={!id}
            style={{ flex: 1, minWidth: 120 }}
            title="Close deal and move to history"
          >
            Close
          </button>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn"
          type="button"
          onClick={() => onEdit?.(deal)}
          disabled={!id || !isOpen}
          style={{ flex: 1, minWidth: 120 }}
          title={isOpen ? 'Edit deal' : 'Only active (unapproved) deals can be edited'}
        >
          Edit
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => onCancel?.(deal)}
          disabled={!id || isLocked}
          style={{ flex: 1, minWidth: 120 }}
          title={isLocked ? 'Deal is locked' : 'Cancel deal (locks investor side)'}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
