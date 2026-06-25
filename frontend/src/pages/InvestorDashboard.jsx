import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDeals from '../hooks/useDeals';
import { getProfits, getInvestments } from '../services/investmentService';
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
  const [dealFilters, setDealFilters] = useState({
    status: 'open',
    sector: '',
    roi_min: '',
    roi_max: '',
    deadline: '',
    risk: '',
  });

  const { deals, loading: dealsLoading, error: dealsError } = useDeals(dealFilters);


  const [investments, setInvestments] = useState([]);
  const [profitsRows, setProfitsRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, profRes] = await Promise.all([
          getInvestments().catch(() => []),
          getProfits().catch(() => []),
        ]);

        if (!mounted) return;

        const invList = Array.isArray(invRes) ? invRes : invRes?.investments || [];
        setInvestments(invList);

        // backend returns Profit.findAll => array
        const profList = Array.isArray(profRes) ? profRes : profRes?.profits || [];
        setProfitsRows(profList);
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
  }, [investments, profitsRows]);

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

      {/* Deals (Open to invest) */}
      <h3 style={{ margin: '0 0 12px 0' }}>Available Deals</h3>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 180 }}>
            <label className="label">Sector</label>
            <input
              className="input"
              value={dealFilters.sector}
              onChange={(e) => setDealFilters((p) => ({ ...p, sector: e.target.value }))}
              placeholder="(optional)"
            />
          </div>

          <div className="form-group" style={{ minWidth: 160 }}>
            <label className="label">ROI min (%)</label>
            <input
              className="input"
              type="number"
              value={dealFilters.roi_min}
              onChange={(e) => setDealFilters((p) => ({ ...p, roi_min: e.target.value }))}
              placeholder="(optional)"
            />
          </div>

          <div className="form-group" style={{ minWidth: 160 }}>
            <label className="label">ROI max (%)</label>
            <input
              className="input"
              type="number"
              value={dealFilters.roi_max}
              onChange={(e) => setDealFilters((p) => ({ ...p, roi_max: e.target.value }))}
              placeholder="(optional)"
            />
          </div>

          <div className="form-group" style={{ minWidth: 200 }}>
            <label className="label">Deadline (on/before)</label>
            <input
              className="input"
              type="date"
              value={dealFilters.deadline}
              onChange={(e) => setDealFilters((p) => ({ ...p, deadline: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ minWidth: 160 }}>
            <label className="label">Risk</label>
            <select
              className="input"
              value={dealFilters.risk}
              onChange={(e) => setDealFilters((p) => ({ ...p, risk: e.target.value }))}
            >
              <option value="">(optional)</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: -6, marginBottom: 12 }}>
        Note: filtering is currently implemented for <b>deadline</b> and <b>ROI</b> using existing deal fields.
        <span style={{ display: 'inline-block', width: 8 }} />Sector/Risk filters are UI-only until the backend stores those values.
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
