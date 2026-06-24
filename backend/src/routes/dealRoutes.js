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
  try {
    const { dealId } = req.params;
    // delegate to investmentController createInvestment, but map fields here
    const {
      amount,
      investorId,
      type,
      amount_invested,
      paymentProofUrl,
      transaction_id,
    } = req.body;

    // Support both frontend ({ amount, investorId }) and model fields ({ amount_invested })
    const investor_id = investorId ?? req.user?.id ?? req.user?.user_id ?? req.body.investor_id;
    const computed_amount_invested = amount_invested ?? amount;


    // Basic validation
    if (!investor_id) return res.status(400).json({ error: 'Missing investorId/investor_id' });
    if (!computed_amount_invested) return res.status(400).json({ error: 'Missing amount_invested/amount' });


    // Create investment
    const Investment = (await import('../models/Investment.js')).default;
    const PaymentProof = (await import('../models/PaymentProof.js')).default;

    const investment = await Investment.create({
      investor_id,
      deal_id: dealId,
      amount_invested,
      // expected_return/status are optional in model; pass-through if provided
      expected_return: req.body.expected_return,
      status: req.body.status || 'pending',
    });

    // Create payment proof if provided (file upload not implemented yet in this codebase)
    if (paymentProofUrl || transaction_id) {
      await PaymentProof.create({
        transaction_id: transaction_id ?? req.body.transaction_id,
        file_url: paymentProofUrl ?? req.body.file_url,
        status: 'pending',
        // verified_by will be set on verification; leave null
        investment_id: investment.investment_id ?? investment.id,
      });
    }

    return res.status(201).json(investment);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Investors fetch all deals (protected)
router.get('/', verifyToken, getDeals);

// Admin: fetch active deals
router.get('/active', verifyToken, isAdminOrSuperAdmin, getActiveDeals);

// Admin: edit deal
router.put('/:dealId', verifyToken, isAdminOrSuperAdmin, updateDeal);

// Admin: cancel/delete deal
router.post('/:dealId/cancel', verifyToken, isAdminOrSuperAdmin, cancelDeal);

export default router;

