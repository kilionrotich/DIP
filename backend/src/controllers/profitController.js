// backend/src/controllers/profitController.js
import Profit from '../models/Profit.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';  // ✅ FIXED

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
    const { investor_id, totalProfit } = req.body;

    const profit = await Profit.findOne({ where: { investor_id } });
    if (!profit) {
      return res.status(404).json({ error: 'Profit record not found' });
    }

    profit.totalProfit = totalProfit;
    await profit.save();

    res.json(profit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}