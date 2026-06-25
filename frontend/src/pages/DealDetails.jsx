import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDealById } from '../services/dealService';
import { commitInvestment } from '../services/investmentService';
import InvestmentForm from '../components/InvestmentForm';
import api from '../services/api';


export default function DealDeatails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // commit workflow
  const [commitStatus, setCommitStatus] = useState(null); // { type: 'ok'|'err'|'info', text }
  const [submitted, setSubmitted] = useState(false);



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
    setCommitStatus(null);
    setSubmitted(false);
    try {
      await commitInvestment(id, payload);
      setSubmitted(true);
      setCommitStatus({ type: 'ok', text: 'Investment submitted successfully. Awaiting verification.' });
      // keep user on page to show workflow
    } catch (e) {
      setCommitStatus({ type: 'err', text: e?.response?.data?.message || e?.message || 'Failed to commit investment' });
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

            {commitStatus?.type === 'ok' ? <div className="alert ok">{commitStatus.text}</div> : null}
            {commitStatus?.type === 'err' ? <div className="alert err">{commitStatus.text}</div> : null}

            {submitted ? (
              <div style={{ marginTop: 12 }}>
                <div className="alert ok">Awaiting verification by admin. You can submit again if needed.</div>
              </div>
            ) : null}


            <InvestmentForm dealId={id} user={user} onSubmit={onCommit} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

