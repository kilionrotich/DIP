import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardStats from '../components/DashboardStats';
import { getActiveDeals, cancelDeal, updateDeal, approveDeal, closeDeal } from '../services/dealService';
import { getInvestors } from '../services/investorService';
import { getRecentAuditLogs } from '../services/auditService';
import AdminDealCard from '../components/AdminDealCard';
import { getInboxMessages, sendMessage } from '../services/messageService';
import { getInvestments, verifyInvestment, updateProfit } from '../services/investmentService';
import '../styles/adminSidebar.css';

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

  function navigateAndCollapse(tabKey) {
    setActiveTab(tabKey);
    setSidebarExpanded(false);
  }


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

  // Investments state (for verifying pending investments)
  const [investments, setInvestments] = useState([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [investmentsError, setInvestmentsError] = useState(null);
  const [verifyingInvest, setVerifyingInvest] = useState(null);
  const [investorQuery, setInvestorQuery] = useState('');

  // Messaging
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  async function fetchInbox() {
    setInboxLoading(true);
    setInboxError(null);
    try {
      // Current UI uses inbox for the admin in AdminDashboard
      const res = await getInboxMessages({});
      setInbox(Array.isArray(res) ? res : res || []);
    } catch (e) {
      setInboxError(e?.response?.data?.error || e?.message || 'Failed to load inbox');
    } finally {
      setInboxLoading(false);
    }
  }


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

  async function fetchInvestments() {
    setInvestmentsLoading(true);
    setInvestmentsError(null);
    try {
      const res = await getInvestments();
      setInvestments(Array.isArray(res?.investments) ? res.investments : res || []);
    } catch (e) {
      setInvestmentsError(e?.response?.data?.error || e?.message || 'Failed to load investments');
    } finally {
      setInvestmentsLoading(false);
    }
  }

  async function handleVerifyInvestment(inv) {
    setVerifyingInvest(inv._id || inv.investment_id || inv.id);
    setMessage(null);
    setError(null);
    try {
      const invId = inv._id || inv.investment_id || inv.id;
      await verifyInvestment(invId);
      setMessage('Investment verified and activated!');
      await fetchInvestments();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to verify investment');
    } finally {
      setVerifyingInvest(null);
    }
  }

  useEffect(() => {
    fetchActiveDeals();
  }, []);

  useEffect(() => {
    if (activeTab === 'investors' && !investorsLoading && investors.length === 0) fetchInvestors();
    if (activeTab === 'activity-log' && !auditLogsLoading && auditLogs.length === 0) fetchAuditLogs();
    if (activeTab === 'messages' && !inboxLoading && inbox.length === 0) fetchInbox();
    if (activeTab === 'investments' && !investmentsLoading && investments.length === 0) fetchInvestments();
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
      const fixedAmountNum =
        editForm.fixed_amount === '' || editForm.fixed_amount == null
          ? Number(editingDeal?.fixed_amount)
          : Number(editForm.fixed_amount);

      if (!Number.isFinite(fixedAmountNum) || fixedAmountNum <= 0) {
        throw new Error('Goal (fixed_amount) must be a valid number greater than 0');
      }

      const payload = {
        ...editForm,
        fixed_amount: fixedAmountNum,
        expected_return:
          editForm.expected_return === '' || editForm.expected_return == null
            ? editingDeal?.expected_return
            : Number(editForm.expected_return),
      };
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
      // Ensure fixed_amount is sent as a numeric value (no formatted strings)
      const fixedAmountNum = dealForm.fixed_amount === '' ? undefined : Number(dealForm.fixed_amount);
      if (!Number.isFinite(fixedAmountNum) || fixedAmountNum <= 0) {
        throw new Error('Goal (fixed_amount) must be a valid number greater than 0');
      }

      const expectedReturnNum =
        dealForm.expected_return === '' || dealForm.expected_return == null
          ? undefined
          : Number(dealForm.expected_return);

      const payload = {
        ...dealForm,
        amount_required: dealForm.amount_required === '' || dealForm.amount_required == null ? fixedAmountNum : Number(dealForm.amount_required),
        fixed_amount: fixedAmountNum,
        expected_return:
          expectedReturnNum == null || !Number.isFinite(expectedReturnNum) ? undefined : expectedReturnNum,
      };


      await api.post('/api/deals', payload);

      setMessage('Deal created successfully!');
      setDealForm({
        title: '',
        description: '',
        amount_required: '',
        fixed_amount: '',
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
      {/* Mobile overlay & sidebar */}
      <div className="admin-sidebar-wrapper">
        <button
          type="button"
          className="admin-sidebar-avatar"
          onClick={() => setSidebarExpanded(true)}
          aria-label="Open admin menu"
        >
          <div className="sidebar-profile-breath">
            <Avatar name={profile.name} role={profile.role} photoUrl={profile.photoUrl} />
          </div>
        </button>

        {sidebarExpanded ? <div className="admin-sidebar-overlay" onClick={() => setSidebarExpanded(false)} /> : null}

        <aside className={`admin-sidebar ${sidebarExpanded ? 'open' : ''}`} aria-hidden={!sidebarExpanded}>
          <div className="admin-sidebar-header">
            <div style={{ width: 1, height: 1, overflow: 'hidden' }}> </div>
            <button className="admin-sidebar-close" type="button" onClick={() => setSidebarExpanded(false)} aria-label="Close menu">
              ✕
            </button>
          </div>


          <div className="admin-sidebar-scroll">
            <div className="card" style={{ padding: 14, marginBottom: 12 }}>
              <SidebarSectionTitle>Profile Overview</SidebarSectionTitle>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{profile.name}</div>
              <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{profile.email}</div>
              <div style={{ color: 'var(--muted)' }}>role: {profile.role}</div>
              <div style={{ color: 'var(--muted)', marginTop: 10, fontSize: 13 }}>profile picture (coming soon)</div>
            </div>

            <div className="card" style={{ padding: 14, marginBottom: 12 }}>
              <SidebarSectionTitle>Activity Log</SidebarSectionTitle>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setActiveTab('activity-log');
                  setSidebarExpanded(false);
                }}
                style={{ width: '100%' }}
              >
                View recent actions
              </button>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                deal creation, cancellations, investor approvals
              </div>
            </div>

            <button className="btn danger" type="button" style={{ width: '100%' }} onClick={logout}>
              Logout
            </button>

            <div style={{ marginTop: 14 }}>
              <SidebarSectionTitle>Navigation</SidebarSectionTitle>
              {[
                { key: 'active-deals', label: 'Profile Overview' },
                { key: 'activity-log', label: 'Activity Log' },
                { key: 'active-deals', label: 'Active Deals' },
                { key: 'create-deal', label: 'Create Deal' },
                { key: 'messages', label: 'Messages' },
                { key: 'investors', label: 'Investors' },
                { key: 'investments', label: 'Investments' },
              ].map((item, idx) => (
                <button
                  key={`${item.key}-${idx}`}
                  type="button"
                  className="btn"
                  onClick={() => navigateAndCollapse(item.key)}
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
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Main panel */}
      <div
        className="container"
        style={{
          padding: 0,
          maxWidth: 820,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          display: sidebarExpanded ? 'none' : 'block',
          paddingTop: 84,
        }}
      >
        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert err">{error}</div> : null}


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
                inputMode="decimal"
                placeholder="Goal (KES)"
                value={dealForm.fixed_amount}
                onChange={(e) => setDealForm({ ...dealForm, fixed_amount: e.target.value })}
                required
                step="0.01"
                min="0"
              />
              <input
                type="number"
                inputMode="decimal"
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

        {activeTab === 'investments' ? (
          <div>
            <h3 style={{ margin: '0 0 12px 0' }}>Investments</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
              Verify pending investments to activate them. Each investment must be approved individually.
            </p>

            {message && <div className="alert ok">{message}</div>}
            {error && <div className="alert err">{error}</div>}

            {investmentsLoading ? <div style={{ color: 'var(--muted)' }}>Loading investments...</div> : null}
            {investmentsError ? <div className="alert err">{investmentsError}</div> : null}

            {!investmentsLoading && investments.length === 0 ? (
              <div className="card">
                <div style={{ color: 'var(--muted)' }}>No investments found.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {investments.map((inv) => {
                  const invId = inv._id || inv.investment_id || inv.id;
                  const isPending = inv.status === 'pending';
                  return (
                    <div
                      key={invId}
                      className="card"
                      style={{ padding: 14 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 800 }}>
                          {inv.investor?.username || inv.investor?.email || 'Investor'}
                        </div>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            background: isPending ? 'rgba(241,196,15,0.15)' : 'rgba(46,204,113,0.15)',
                            color: isPending ? '#f1c40f' : '#2ecc71',
                            textTransform: 'uppercase',
                          }}
                        >
                          {inv.status || 'pending'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
                        Deal: {inv.deal?.title || inv.deal_id || 'N/A'}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
                        Amount: {Number(inv.amount_invested || inv.amount || 0).toLocaleString()} KES
                      </div>
                      {inv.transaction_id && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                          Ref: {inv.transaction_id}
                        </div>
                      )}
                      {isPending && (
                        <button
                          className="btn primary"
                          onClick={() => handleVerifyInvestment(inv)}
                          disabled={verifyingInvest === invId}
                          style={{ width: '100%' }}
                        >
                          {verifyingInvest === invId ? 'Verifying...' : 'Verify & Activate'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

