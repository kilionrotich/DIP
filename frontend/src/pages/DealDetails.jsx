import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDealById } from '../services/dealService';
import { commitInvestment } from '../services/investmentService';
import InvestmentForm from '../components/InvestmentForm';

export default function DealDeatails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commitSuccess, setCommitSuccess] = useState(null);
  const [commitError, setCommitError] = useState(null);

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

  const title = useMemo(() => {
    return deal?.title || deal?.name || `Deal ${deal?._id || deal?.id || ''}`;
  }, [deal]);

  async function onCommit(payload) {
    setCommitSuccess(null);
    setCommitError(null);
    try {
      await commitInvestment(id, payload);
      setCommitSuccess('Investment committed successfully');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (e) {
      setCommitError(e?.response?.data?.message || e?.message || 'Failed to commit investment');
    }
  }

  return (
    <div className="container">
      <button className="btn" onClick={() => navigate('/dashboard')}>← Back</button>

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
                <div style={{ fontWeight: 800 }}>{deal?.goal || deal?.target || '-'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Status</div>
                <div style={{ fontWeight: 800 }}>{deal?.status || '-'}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Commit Investment</h3>
            {commitSuccess ? <div className="alert ok">{commitSuccess}</div> : null}
            {commitError ? <div className="alert err">{commitError}</div> : null}

            <InvestmentForm dealId={id} user={user} onSubmit={onCommit} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

