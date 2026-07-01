// backend/src/controllers/profitController.js
import Profit from '../models/Profit.js';
import Investment from '../models/Investment.js';
import Deal from '../models/Deal.js';

// Get profits (Investor)
export async function getProfits(req, res) {
  try {
    const profits = await Profit.findAll({
      where: { investor_id: req.user.id }
    });
    res.json(profits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update profit (Admin only)
export async function updateProfit(req, res) {
  try {
    const { investment_id, profit } = req.body;

    if (!investment_id) {
      return res.status(400).json({ error: 'investment_id is required' });
    }

    if (profit === undefined || Number.isNaN(Number(profit))) {
      return res.status(400).json({ error: 'profit must be a valid number' });
    }

    const investment = await Investment.findByPk(investment_id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (investment.status !== 'active') {
      return res.status(400).json({ error: 'Profit updates are allowed only for active investments' });
    }

    const deal = await Deal.findByPk(investment.deal_id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found for this investment' });
    }

    if (['cancelled', 'completed'].includes(deal.status)) {
      return res.status(400).json({ error: `Cannot update profit for deal with status ${deal.status}` });
    }

    await investment.update({ profit: Number(profit) });

    const [profitRecord] = await Profit.findOrCreate({
      where: { investor_id: investment.investor_id },
      defaults: { investor_id: investment.investor_id, total_profit: 0 }
    });

    const allActive = await Investment.findAll({
      where: { investor_id: investment.investor_id, status: 'active' }
    });

    const totalProfit = allActive.reduce((sum, inv) => sum + Number(inv.profit || 0), 0);
    await profitRecord.update({ total_profit: totalProfit });

    return res.json({ message: 'Profit updated successfully', investment_id, profit: Number(profit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}