// backend/src/controllers/profitController.js
import Profit from '../models/Profit.js';
import Investment from '../models/Investment.js';
import { actorId, logAudit, notifyInvestor } from '../utils/lifecycle.js';

// Get profits (Investor)
export async function getProfits(req, res) {
  try {
    const profits = await Profit.findAll({
      where: { investor_id: actorId(req) }
    });
    res.json(profits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update profit (Admin only).
// Accepts either an investor_id directly or an investment_id (resolved to its
// investor). The profit value may arrive as total_profit / totalProfit / profit.
// Creates the profit row if it does not exist yet (upsert semantics).
export async function updateProfit(req, res) {
  try {
    const { investor_id, investment_id, total_profit, totalProfit, profit } = req.body;

    let resolvedInvestorId = investor_id;
    if (!resolvedInvestorId && investment_id) {
      const investment = await Investment.findByPk(investment_id);
      if (!investment) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      resolvedInvestorId = investment.investor_id;
    }

    if (!resolvedInvestorId) {
      return res.status(400).json({ error: 'investor_id or investment_id is required' });
    }

    const amount = Number(total_profit ?? totalProfit ?? profit);
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'A valid profit value is required' });
    }

    const [record] = await Profit.findOrCreate({
      where: { investor_id: resolvedInvestorId },
      defaults: { investor_id: resolvedInvestorId, total_profit: amount },
    });

    record.total_profit = amount;
    await record.save();

    await notifyInvestor({
      sender_id: actorId(req),
      receiver_id: resolvedInvestorId,
      subject: 'Profit updated',
      body: `Your profit figure has been updated to ${amount}.`,
    });
    await logAudit({
      user_id: actorId(req),
      action: `Updated profit for investor #${resolvedInvestorId} to ${amount}`,
      target_id: resolvedInvestorId,
    });

    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
