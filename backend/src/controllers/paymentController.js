// backend/src/controllers/paymentController.js
import PaymentProof from '../models/PaymentProof.js';
import Payment from '../models/Payment.js';
import Investment from '../models/Investment.js';

// Create a new payment
export async function createPayment(req, res) {
  try {
    const { investment_id, amount, method } = req.body;

    // Ensure investment exists
    const investment = await Investment.findByPk(investment_id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Create payment
    const payment = await Payment.create({
      investment_id,
      amount,
      method,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all payments
export async function getPayments(req, res) {
  try {
    const payments = await Payment.findAll({
      include: [Investment],
    });

    res.status(200).json({ payments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Super admin / admin: verify a payment proof
export async function verifyPaymentProof(req, res) {
  try {
    const { proofId } = req.params;

    const { reason } = req.body || {};

    const proof = await PaymentProof.findOne({
      where: { proof_id: proofId },
    });

    if (!proof) return res.status(404).json({ error: 'Payment proof not found' });

    // Update proof
    proof.status = 'verified';
    proof.verified_at = new Date();
    proof.verified_by = req.user?.id ?? req.user?.user_id ?? proof.verified_by ?? null;

    await proof.save();

    // Optionally update investment status if it exists
    const investmentId = proof.investment_id;
    if (investmentId) {
      await Investment.update(
        { status: 'active' },
        { where: { investment_id: investmentId } }
      );
    }

    return res.json({ message: 'Payment proof verified', proof, reason: reason ?? null });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Super admin / admin: reject a payment proof
export async function rejectPaymentProof(req, res) {
  try {
    const { proofId } = req.params;

    const { reason } = req.body || {};

    const proof = await PaymentProof.findOne({
      where: { proof_id: proofId },
    });

    if (!proof) return res.status(404).json({ error: 'Payment proof not found' });

    proof.status = 'rejected';
    proof.verified_at = new Date();
    proof.verified_by = req.user?.id ?? req.user?.user_id ?? proof.verified_by ?? null;

    await proof.save();

    // Optionally update investment status back to pending
    const investmentId = proof.investment_id;
    if (investmentId) {
      await Investment.update(
        { status: 'pending' },
        { where: { investment_id: investmentId } }
      );
    }

    return res.json({ message: 'Payment proof rejected', proof, reason: reason ?? null });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// List all payment proofs (admin/super-admin)
export async function getPaymentProofs(req, res) {
  try {
    const proofs = await PaymentProof.findAll({
      order: [['proof_id', 'DESC']],
    });

    res.json({ proofs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

