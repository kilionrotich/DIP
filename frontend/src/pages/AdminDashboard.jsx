import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import DashboardStats from '../components/DashboardStats';
import { getActiveDeals, cancelDeal, updateDeal } from '../services/dealService';
import AdminDealCard from '../components/AdminDealCard';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // Deal form state
  const [dealForm, setDealForm] = useState({
    title: '',
    description: '',
    amount_required: '',
    expected_return: '',
    start_date: '',
    end_date: ''
  });

  // Investment form state
  const [investmentForm, setInvestmentForm] = useState({
    investor_id: '',
    deal_id: '',
    amount_invested: ''
  });

  // Profit form state
  const [profitForm, setProfitForm] = useState({
    investment_id: '',
    profit: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Submit deal
  const handleDealSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.post('/api/deals', dealForm);
      setMessage('Deal created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating deal');
    }
  };

  // Submit investment
  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.post('/investments', investmentForm);
      setMessage('Investment recorded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error recording investment');
    }
  };

  // Submit profit update
  const handleProfitSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.put('/profits', profitForm);
      setMessage('Profit updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profit');
    }
  };

  // Active deals section
  const [activeDeals, setActiveDeals] = useState([]);
  const [activeDealsLoading, setActiveDealsLoading] = useState(false);
  const [activeDealsError, setActiveDealsError] = useState(null);

  const [editingDeal, setEditingDeal] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    amount_required: '',
    expected_return: '',
    start_date: '',
    end_date: '',
  });

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

  useEffect(() => {
    fetchActiveDeals();
  }, []);

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
      const dealId = deal?._id || deal?.deal_id || deal?.id;
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
      await updateDeal(dealId, editForm);
      setMessage('Deal updated successfully');
      setEditingDeal(null);
      await fetchActiveDeals();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update deal');
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Admin Dashboard</h2>
          <div style={{ color: 'var(--muted)' }}>{user?.email || user?.name}</div>
        </div>
        <button className="btn danger" onClick={logout}>Logout</button>
      </div>

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert err">{error}</div>}

      <DashboardStats
        stats={{ totalInvested: 0, profitValue: 0, investmentsCount: 0 }}
        variant="admin"
      />

      {/* Deal Form */}
      <div className="card">
        <h3>Create Deal</h3>
        <form
          onSubmit={(e) => {
            handleDealSubmit(e).then(() => fetchActiveDeals());
          }}
        >
          <input placeholder="Title" onChange={e => setDealForm({ ...dealForm, title: e.target.value })}/>
          <textarea placeholder="Description" onChange={e => setDealForm({ ...dealForm, description: e.target.value })}/>
          <input type="number" placeholder="Amount Required" onChange={e => setDealForm({ ...dealForm, amount_required: e.target.value })}/>
          <input type="number" placeholder="Expected Return" onChange={e => setDealForm({ ...dealForm, expected_return: e.target.value })}/>
          <input type="date" placeholder="Start Date" onChange={e => setDealForm({ ...dealForm, start_date: e.target.value })}/>
          <input type="date" placeholder="End Date" onChange={e => setDealForm({ ...dealForm, end_date: e.target.value })}/>
          <button type="submit">Create Deal</button>
        </form>
      </div>

      {/* Active Deals Section */}
      <div style={{ height: 18 }} />
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

      {/* Edit Deal */}
      {editingDeal ? (
        <div className="card">
          <h3>Edit Deal</h3>
          {error ? <div className="alert err">{error}</div> : null}
          <form onSubmit={onSaveEdit}>
            <input placeholder="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            <input type="number" placeholder="Amount Required" value={editForm.amount_required} onChange={(e) => setEditForm({ ...editForm, amount_required: e.target.value })} />
            <input type="number" placeholder="Expected Return" value={editForm.expected_return} onChange={(e) => setEditForm({ ...editForm, expected_return: e.target.value })} />
            <input type="date" placeholder="Start Date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
            <input type="date" placeholder="End Date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
              <button className="btn primary" type="submit">Save</button>
              <button className="btn" type="button" onClick={() => setEditingDeal(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Investment Form */}
      <div className="card">
        <h3>Record Investment</h3>
        <form onSubmit={handleInvestmentSubmit}>
          <input placeholder="Investor ID" onChange={e => setInvestmentForm({ ...investmentForm, investor_id: e.target.value })}/>
          <input placeholder="Deal ID" onChange={e => setInvestmentForm({ ...investmentForm, deal_id: e.target.value })}/>
          <input type="number" placeholder="Amount Invested" onChange={e => setInvestmentForm({ ...investmentForm, amount_invested: e.target.value })}/>
          <button type="submit">Record Investment</button>
        </form>
      </div>

      {/* Profit Form */}
      <div className="card">
        <h3>Update Profit</h3>
        <form onSubmit={handleProfitSubmit}>
          <input placeholder="Investment ID" onChange={e => setProfitForm({ ...profitForm, investment_id: e.target.value })}/>
          <input type="number" placeholder="Profit" onChange={e => setProfitForm({ ...profitForm, profit: e.target.value })}/>
          <button type="submit">Update Profit</button>
        </form>
      </div>
    </div>
  );
}