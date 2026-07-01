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
import { commitInvestment } from '../controllers/investmentController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


// Admin creates a deal (protected)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createDeal(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy commit endpoint (frontend should use /api/investments/:dealId/commit)
router.post('/:dealId/invest', verifyToken, async (req, res) => {
  try {
    req.params.dealId = req.params.dealId;
    req.body = {
      ...req.body,
      deal_id: req.params.dealId,
      investor_id: req.body?.investor_id ?? req.body?.investorId,
      amount: req.body?.amount ?? req.body?.fixed_amount,
      proof_url: req.body?.proof_url ?? req.body?.proofUrl ?? req.body?.paymentProofUrl,
      mpesa_code: req.body?.mpesa_code ?? req.body?.transaction_id,
    };
    return await commitInvestment(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

// Admin: edit deal
router.put('/:dealId', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await updateDeal(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: cancel deal
router.post('/:dealId/cancel', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await cancelDeal(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: approve deal
router.post('/:dealId/approve', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await approveDeal(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: close deal
router.put('/:id/close', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await closeDeal(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Backward-compatible close route
router.post('/:dealId/close', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    req.params.id = req.params.dealId;
    await closeDeal(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
      include: [{ model: User, attributes: ['user_id', 'username', 'email'] }],
      order: [['investment_id', 'DESC']]
    });

    res.json({ investments });
  } catch (err) {
    console.error('Error fetching investments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

