// backend/src/controllers/investmentController.js
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';

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

// Get all investments (wrap response in { investments })
export async function getInvestments(req, res) {
  try {
    const investments = await Investment.findAll({
      include: [Deal]
    });

    res.status(200).json({ investments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}