import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import DashboardStats from '../components/DashboardStats';
import { getActiveDeals, cancelDeal, updateDeal } from '../services/dealService';
import { getInvestors } from '../services/investorService';
import { getRecentAuditLogs } from '../services/auditService';
import AdminDealCard from '../components/AdminDealCard';
import { getInboxMessages, sendMessage } from '../services/messageService';


function Avatar({ name, role, photoUrl }) {
  const initials = useMemo(() => {
    if (photoUrl) return '';
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'A';
    return (parts[0][0] || '') + (parts[1]?.[0] || '');
  }, [name, photoUrl]);

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.16)',
        background: photoUrl
          ? `url(${photoUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(91,140,255,0.35), rgba(255,77,77,0.15))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
      }}
      title={`${name || 'Admin'} (${role || ''})`}
    >
      {photoUrl ? null : initials.toUpperCase()}
    </div>
  );
}

function SidebarSectionTitle({ children }) {
  return <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 800 }}>{children}</div>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active-deals');

  // Deal form state
  const [dealForm, setDealForm] = useState({
    title: '',
    description: '',
    amount_required: '',
    fixed_amount: '',
    expected_return: '',
    start_date: '',
    end_date: '',
  });

  // Investment form state
  const [investmentForm, setInvestmentForm] = useState({
    investor_id: '',
    deal_id: '',
    amount_invested: '',
  });

  // Profit form state
  const [profitForm, setProfitForm] = useState({
    investment_id: '',
    profit: '',
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Active deals section
  const [activeDeals, setActiveDeals] = useState([]);
  const [activeDealsLoading, setActiveDealsLoading] = useState(false);
  const [activeDealsError, setActiveDealsError] = useState(null);

  const [editingDeal, setEditingDeal] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    amount_required: '',
    fixed_amount: '',
    expected_return: '',
    start_date: '',
    end_date: '',
  });


  // Investors section
  const [investors, setInvestors] = useState([]);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investorsError, setInvestorsError] = useState(null);
  const [investorQuery, setInvestorQuery] = useState('');

  // Messaging
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Activity Log
  const [auditLogs, setAuditLogs] = useState([]);

  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState(null);

  async function fetchActiveDeals() {
    setActiveDealsLoading(true);
    setActiveDealsError(null);
    try {
      const res = await getActiveDeals();
      setActiveDeals(Array.isArray(res) ? res : res?.deals || []);
    } catch (e) {
      setActiveDealsError(e?.response?.data?.error || e?.message || 'Failed to load active deals');
    } finally {
      setActiveDealsLoading(false);
    }
  }

  async function fetchInvestors() {
    setInvestorsLoading(true);
    setInvestorsError(null);
    try {
      const res = await getInvestors();
      setInvestors(Array.isArray(res?.investors) ? res.investors : res || []);
    } catch (e) {
      setInvestorsError(e?.response?.data?.error || e?.message || 'Failed to load investors');
    } finally {
      setInvestorsLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    try {
      const res = await getRecentAuditLogs({ limit: 20 });
      setAuditLogs(Array.isArray(res?.logs) ? res.logs : res || []);
    } catch (e) {
      setAuditLogsError(e?.response?.data?.error || e?.message || 'Failed to load activity log');
    } finally {
      setAuditLogsLoading(false);
    }
  }

  useEffect(() => {
    fetchActiveDeals();
  }, []);

  useEffect(() => {
    if (activeTab === 'investors' && !investorsLoading && investors.length === 0) fetchInvestors();
    if (activeTab === 'activity-log' && !auditLogsLoading && auditLogs.length === 0) fetchAuditLogs();
    if (activeTab === 'messages') {
      // inbox is handled by InboxSupport component in this repo
      // avoid calling undefined loadInbox() which can crash render
    }
  }, [activeTab]);



  useEffect(() => {
    if (!editingDeal) return;
    setEditForm({
      title: editingDeal.title ?? '',
      description: editingDeal.description ?? '',
      amount_required: editingDeal.amount_required ?? '',
      expected_return: editingDeal.expected_return ?? '',
      start_date: editingDeal.start_date
        ? new Date(editingDeal.start_date).toISOString().slice(0, 10)
        : '',
      end_date: editingDeal.end_date
        ? new Date(editingDeal.end_date).toISOString().slice(0, 10)
        : '',
    });
  }, [editingDeal]);

  async function onCancelDeal(deal) {
    setMessage(null);
    setError(null);
    try {
      const dealId = deal?._id ?? deal?.deal_id ?? deal?.id;
      await cancelDeal(dealId, { hardDelete: false });
      setMessage('Deal cancelled successfully');
      setEditingDeal(null);
      await fetchActiveDeals();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to cancel deal');
    }
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const dealId = editingDeal?._id || editingDeal?.deal_id || editingDeal?.id;
      // Ensure fixed_amount is always sent when saving edits
      const payload = { ...editForm, fixed_amount: editForm.fixed_amount ?? editingDeal?.fixed_amount };
      await updateDeal(dealId, payload);
      setMessage('Deal updated successfully');
      setEditingDeal(null);
      await fetchActiveDeals();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update deal');
    }
  }

  async function handleDealSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.post('/api/deals', dealForm);
      setMessage('Deal created successfully!');
      setDealForm({
        title: '',
        description: '',
        amount_required: '',
        expected_return: '',
        start_date: '',
        end_date: '',
      });
      await fetchActiveDeals();
      setActiveTab('active-deals');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating deal');
    }
  }


  const profile = {
    name: user?.username || user?.name || 'Admin',
    email: user?.email || user?.user?.email,
    role: user?.role,
    photoUrl: user?.photoUrl,
  };

  const filteredInvestors = useMemo(() => {
    const q = (investorQuery || '').trim().toLowerCase();
    if (!q) return investors;
    return investors.filter((inv) => {
      const name = inv.username?.toLowerCase?.() || '';
      const email = inv.email?.toLowerCase?.() || '';
      return name.includes(q) || email.includes(q) || String(inv.user_id || '').includes(q);
    });
  }, [investors, investorQuery]);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', padding: '0 8px' }}>
      {/* Sidebar */}

      <div
        style={{
          width: sidebarExpanded ? 'calc(50vw - 8px)' : 88,
          transition: 'width 160ms ease',
          position: 'sticky',
          top: 16,
          alignSelf: 'flex-start',
          padding: 16,
          background: 'var(--card)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          height: 'calc(100vh - 32px)',
          overflow: 'auto',
          maxWidth: 480,
          minWidth: sidebarExpanded ? 260 : 88,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarExpanded ? 'space-between' : 'center' }}>
          <button
            type="button"
            onClick={() => setSidebarExpanded((s) => !s)}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="Toggle profile"
          >
            <Avatar name={profile.name} role={profile.role} photoUrl={profile.photoUrl} />
          </button>
          {sidebarExpanded ? (
            <button className="btn" type="button" onClick={() => setSidebarExpanded(false)}>
              Collapse
            </button>
          ) : null}
        </div>

        {sidebarExpanded ? (
          <div style={{ marginTop: 14 }}>
            <div className="card" style={{ padding: 14, marginBottom: 12 }}>
              <SidebarSectionTitle>Profile Overview</SidebarSectionTitle>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{profile.name}</div>
              <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{profile.email}</div>
              <div style={{ color: 'var(--muted)' }}>role: {profile.role}</div>
              <div style={{ color: 'var(--muted)', marginTop: 10, fontSize: 13 }}>profile picture (coming soon)</div>
            </div>

            <div className="card" style={{ padding: 14, marginBottom: 12 }}>
              <SidebarSectionTitle>Account Settings</SidebarSectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn" type="button" onClick={() => setActiveTab('account-settings')}>
                  Profile Overview
                </button>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                Account settings controls are not wired yet.
              </div>
            </div>



            <div className="card" style={{ padding: 14, marginBottom: 12 }}>

              <SidebarSectionTitle>Activity Log</SidebarSectionTitle>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setActiveTab('activity-log');
                }}
                style={{ width: '100%' }}
              >
                View recent actions
              </button>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                deal creation, cancellations, investor approvals
              </div>
            </div>

            <button
              className="btn danger"
              type="button"
              style={{ width: '100%' }}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        ) : null}

        {/* Navigation */}
        <div style={{ marginTop: 14 }}>
          <SidebarSectionTitle>Navigation</SidebarSectionTitle>
          {[ 
            { key: 'active-deals', label: 'Active Deals' },
            { key: 'create-deal', label: 'Create Deal' },
            { key: 'messages', label: 'Messages' },
            { key: 'investors', label: 'Investors' },
            { key: 'reports', label: 'Reports' },
          ].map((item) => (


            <button
              key={item.key}
              type="button"
              className="btn"
              onClick={() => setActiveTab(item.key)}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: 10,
                background: activeTab === item.key ? 'rgba(91,140,255,0.18)' : undefined,
                borderColor: activeTab === item.key ? 'rgba(91,140,255,0.6)' : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ display: 'inline-flex', width: 18, justifyContent: 'center' }}>•</span>
              {sidebarExpanded ? item.label : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div
        className="container"
        style={{
          padding: 0,
          maxWidth: 820,
          transition: 'opacity 180ms ease, transform 180ms ease',
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
        }}
      >

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert err">{error}</div> : null}

        <div style={{ height: 12 }} />

        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <div style={{ color: 'var(--muted)' }}>{profile.email}</div>
          </div>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
        </div>

        <div style={{ height: 16 }} />

        <DashboardStats
          stats={{ totalInvested: 0, profitValue: 0, investmentsCount: 0 }}
          variant="admin"
        />

        <div style={{ height: 18 }} />

        {activeTab === 'active-deals' ? (

          <>
            <h3 style={{ margin: '0 0 12px 0' }}>Active Deals</h3>
            {activeDealsError ? <div className="alert err">{activeDealsError}</div> : null}
            {activeDealsLoading ? <div>Loading active deals...</div> : null}

            <div className="row">
              {activeDeals.map((d) => (
                <AdminDealCard
                  key={d.deal_id || d._id || d.id}
                  deal={d}
                  onCancel={onCancelDeal}
                  onEdit={(deal) => setEditingDeal(deal)}
                />
              ))}
            </div>

            {!activeDealsLoading && activeDeals.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No active deals.</div>
            ) : null}

            {editingDeal ? (
              <div style={{ height: 18 }} />
            ) : null}

            {editingDeal ? (
              <div className="card" style={{ background: '#fff', color: '#000' }}>
                <h3>Edit Deal</h3>
                {error ? <div className="alert err">{error}</div> : null}

                <form onSubmit={onSaveEdit}>
                  <input
                    placeholder="Project name"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />

                  <textarea
                    placeholder="Description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />

                  {/* fixed amount is editable only by Admin */}


                  <input
                    type="number"
                    placeholder="Goal (KES)"
                    value={editForm.fixed_amount ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, fixed_amount: e.target.value })}
                    step="0.01"
                    min="0"
                  />


                  <input
                    type="date"
                    placeholder="Start Date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />

                  <input
                    type="date"
                    placeholder="End Date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  />

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                    <button className="btn primary" type="submit">
                      Save
                    </button>
                    <button className="btn" type="button" onClick={() => setEditingDeal(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

          </>
        ) : null}

        {activeTab === 'create-deal' ? (
          <div className="card">
            <h3>Create Deal</h3>
              <form onSubmit={handleDealSubmit}>
              <input
                placeholder="Title"
                value={dealForm.title}
                onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={dealForm.description}
                onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Goal (KES)"
                value={dealForm.fixed_amount}
                onChange={(e) => setDealForm({ ...dealForm, fixed_amount: e.target.value })}
                required
                step="0.01"
                min="0"
              />
              <input
                type="number"
                placeholder="Expected Return"
                value={dealForm.expected_return}
                onChange={(e) => setDealForm({ ...dealForm, expected_return: e.target.value })}
              />
              <input
                type="date"
                placeholder="Start Date"
                value={dealForm.start_date}
                onChange={(e) => setDealForm({ ...dealForm, start_date: e.target.value })}
              />
              <input
                type="date"
                placeholder="End Date"
                value={dealForm.end_date}
                onChange={(e) => setDealForm({ ...dealForm, end_date: e.target.value })}
              />

              <button type="submit" className="btn primary" style={{ width: '100%', marginTop: 12 }}>
                Create Deal
              </button>
            </form>
          </div>
        ) : null}

        {activeTab === 'investors' ? (
          <>
            <h3 style={{ margin: '0 0 12px 0' }}>Investors</h3>
            <div className="card" style={{ marginBottom: 12 }}>
              <input
                className="input"
                placeholder="Search investors by name/email/user id"
                value={investorQuery}
                onChange={(e) => setInvestorQuery(e.target.value)}
              />
            </div>

            {investorsError ? <div className="alert err">{investorsError}</div> : null}
            {investorsLoading ? <div>Loading investors...</div> : null}

            <div className="row">
              {filteredInvestors.map((inv) => (
                <div key={inv.user_id} className="card" style={{ flex: 1, minWidth: 240 }}>
                  <h4 style={{ marginTop: 0 }}>{inv.username}</h4>
                  <p style={{ wordBreak: 'break-word' }}>{inv.email}</p>
                  <p style={{ color: 'var(--muted)' }}>role: {inv.role}</p>
                </div>
              ))}
            </div>

            {!investorsLoading && filteredInvestors.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No investors found.</div>
            ) : null}
          </>
        ) : null}

        {activeTab === 'reports' ? (
          <div className="card">
            <h3>Reports</h3>
            <div style={{ color: 'var(--muted)' }}>
              Financial summaries, profit distributions, and deal performance analytics are not wired to backend yet.
            </div>

            <div style={{ height: 14 }} />

            <button className="btn" type="button" onClick={() => setActiveTab('active-deals')}>
              View Active Deals
            </button>
          </div>
        ) : null}

        {activeTab === 'messages' ? (
          <>
            <h3 style={{ margin: '0 0 12px 0' }}>Messages & Replies</h3>
            <div className="card">
              <div style={{ color: 'var(--muted)', marginBottom: 10 }}>
                Coming soon — inbox/reply backend endpoints not implemented in this repo.
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280, borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10, color: 'var(--text)' }}>Received</div>

                  {inboxLoading ? <div style={{ color: 'var(--muted)' }}>Loading inbox...</div> : null}
                  {inboxError ? <div className="alert err">{inboxError}</div> : null}
                  {!inboxLoading && (!inbox || inbox.length === 0) ? (
                    <div style={{ color: 'var(--muted)' }}>No messages yet.</div>
                  ) : null}

                  {(inbox || []).slice(0, 10).map((m) => (
                    <div
                      key={m.message_id || m.id}
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{m.sender?.username || m.sender?.email || 'Investor'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 6, fontWeight: 700 }}>{m.subject || 'No subject'}</div>
                      <div style={{ color: 'var(--muted)', marginTop: 4, lineHeight: 1.35 }}>{m.body}</div>

                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setSelectedMessage(m)}
                          style={{ padding: '8px 10px' }}
                        >
                          Reply to this
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10, color: 'var(--text)' }}>Reply</div>

                  {selectedMessage ? (
                    <>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 10 }}>
                        Replying to: <b>{selectedMessage.sender?.username || selectedMessage.sender?.email || 'Investor'}</b>
                      </div>

                      <textarea
                        className="input"
                        rows={4}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Type your reply…"
                        style={{ resize: 'vertical' }}
                      />
                      <div style={{ height: 12 }} />
                      <button
                        className="btn primary"
                        type="button"
                        onClick={async () => {
                          try {
                            setSendingReply(true);
                            setError(null);
                            if (!selectedMessage) throw new Error('Select a message');
                            if (!replyBody.trim()) throw new Error('Reply is required');

                            await sendMessage({
                              receiver_id:
                                selectedMessage.sender_id ?? selectedMessage.sender?.user_id,
                              subject: 'Re: ' + (selectedMessage.subject || ''),
                              body: replyBody,
                            });

                            setReplyBody('');
                            setSelectedMessage(null);
                          } catch (e) {
                            setError(e?.response?.data?.error || e?.message || 'Failed to send reply');
                          } finally {
                            setSendingReply(false);
                          }
                        }}
                        disabled={sendingReply || !replyBody.trim()}
                      >
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                        Saved. Inbox reply endpoints may be implemented separately.
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--muted)' }}>Select a message to reply.</div>
                  )}
                </div>

              </div>
            </div>
          </>
        ) : null}

        {activeTab === 'activity-log' ? (

          <>
            <h3 style={{ margin: '0 0 12px 0' }}>Activity Log</h3>
            {auditLogsError ? <div className="alert err">{auditLogsError}</div> : null}
            {auditLogsLoading ? <div>Loading activity...</div> : null}
            <div className="card">
              {auditLogs.map((l) => (
                <div key={l.log_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontWeight: 800 }}>{l.action}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}
                  </div>
                </div>
              ))}
              {!auditLogsLoading && auditLogs.length === 0 ? <div style={{ color: 'var(--muted)' }}>No recent logs.</div> : null}
            </div>
          </>
        ) : null}

        <div style={{ height: 18 }} />

        <div className="card">
          <h3>Record Investment</h3>
          <form onSubmit={handleInvestmentSubmit}>
            <input
              placeholder="Investor ID"
              value={investmentForm.investor_id}
              onChange={(e) => setInvestmentForm({ ...investmentForm, investor_id: e.target.value })}
            />
            <input
              placeholder="Deal ID"
              value={investmentForm.deal_id}
              onChange={(e) => setInvestmentForm({ ...investmentForm, deal_id: e.target.value })}
            />
            <input
              type="number"
              placeholder="Amount Invested"
              value={investmentForm.amount_invested}
              onChange={(e) => setInvestmentForm({ ...investmentForm, amount_invested: e.target.value })}
            />
            <button type="submit">Record Investment</button>
          </form>
        </div>

        <div style={{ height: 18 }} />
        <div className="card">
          <h3>Update Profit</h3>
          <form onSubmit={handleProfitSubmit}>
            <input
              placeholder="Investment ID"
              value={profitForm.investment_id}
              onChange={(e) => setProfitForm({ ...profitForm, investment_id: e.target.value })}
            />
            <input
              type="number"
              placeholder="Profit"
              value={profitForm.profit}
              onChange={(e) => setProfitForm({ ...profitForm, profit: e.target.value })}
            />
            <button type="submit">Update Profit</button>
          </form>
        </div>
      </div>
    </div>
  );

  async function handleInvestmentSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.post('/investments', investmentForm);
      setMessage('Investment recorded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error recording investment');
    }
  }

  async function handleProfitSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.put('/profits', profitForm);
      setMessage('Profit updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profit');
    }
  }
}

