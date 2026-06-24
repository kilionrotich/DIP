import React, { useState } from 'react';

export default function InvestmentForm({ dealId, user, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [commitType, setCommitType] = useState('capital');

  // Payment proof (simple: proof URL + transaction id)
  // File upload is not implemented in the current backend.
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        amount: Number(amount),
        type: commitType,
        investorId: user?._id || user?.id,

        // PaymentProof fields consumed by backend route POST /api/deals/:dealId/invest
        paymentProofUrl: paymentProofUrl || undefined,
        transaction_id: transactionId || undefined,
      };

      await onSubmit(payload);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="alert err">{error}</div> : null}

      <div className="form-group">
        <label className="label">Investment Amount</label>
        <input
          className="input"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
        />
      </div>

      <div className="form-group">
        <label className="label">Commit Type</label>
        <select
          className="input"
          value={commitType}
          onChange={(e) => setCommitType(e.target.value)}
        >
          <option value="capital">Capital</option>
          <option value="equity">Equity</option>
        </select>
      </div>

      <div className="form-group">
        <label className="label">Payment Proof URL (optional)</label>
        <input
          className="input"
          value={paymentProofUrl}
          onChange={(e) => setPaymentProofUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="form-group">
        <label className="label">Transaction ID (optional)</label>
        <input
          className="input"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g. TRX12345"
        />
      </div>

      <button className="btn primary" disabled={loading} style={{ width: '100%' }} type="submit">
        {loading ? 'Committing...' : `Commit to Deal ${dealId}`}
      </button>
    </form>
  );
}


