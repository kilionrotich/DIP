import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDeals from '../hooks/useDeals';
import { getProfits, getInvestments } from '../services/investmentService';
import DashboardStats from '../components/DashboardStats';
import DealCrad from '../components/DealCrad';

export default function InvestorDashboard() {
  const { user, logout } = useAuth();
  const { deals, loading: dealsLoading, error: dealsError } = useDeals();

  const [investments, setInvestments] = useState([]);
  const [profits, setProfits] = useState(null);
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
          getProfits().catch(() => null),
        ]);
        if (!mounted) return;
        setInvestments(Array.isArray(invRes) ? invRes : invRes?.investments || []);
        setProfits(profRes?.profits || profRes);
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

  const stats = useMemo(() => {
    const totalInvested = investments.reduce(
      (sum, i) => sum + (Number(i.amount_invested || i.amount || 0)),
      0
    );
    const profitValue = profits
      ? Number(profits.totalProfit || profits.amount || profits.profit || 0)
      : 0;
    return {
      totalInvested,
      profitValue,
      investmentsCount: investments.length,
    };
  }, [investments, profits]);

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
      <DashboardStats loading={loading} stats={stats} />

      <div style={{ height: 18 }} />

      {/* Investments Section */}
      <h3 style={{ margin: '0 0 12px 0' }}>Your Investments</h3>
      <div className="row">
        {investments.map((inv) => (
          <div key={inv.id} className="card" style={{ flex: 1, minWidth: 240 }}>
            <h4 style={{ marginTop: 0 }}>Deal #{inv.deal_id}</h4>
            <p>Amount Invested: {inv.amount_invested || inv.amount}</p>
            <p>Profit: {inv.profit || 0}</p>
          </div>
        ))}
      </div>
      {!loading && investments.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No investments recorded yet.</div>
      ) : null}

      <div style={{ height: 18 }} />

      {/* Profit Summary */}
      <div className="card">
        <h3>Total Profit</h3>
        <p style={{ fontSize: 18, fontWeight: 'bold', color: 'green' }}>
          {stats.profitValue}
        </p>
      </div>

      <div style={{ height: 18 }} />

      {/* Deals Section */}
      <h3 style={{ margin: '0 0 12px 0' }}>Available Deals</h3>
      {dealsError ? <div className="alert err">{dealsError}</div> : null}
      {dealsLoading ? <div>Loading deals...</div> : null}

      <div className="row">
        {deals.map((d) => (
          <DealCrad key={d._id || d.id} deal={d} />
        ))}
      </div>

      {!dealsLoading && deals.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No deals found.</div>
      ) : null}
    </div>
  );
}