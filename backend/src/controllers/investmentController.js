// backend/src/controllers/investmentController.js
import { Op } from 'sequelize';
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';
import PaymentProof from '../models/PaymentProof.js';
import Profit from '../models/Profit.js';
import { actorId, logAudit, notifyInvestor } from '../utils/lifecycle.js';

function isAdminRole(req) {
  return req.user?.role === 'admin' || req.user?.role === 'super_admin';
}

// Create a new investment
export async function createInvestment(req, res) {
  try {
    const { investor_id, deal_id, amount_invested } = req.body;

    // Ensure deal exists
    const deal = await Deal.findByPk(deal_id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Create investment
    const investment = await Investment.create({
      investor_id,
      deal_id,
      amount_invested
    });

    res.status(201).json(investment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get investments. Investors only see their own; admins see all.
export async function getInvestments(req, res) {
  try {
    const where = {};
    if (!isAdminRole(req)) {
      where.investor_id = actorId(req);
    }

    const investments = await Investment.findAll({
      where: Object.keys(where).length ? where : undefined,
      include: [Deal],
      order: [['investment_id', 'DESC']],
    });

    res.status(200).json({ investments });
  } catch (err) {
    // avoid 400 for server/DB errors; return 500 with error message
    res.status(500).json({ error: err.message });
  }
}

// Admin verifies an investment's proof and marks the investment active (live).
// Lifecycle: pending -> active.
export async function verifyInvestment(req, res) {
  try {
    const { investmentId } = req.params;

    const investment = await Investment.findByPk(investmentId, { include: [Deal] });
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    if (investment.status === 'completed' || investment.status === 'refunded') {
      return res.status(400).json({ error: `Cannot verify a ${investment.status} investment` });
    }

    await investment.update({ status: 'active' });

    // Mark the related payment proof verified (best-effort).
    await PaymentProof.update(
      {
        status: 'verified',
        verified_at: new Date(),
        verified_by: actorId(req),
      },
      { where: { investment_id: investment.investment_id } }
    );

    const dealTitle = investment.Deal?.title || `#${investment.deal_id}`;
    await notifyInvestor({
      sender_id: actorId(req),
      receiver_id: investment.investor_id,
      subject: `Investment verified: ${dealTitle}`,
      body: `Your investment in "${dealTitle}" has been verified and is now active.`,
    });
    await logAudit({
      user_id: actorId(req),
      action: `Verified investment for deal "${dealTitle}"`,
      target_id: investment.investment_id,
    });

    return res.json({ message: 'Investment verified (active)', investment });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Admin rejects an investment's proof. Lifecycle: keeps it pending (investor must
// resubmit proof) and marks the proof rejected.
export async function rejectInvestment(req, res) {
  try {
    const { investmentId } = req.params;
    const { reason } = req.body || {};

    const investment = await Investment.findByPk(investmentId, { include: [Deal] });
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    if (investment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot reject a completed investment' });
    }

    await investment.update({ status: 'pending' });

    await PaymentProof.update(
      {
        status: 'rejected',
        verified_at: new Date(),
        verified_by: actorId(req),
      },
      { where: { investment_id: investment.investment_id } }
    );

    const dealTitle = investment.Deal?.title || `#${investment.deal_id}`;
    await notifyInvestor({
      sender_id: actorId(req),
      receiver_id: investment.investor_id,
      subject: `Investment proof rejected: ${dealTitle}`,
      body: `Your payment proof for "${dealTitle}" was rejected${reason ? `: ${reason}` : ''}. Please resubmit a valid proof.`,
    });
    await logAudit({
      user_id: actorId(req),
      action: `Rejected investment proof for deal "${dealTitle}"`,
      target_id: investment.investment_id,
    });

    return res.json({ message: 'Investment proof rejected', investment, reason: reason ?? null });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Role-aware dashboard summary.
// Investor: totalInvested, profits, currentValue, roi (for their own portfolio).
// Admin: totalInvested, profits and counts across the whole platform.
export async function getInvestmentSummary(req, res) {
  try {
    const admin = isAdminRole(req);

    const where = { status: { [Op.ne]: 'refunded' } };
    if (!admin) where.investor_id = actorId(req);

    const investments = await Investment.findAll({ where, raw: true });

    const totalInvested = investments.reduce(
      (sum, i) => sum + Number(i.amount_invested || 0),
      0
    );
    const investmentsCount = investments.length;

    const statusCounts = investments.reduce((acc, i) => {
      const s = i.status || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const profitWhere = admin ? undefined : { investor_id: actorId(req) };
    const profitRows = await Profit.findAll({ where: profitWhere, raw: true });
    const profits = profitRows.reduce(
      (sum, p) => sum + Number(p.total_profit || 0),
      0
    );

    const currentValue = totalInvested + profits;
    const roi = totalInvested > 0 ? (profits / totalInvested) * 100 : 0;

    return res.json({
      role: admin ? 'admin' : 'investor',
      totalInvested,
      profits,
      currentValue,
      roi,
      investmentsCount,
      statusCounts,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
