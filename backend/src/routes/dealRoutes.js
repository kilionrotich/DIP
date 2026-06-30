// backend/src/routes/dealRoutes.js
import express from 'express';
import {
  createDeal,
  getDeals,
  getActiveDeals,
  getInProgressDeals,
  updateDeal,
  cancelDeal,
  approveDeal,
  closeDeal,
  getStats
} from '../controllers/dealController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


// Admin creates a deal (protected)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createDeal(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Investor commits to a deal (creates Investment + optional PaymentProof)
router.post('/:dealId/invest', verifyToken, async (req, res) => {
  const { dealId } = req.params;
  try {
    const Investment = (await import('../models/Investment.js')).default;
    const PaymentProof = (await import('../models/PaymentProof.js')).default;
    const { Op } = await import('sequelize');

    const { investorId, investor_id: investor_id_from_body, paymentProofUrl, proofUrl, fixed_amount, expected_return, status } = req.body || {};

    const investor_id = investorId ?? investor_id_from_body ?? req.user?.id ?? req.user?.user_id ?? req.body?.investor_id;
    if (!investor_id) return res.status(400).json({ error: 'Missing investorId/investor_id' });

    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    if (deal.status !== 'open') return res.status(400).json({ error: 'Deal is not open for investment (status: ' + deal.status + ')' });

    const existing = await Investment.findOne({
      where: { investor_id, deal_id: dealId, status: { [Op.ne]: 'refunded' } }
    });
    if (existing) return res.status(400).json({ error: 'Investment already submitted for this deal' });

    const investment = await Investment.create({
      investor_id, deal_id: dealId, amount_invested: fixed_amount, expected_return: expected_return ?? null, status: status || 'pending'
    });

    const fileUrl = proofUrl ?? paymentProofUrl;
    const resolvedFileUrl = fileUrl || null;
    if (resolvedFileUrl) {
      await PaymentProof.create({
        investment_id: investment.investment_id ?? investment.id,
        file_url: resolvedFileUrl, status: 'pending'
      });
    }

    return res.status(201).json(investment);
  } catch (err) {
    console.error('POST /api/deals/:dealId/invest failed:', { dealId, message: err?.message });
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// Investors fetch all deals
router.get('/', verifyToken, getDeals);

// Admin: fetch Available Opportunities (open deals without active investments)
router.get('/available', verifyToken, isAdminOrSuperAdmin, getActiveDeals);

// Admin/Investor: fetch Active Deals (deals WITH active investments)
router.get('/active', verifyToken, getInProgressDeals);

// Admin: get stats
router.get('/stats', verifyToken, isAdminOrSuperAdmin, getStats);

// Fetch single deal
router.get('/:dealId', verifyToken, async (req, res) => {
  try {
    const { dealId } = req.params;
    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create deal
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createDeal(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: edit deal
router.put('/:dealId', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await updateDeal(req, res);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin: cancel deal
router.post('/:dealId/cancel', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await cancelDeal(req, res);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin: approve deal
router.post('/:dealId/approve', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await approveDeal(req, res);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin: close deal
router.post('/:dealId/close', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await closeDeal(req, res);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Get investments for a specific deal (Admin/Investor)
router.get('/:dealId/investments', verifyToken, async (req, res) => {
  try {
    const { dealId } = req.params;
    const dealIdNum = parseInt(dealId, 10);
    const Investment = (await import('../models/Investment.js')).default;
    const User = (await import('../models/User.js')).default;

    const investments = await Investment.findAll({
      where: { deal_id: dealIdNum },
      include: [{ model: User, as: 'investor', attributes: ['user_id', 'username', 'email'] }],
      order: [['investment_id', 'DESC']]
    });

    res.json({ investments });
  } catch (err) {
    console.error('Error fetching investments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

