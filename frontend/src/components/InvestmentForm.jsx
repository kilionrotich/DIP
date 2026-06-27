import React, { useState } from 'react';

export default function InvestmentForm({ dealId, user, fixedAmount, onSubmit, disabled }) {
  const isDisabled = Boolean(disabled);

  const [commitType, setCommitType] = useState('capital');

  // Payment proof (upload M-Pesa slip / bank slip)
  const [paymentSlipFile, setPaymentSlipFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        // backend enforces fixed amount from the deal record; client sends for completeness only
        amount: fixedAmount != null ? Number(fixedAmount) : undefined,
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
        <div className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Required Investment</span>
          <span style={{ fontWeight: 800 }}>
            {fixedAmount != null && !Number.isNaN(Number(fixedAmount))
              ? `${Number(fixedAmount).toLocaleString()} KES`
              : '-'}
          </span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
          Investment amount is fixed by the deal. You cannot enter a custom amount.
        </div>
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
          inputMode="url"
        />
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
          File upload is not implemented yet; paste a receipt/transaction proof link if available.
        </div>
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


      <button className="btn primary" disabled={loading || isDisabled} style={{ width: '100%', opacity: isDisabled ? 0.6 : 1 }} type="submit">
        {loading ? 'Committing...' : `Commit Investment to Deal ${dealId}`}
      </button>

    </form>
  );
}


