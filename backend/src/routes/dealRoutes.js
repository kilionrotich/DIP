// backend/src/routes/dealRoutes.js
import express from 'express';
import { createDeal, getDeals, getActiveDeals, updateDeal, cancelDeal } from '../controllers/dealController.js';
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

/**
 * Investor commits to a deal (creates Investment + optional PaymentProof)
 * Note: requires verifyToken; we don’t gate by role here so investor can commit.
 */
router.post('/:dealId/invest', verifyToken, async (req, res) => {
  const { dealId } = req.params;

  try {
    // Delegate to this route but map frontend payload variants consistently.
    const {
      amount, // ignored; we enforce fixed_amount
      investorId,
      investor_id: investor_id_from_body,
      type, // unused
      amount_invested, // unused (we enforce fixed_amount)
      paymentProofUrl,
      proofUrl,
      transaction_id: transaction_id_from_body,
      file_url,
      expected_return,
      status,
    } = req.body || {};

    const investor_id =
      investorId ??
      investor_id_from_body ??
      req.user?.id ??
      req.user?.user_id ??
      req.body?.investor_id;

    if (!investor_id) {
      return res.status(400).json({ error: 'Missing investorId/investor_id' });
    }

    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Investor can only commit once Admin approves the deal
    if (deal.status !== 'approved' && deal.status !== 'open') {
      return res.status(400).json({ error: `Deal is not approved for investment (status: ${deal.status})` });
    }

    // Fixed amount enforcement: ignore client-provided amount, always use deal.fixed_amount
    const fixed_amount = deal.fixed_amount;
    if (fixed_amount === null || fixed_amount === undefined || fixed_amount === '') {
      return res.status(400).json({ error: 'Deal is missing fixed_amount' });
    }

    const Investment = (await import('../models/Investment.js')).default;
    const PaymentProof = (await import('../models/PaymentProof.js')).default;
    const { Op } = await import('sequelize');

    // Prevent duplicate investment submissions (treat any non-refunded investment as duplicate)
    const existing = await Investment.findOne({
      where: {
        investor_id,
        deal_id: dealId,
        status: { [Op.ne]: 'refunded' },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Investment already submitted for this deal' });
    }

    const investment = await Investment.create({
      investor_id,
      deal_id: dealId,
      amount_invested: fixed_amount,
      expected_return: expected_return ?? null,
      status: status || 'pending',
    });

// Payment proof: supports uploaded file and/or transaction id
    // Accept payload variants:
    // - transaction_id (string)
    // - file_url (string)
    // - paymentProofUrl / proofUrl (legacy)
    // NOTE: This endpoint expects multipart upload support to be wired in server.js.
    // If a multipart upload is used, multer will provide req.file / req.files.
    const resolvedTransactionId = transaction_id_from_body ?? req.body?.transaction_id;

    // file_url might come from legacy inputs; if we add multer later, we map it here.
    let resolvedFileUrl = paymentProofUrl ?? proofUrl ?? file_url;

    // Prefer uploaded file path if present
    if (!resolvedFileUrl && req.file?.path) {
      resolvedFileUrl = req.file.path;
    }
    if (!resolvedFileUrl && req.files?.length) {
      resolvedFileUrl = req.files[0]?.path;
    }

    if (!resolvedFileUrl && !resolvedTransactionId) {
      return res.status(400).json({
        error: 'Payment proof is required (upload a slip or provide a transaction id)',
      });
    }

    await PaymentProof.create({
      transaction_id: resolvedTransactionId ?? null,
      file_url: resolvedFileUrl ?? null,
      status: 'pending',
      // verified_by will be set on verification; leave null
      investment_id: investment.investment_id ?? investment.id,
    });

    return res.status(201).json(investment);
  } catch (err) {
    // Don’t mis-label server/DB errors as client errors.
    console.error('POST /api/deals/:dealId/invest failed:', {
      dealId,
      message: err?.message,
      name: err?.name,
    });
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// Investors fetch all deals (protected)
router.get('/', verifyToken, getDeals);

// Fetch single deal (used by DealDetails)
router.get('/:dealId', verifyToken, async (req, res) => {
  try {
    const { dealId } = req.params;
    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    return res.json(deal);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin: fetch active deals
router.get('/active', verifyToken, isAdminOrSuperAdmin, getActiveDeals);

// Admin: edit deal
router.put('/:dealId', verifyToken, isAdminOrSuperAdmin, updateDeal);

// Admin: cancel/delete deal
router.post('/:dealId/cancel', verifyToken, isAdminOrSuperAdmin, cancelDeal);

// Admin: close completed deal
router.post('/:dealId/close', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { dealId } = req.params;

    const Deal = (await import('../models/Deal.js')).default;
    const Investment = (await import('../models/Investment.js')).default;

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status === 'cancelled') {
      return res.status(400).json({ error: 'Cancelled deals cannot be closed' });
    }

    // close deal
    await deal.update({ status: 'completed' });

    // mark investments completed (best-effort)
    if (dealId) {
      await Investment.update(
        { status: 'completed' },
        { where: { deal_id: dealId } }
      );
    }

    return res.json({ message: 'Deal closed (completed)', deal });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;



