import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { sendMessage, getInboxMessages } from '../../services/messageService';

export default function InboxSupport() {
  const { user } = useAuth();

  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [subject, setSubject] = useState('Deal inquiry');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendMessageState, setSendMessageState] = useState(null);

  const myId = user?._id || user?.id || user?.user_id;

  async function loadInbox() {
    if (!myId) return;
    setLoading(true);
    setError(null);
    try {
      const messages = await getInboxMessages();
      setInbox(Array.isArray(messages) ? messages : []);
    } catch (e) {
      // If the endpoint is missing on the deployed backend, surface the raw message.
      setError(e?.response?.data?.error || e?.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadInbox();
    const t = setInterval(() => {
      loadInbox();
    }, 5000);
    return () => clearInterval(t);
  }, [myId]);


  async function onSubmit(e) {
    e.preventDefault();
    setSendError(null);
    setSendMessageState(null);

    if (!subject.trim()) {
      setSendError('Subject is required');
      return;
    }
    if (!body.trim()) {
      setSendError('Message body is required');
      return;
    }

    setSending(true);
    try {
      // Send message without recipient/admin params — backend routes to approved admin
      await sendMessage({ subject, body });
      setSendMessageState('Message sent.');
      setBody('');
      await loadInbox();
    } catch (e2) {
      setSendError(e2?.response?.data?.error || e2?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Communication</h3>

      {error ? <div className="alert err">{error}</div> : null}
      {sendMessageState ? <div className="alert ok">{sendMessageState}</div> : null}

      {sendError ? <div className="alert err">{sendError}</div> : null}

      <div style={{ height: 10 }} />

      <div className="row" style={{ alignItems: 'stretch' }}>
        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>
            Inbox {loading ? '(loading...)' : ''}
          </div>

          {(!inbox || inbox.length === 0) && !loading ? (
            <div style={{ color: 'var(--muted)' }}>No messages yet.</div>
          ) : null}

          {inbox && inbox.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inbox.slice(0, 10).map((m) => (
                <div key={m.message_id || m.id} style={{ paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                      {m.sender?.username || m.sender?.email || `Admin`}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', marginTop: 4, fontWeight: 700, fontSize: 13 }}>{m.subject}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 4, lineHeight: 1.35 }}>{m.body}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>Raise a Dispute / Ask</div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="label">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Message</label>
              <textarea
                className="input"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your request…"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn primary" type="submit" disabled={sending} style={{ width: '100%' }}>
              {sending ? 'Sending...' : 'Submit'}
            </button>
          </form>

          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
            Messages are automatically routed to the primary admin.
          </div>
        </div>
      </div>
    </div>
  );
}
