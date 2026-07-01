import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDeals from '../hooks/useDeals';
import { getInvestments } from '../services/investmentService';

import DealCrad from '../components/DealCrad';

import {
  InvestorKPICards,
  ActiveDeals,
  InvestmentHistory,
} from '../components/investor';


export default function InvestorDashboard() {
  const { user, logout } = useAuth();
  // Investors can view open deals and accept to invest
  const { deals, loading: dealsLoading, error: dealsError } = useDeals({ status: 'open' });




  const [investments, setInvestments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const invRes = await getInvestments().catch(() => []);


        if (!mounted) return;

        const invList = Array.isArray(invRes) ? invRes : invRes?.investments || [];
        setInvestments(invList);

      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const totalInvested = (investments || []).reduce(
      (sum, i) => sum + Number(i.amount_invested ?? i.amount ?? 0),
      0
    );

    // Profit KPIs are omitted until profit history is guaranteed by backend.
    const currentValue = totalInvested;
    const roi = 0;
    return {
      totalInvested,
      currentValue,
      roi,
      profits: 0,
    };
  }, [investments]);


  const pendingInvestments = useMemo(
    () => (Array.isArray(investments) ? investments.filter((i) => String(i.status).toLowerCase() === 'pending') : []),
    [investments]
  );

  const activeInvestments = useMemo(
    () => (Array.isArray(investments) ? investments.filter((i) => String(i.status).toLowerCase() === 'active') : []),
    [investments]
  );

  const historyInvestments = useMemo(
    () => (Array.isArray(investments) ? investments.filter((i) => String(i.status).toLowerCase() === 'completed') : []),
    [investments]
  );

  return (
    <div className="container">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Investor Dashboard</h2>
          <div style={{ color: 'var(--muted)' }}>{user?.email || user?.name}</div>
        </div>
        <button className="btn danger" onClick={logout}>
          Logout
        </button>
      </div>

      <div style={{ height: 16 }} />

      {error ? <div className="alert err">{error}</div> : null}
      <InvestorKPICards loading={loading} kpis={kpis} />

      <div style={{ height: 18 }} />

      {/* Active Deals + Active Deals table */}
      <ActiveDeals investments={activeInvestments} loading={loading} />

      <div style={{ height: 18 }} />

      <h3 style={{ margin: '0 0 12px 0' }}>Pending Deals</h3>
      {loading ? (
        <div className="alert">Loading pending deals…</div>
      ) : pendingInvestments.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No pending deals.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Deal</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Amount</th>
                <th style={{ padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>M-Pesa Code</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvestments.map((inv) => (
                <tr key={inv.id || inv.investment_id}>
                  <td style={{ padding: '10px 6px' }}>{inv.deal?.title || `#${inv.deal_id}`}</td>
                  <td style={{ padding: '10px 6px' }}>{Number(inv.amount_invested || 0).toLocaleString()} KES</td>
                  <td style={{ padding: '10px 6px' }}>{inv.mpesa_code || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ height: 18 }} />

      {/* Deals (Available to invest - only approved) */}
      <h3 style={{ margin: '0 0 12px 0' }}>Available Opportunities</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 12, fontSize: 13 }}>
        Only approved deals are available for investment. Contact support if you have questions.
      </p>




      {dealsError ? <div className="alert err">{dealsError}</div> : null}
      {dealsLoading ? <div>Loading deals...</div> : null}

      <div className="row">
        {deals.map((d) => (
          <DealCrad key={d._id || d.id || d.deal_id} deal={d} />
        ))}
      </div>


      {!dealsLoading && deals.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No deals found.</div>
      ) : null}

      <div style={{ height: 18 }} />

      {/* Investment History */}
      <InvestmentHistory investments={historyInvestments} loading={loading} />

    </div>
  );
}
