import React from 'react';

export default function InboxSupport() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Communication</h3>
      <div style={{ color: 'var(--muted)' }}>
        Coming soon — inbox/support and dispute flow not available in this version.
      </div>

      <div style={{ height: 14 }} />
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 260, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
          <div style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>Inbox</div>
          <div style={{ color: 'var(--muted)' }}>No messages yet.</div>
        </div>
        <div style={{ flex: 1, minWidth: 260, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
          <div style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>Raise a Dispute / Ask</div>
          <textarea className="input" rows={4} placeholder="Describe your request…" disabled style={{ resize: 'vertical' }} />
          <div style={{ height: 10 }} />
          <button className="btn" disabled>Submit</button>
        </div>
      </div>
    </div>
  );
}

