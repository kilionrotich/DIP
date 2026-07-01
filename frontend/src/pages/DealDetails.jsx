import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDealById } from '../services/dealService';
import { commitInvestment, getInvestmentsByDeal, verifyInvestment } from '../services/investmentService';
import InvestmentForm from '../components/InvestmentForm';
import api from '../services/api';

function formatKES(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString()} KES`;
}

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'rgba(241,196,15,0.15)', color: '#f1c40f', label: 'Pending' },
    active: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', label: 'Approved' },
    completed: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6', label: 'Completed' },
  };
  const s = styles[status?.toLowerCase()] || styles.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 800,
        background: s.bg,
        color: s.color,
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

export default function DealDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const [deal, setDeal] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);

  // Commit flow
  const [commitStatus, setCommitStatus] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Admin verification
  const [verifying, setVerifying] = useState(false);

  async function fetchInvestments() {
    setInvestmentsLoading(true);
    try {
      const res = await getInvestmentsByDeal(id);
      setInvestments(Array.isArray(res) ? res : res?.investments || []);
    } catch (e) {
      console.error('Failed to load investments:', e);
    } finally {
      setInvestmentsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getDealById(id)
      .then((res) => {
        if (!mounted) return;
        setDeal(res?.deal || res);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load deal');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (deal && (isAdmin || submitted)) {
      fetchInvestments();
    }
  }, [deal, isAdmin, submitted]);

  const title = useMemo(() => {
    return deal?.title || deal?.name || `Deal ${deal?._id || deal?.id || ''}`;
  }, [deal]);

  const isOpen = deal?.status?.toLowerCase() === 'open';

  async function onCommit(payload) {
    setCommitStatus(null);
    setSubmitted(false);
    try {
      await commitInvestment(id, payload);
      setSubmitted(true);
      setCommitStatus({ type: 'ok', text: 'Investment submitted successfully. Awaiting verification.' });
      // Refresh investments after commit
      setTimeout(() => fetchInvestments(), 500);
    } catch (e) {
      setCommitStatus({ type: 'err', text: e?.response?.data?.message || e?.message || 'Failed to commit investment' });
    }
  }

  async function handleVerify(investment) {
    setVerifying(true);
    try {
      const invId = investment._id || investment.investment_id || investment.id;
      await verifyInvestment(invId);
      setCommitStatus({ type: 'ok', text: 'Investment verified and activated!' });
      await fetchInvestments();
    } catch (e) {
      setCommitStatus({ type: 'err', text: e?.response?.data?.message || e?.message || 'Failed to verify' });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="container">
      <button className="btn" onClick={() => navigate(-1)}>← Back</button>

      <div style={{ height: 14 }} />

      {loading ? <div>Loading deal...</div> : null}
      {error ? <div className="alert err">{error}</div> : null}

      {deal ? (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="card" style={{ flex: 2, minWidth: 320 }}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: 'var(--muted)' }}>{deal?.description || 'No description available.'}</p>

            <div style={{ height: 12 }} />

            <div className="row">
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Investment Goal</div>
                <div style={{ fontWeight: 800 }}>{formatKES(deal?.fixed_amount || deal?.goal || deal?.target)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Status</div>
                <div style={{ fontWeight: 800, textTransform: 'capitalize' }}>{deal?.status || '-'}</div>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="row">
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Required Investment</div>
                <div style={{ fontWeight: 900 }}>{formatKES(deal?.fixed_amount)}</div>
              </div>
              {deal?.expected_return ? (
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>Expected Return</div>
                  <div style={{ fontWeight: 900, color: '#2ecc71' }}>{deal.expected_return}%</div>
                </div>
              ) : null}
            </div>

            <div style={{ height: 18 }} />

            {/* Investment Form - Only show for investors on approved deals */}
            {!isAdmin && isOpen && (
              <>
                <h3 style={{ marginTop: 0 }}>Commit Investment</h3>
                {commitStatus?.type === 'ok' && <div className="alert ok">{commitStatus.text}</div>}
                {commitStatus?.type === 'err' && <div className="alert err">{commitStatus.text}</div>}
                {submitted ? (
                  <div style={{ padding: 16, background: 'rgba(46,204,113,0.1)', borderRadius: 8 }}>
                    <p style={{ color: '#2ecc71', fontWeight: 800 }}>Investment Submitted</p>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                      Your investment is pending verification. You'll be notified once an Admin verifies it.
                    </p>
                  </div>
                ) : (
                  <InvestmentForm
                    dealId={id}
                    user={user}
                    fixedAmount={deal?.fixed_amount}
                    onSubmit={onCommit}
                    disabled={!isOpen}
                  />
                )}
              </>
            )}

            {/* Admin sees edit message if not approved */}
            {!isAdmin && !isOpen && (
              <div style={{ padding: 16, background: 'rgba(241,196,15,0.1)', borderRadius: 8 }}>
                <p style={{ color: '#f1c40f', fontWeight: 800 }}>Deal Not Available</p>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  This deal is not yet approved for investment. Please check back later.
                </p>
              </div>
            )}
          </div>

          {/* Investors / Commitments */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Commitments ({investments.length})</h3>

            {commitStatus?.type === 'ok' && <div className="alert ok">{commitStatus.text}</div>}
            {commitStatus?.type === 'err' && <div className="alert err">{commitStatus.text}</div>}

            {investmentsLoading ? (
              <div style={{ color: 'var(--muted)' }}>Loading commitments...</div>
            ) : investments.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {isAdmin
                  ? 'No investors have committed to this deal yet.'
                  : 'No commitments yet. Be the first to invest!'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {investments.map((inv) => (
                  <div
                    key={inv._id || inv.investment_id || inv.id}
                    style={{
                      padding: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      background: '#0b1220',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 800 }}>{inv.investor?.username || inv.investor?.email || 'Investor'}</div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {formatKES(inv.amount_invested || inv.amount)}
                    </div>
                    {(inv.mpesa_code || inv.transaction_id) && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        Ref: {inv.mpesa_code || inv.transaction_id}
                      </div>
                    )}
                    {/* Admin verify button */}
                    {isAdmin && inv.status === 'pending' && (
                      <button
                        className="btn primary"
                        onClick={() => handleVerify(inv)}
                        disabled={verifying}
                        style={{ marginTop: 10, width: '100%' }}
                      >
                        {verifying ? 'Approving...' : 'Approve Investor'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}