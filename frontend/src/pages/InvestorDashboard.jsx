import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDeals from '../hooks/useDeals';
import { getProfits, getInvestments, getInvestmentSummary } from '../services/investmentService';
import DealCrad from '../components/DealCrad';

import {
  InvestorKPICards,
  ActiveDeals,
  ProfitTrends,
  InvestmentHistory,
  Notifications,
  Diversification,
  InboxSupport,
} from '../components/investor';

export default function InvestorDashboard() {
  const { user, logout } = useAuth();
  // Backend enforces investor visibility: only approved deals are returned.
  const { deals, loading: dealsLoading, error: dealsError } = useDeals({});

  const [investments, setInvestments] = useState([]);
  const [profitsRows, setProfitsRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, profRes, sumRes] = await Promise.all([
          getInvestments().catch(() => []),
          getProfits().catch(() => []),
          getInvestmentSummary().catch(() => null),
        ]);

        if (!mounted) return;

        const invList = Array.isArray(invRes) ? invRes : invRes?.investments || [];
        setInvestments(invList);

        // backend returns Profit.findAll => array
        const profList = Array.isArray(profRes) ? profRes : profRes?.profits || [];
        setProfitsRows(profList);

        setSummary(sumRes || null);
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
    // Prefer the backend summary (authoritative, auto-updated). Fall back to a
    // client-side computation if the summary endpoint is unavailable.
    if (summary) {
      return {
        totalInvested: summary.totalInvested ?? 0,
        currentValue: summary.currentValue ?? 0,
        roi: summary.roi ?? 0,
        profits: summary.profits ?? 0,
      };
    }

    const totalInvested = (investments || []).reduce(
      (sum, i) => sum + Number(i.amount_invested ?? i.amount ?? 0),
      0
    );

    const profitsTotal = (profitsRows || []).reduce(
      (sum, p) => sum + Number(p.total_profit ?? p.totalProfit ?? p.amount ?? p.profit ?? 0),
      0
    );

    const currentValue = totalInvested + profitsTotal; // approximation
    const roi = totalInvested > 0 ? (profitsTotal / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      roi,
      profits: profitsTotal,
    };
  }, [investments, profitsRows, summary]);

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
      <ActiveDeals investments={investments} loading={loading} />

      <div style={{ height: 18 }} />

      {/* Deals (approved & open to invest) */}
      <h3 style={{ margin: '0 0 12px 0' }}>Available Deals</h3>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>
        Only deals approved by the admin are shown here.
      </div>




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

      {/* Profit Trends */}
      <ProfitTrends />

      <div style={{ height: 18 }} />

      {/* Investment History */}
      <InvestmentHistory investments={investments} loading={loading} />

      <div style={{ height: 18 }} />

      {/* Notifications */}
      <Notifications />

      <div style={{ height: 18 }} />

      {/* Diversification */}
      <Diversification />

      <div style={{ height: 18 }} />

      {/* Inbox/Support */}
      <InboxSupport />
    </div>
  );
}
