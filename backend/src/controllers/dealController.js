// backend/src/controllers/dealController.js
import Deal from '../models/Deal.js';

// Create a new deal (Admin only)
export async function createDeal(req, res) {
  try {
    const { title, description, amount_required, expected_return, start_date, end_date, status } = req.body;

    const deal = await Deal.create({
      title,
      description,
      amount_required,
      expected_return,
      start_date,
      end_date,
      status: status || 'open',
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all deals (Investors/Admin)
export async function getDeals(req, res) {
  try {
    const deals = await Deal.findAll();
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}