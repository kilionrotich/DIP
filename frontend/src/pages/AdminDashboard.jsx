import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import DashboardStats from '../components/DashboardStats';

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
      await api.post('/deals', dealForm);
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
        <form onSubmit={handleDealSubmit}>
          <input placeholder="Title" onChange={e => setDealForm({ ...dealForm, title: e.target.value })}/>
          <textarea placeholder="Description" onChange={e => setDealForm({ ...dealForm, description: e.target.value })}/>
          <input type="number" placeholder="Amount Required" onChange={e => setDealForm({ ...dealForm, amount_required: e.target.value })}/>
          <input type="number" placeholder="Expected Return" onChange={e => setDealForm({ ...dealForm, expected_return: e.target.value })}/>
          <input type="date" placeholder="Start Date" onChange={e => setDealForm({ ...dealForm, start_date: e.target.value })}/>
          <input type="date" placeholder="End Date" onChange={e => setDealForm({ ...dealForm, end_date: e.target.value })}/>
          <button type="submit">Create Deal</button>
        </form>
      </div>

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