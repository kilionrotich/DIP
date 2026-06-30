// backend/src/controllers/investmentController.js
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';

// Investor commits to a deal (creates investment, status = pending)
export async function commitInvestment(req, res) {
  try {
    const { investor_id, deal_id, amount_invested, proof_url, transaction_id } = req.body;

    // Ensure deal exists and is approved
    const deal = await Deal.findByPk(deal_id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    if (deal.status !== 'approved') {
      return res.status(400).json({ error: 'Deal is not approved for investment' });
    }

    const investment = await Investment.create({
      investor_id,
      deal_id,
      amount_invested,
      proof_url,
      transaction_id,
      status: 'pending'
    });

    res.status(201).json(investment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Admin verifies investment (status = active)
export async function verifyInvestment(req, res) {
  try {
    const { investmentId } = req.params;
    const investment = await Investment.findByPk(investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    if (investment.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending investments can be verified' });
    }

    await investment.update({ status: 'active' });
    return res.json({ message: 'Investment verified', investment });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Admin updates profit for an investment
export async function updateProfit(req, res) {
  try {
    const { investmentId } = req.params;
    const { profit } = req.body;

    const investment = await Investment.findByPk(investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    await investment.update({ profit });
    return res.json({ message: 'Profit updated', investment });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Existing: Create a new investment (legacy direct creation)
export async function createInvestment(req, res) {
  try {
    const { investor_id, deal_id, amount_invested } = req.body;

    const deal = await Deal.findByPk(deal_id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const investment = await Investment.create({
      investor_id,
      deal_id,
      amount_invested,
      status: 'pending' // normalize legacy creation into pending
    });

    res.status(201).json(investment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all investments (wrap response in { investments })
export async function getInvestments(req, res) {
  try {
    const investments = await Investment.findAll({
      include: [Deal],
      order: [['investment_id', 'DESC']],
    });

    res.status(200).json({ investments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}