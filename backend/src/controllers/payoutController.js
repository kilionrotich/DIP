import Payout from '../models/Payout.js';
import Investment from '../models/Investment.js';
import Deal from '../models/Deal.js';
import AuditLog from '../models/AuditLog.js';

export async function createPayout(req, res) {
  try {
    const { investment_id, capital, profit } = req.body;

    if (!investment_id) {
      return res.status(400).json({ error: 'investment_id is required' });
    }

    const capitalNum = Number(capital);
    const profitNum = Number(profit);
    if (!Number.isFinite(capitalNum) || !Number.isFinite(profitNum)) {
      return res.status(400).json({ error: 'capital and profit must be valid numbers' });
    }

    const investment = await Investment.findByPk(investment_id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (investment.status !== 'active') {
      return res.status(400).json({ error: 'Payout is only allowed for active investments' });
    }

    const deal = await Deal.findByPk(investment.deal_id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found for this investment' });
    }

    if (['cancelled', 'completed'].includes(deal.status)) {
      return res.status(400).json({ error: `Cannot payout for deal with status ${deal.status}` });
    }

    const payout = await Payout.create({
      investment_id,
      capital: capitalNum,
      profit: profitNum,
      total_amount: capitalNum + profitNum,
      created_by: req.user?.id ?? req.user?.user_id ?? null,
    });

    await AuditLog.create({
      action: `PAYOUT_CREATED investment:${investment_id} total:${capitalNum + profitNum}`,
      user_id: req.user?.id ?? req.user?.user_id ?? null,
      target_id: payout.payout_id,
    });

    return res.status(201).json({ message: 'Payout created', payout });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getPayouts(req, res) {
  try {
    const payouts = await Payout.findAll({
      include: [Investment],
      order: [['payout_id', 'DESC']],
    });

    return res.json({ payouts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
