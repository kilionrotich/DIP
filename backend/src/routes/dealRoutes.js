// backend/src/routes/dealRoutes.js
import express from 'express';
import {
  createDeal, getStats,
  getStats,
  getDeals,
  getActiveDeals,
  getInProgressDeals,
  updateDeal,
  cancelDeal,
  approveDeal,
  closeDeal
} from '../controllers/dealController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin creates a deal (protected)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createDeal(req, res);

    res.status(400).json({ error: err.message );

);

// Investor commits to a deal (creates Investment + optional PaymentProof)
router.post('/:dealId/invest', verifyToken, async (req, res) => {
  const { dealId } = req.params;
  try {
    // existing commit logic preserved
    const {
      investorId,
      investor_id: investor_id_from_body,
      paymentProofUrl,
      proofUrl,
      transaction_id: transaction_id_from_body,
      file_url,
      expected_return,
      status,
   = req.body || {};

    const investor_id =
      investorId ??
      investor_id_from_body ??
      req.user?.id ??
      req.user?.user_id ??
      req.body?.investor_id;

    if (!investor_id) {
      return res.status(400).json({ error: 'Missing investorId/investor_id' );
  

    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' );

    if (deal.status !== 'open') {
      return res.status(400).json({ error: `Deal is not open for investment (status: ${deal.status})` );
  

    const fixed_amount = deal.fixed_amount;
    if (!fixed_amount) {
      return res.status(400).json({ error: 'Deal is missing fixed_amount' );
  

    const Investment = (await import('../models/Investment.js')).default;
    const PaymentProof = (await import('../models/PaymentProof.js')).default;
    const { Op } = await import('sequelize');

    const existing = await Investment.findOne({
      where: {
        investor_id,
        deal_id: dealId,
        status: { [Op.ne]: 'refunded' },
    ,
  );
    if (existing) {
      return res.status(400).json({ error: 'Investment already submitted for this deal' );
  

    const investment = await Investment.create({
      investor_id,
      deal_id: dealId,
      amount_invested: fixed_amount,
      expected_return: expected_return ?? null,
      status: status || 'pending',
  );

    const resolvedTransactionId = transaction_id_from_body ?? req.body?.transaction_id;
    let resolvedFileUrl = paymentProofUrl ?? proofUrl ?? file_url;
    if (!resolvedFileUrl && req.file?.path) resolvedFileUrl = req.file.path;
    if (!resolvedFileUrl && req.files?.length) resolvedFileUrl = req.files[0]?.path;

    if (!resolvedFileUrl && !resolvedTransactionId) {
      return res.status(400).json({ error: 'Payment proof is required' );
  

    await PaymentProof.create({
      transaction_id: resolvedTransactionId ?? null,
      file_url: resolvedFileUrl ?? null,
      status: 'pending',
      investment_id: investment.investment_id ?? investment.id,
  );

    return res.status(201).json(investment);

    console.error('POST /api/deals/:dealId/invest failed:', { dealId, message: err?.message );
    return res.status(500).json({ error: err?.message || 'Internal server error' );

);

// Investors fetch all deals
router.get('/', verifyToken, getDeals);

// Admin: fetch Available Opportunities (open deals without active investments)
// Must come before /:dealId and /active to avoid conflict
router.get('/available', verifyToken, isAdminOrSuperAdmin, getActiveDeals);

// Admin/Investor: fetch Active Deals (deals WITH active investments)
// Must come before /:dealId to avoid conflict
router.get('/active', verifyToken, getInProgressDeals);

// Admin: get stats (MUST come before /:dealId to avoid conflict)
router.get('/stats', verifyToken, isAdminOrSuperAdmin, getStats)
  try {
    const Deal = (await import('../models/Deal.js')).default;
    const Investment = (await import('../models/Investment.js')).default;

    const totalDeals = await Deal.count();
    const totalInvestments = await Investment.count();

    // Sum all active investments
    const activeInvestments = await Investment.findAll({
      where: { status: 'active' },
      attributes: ['amount_invested', 'profit']
  );

    const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.amount_invested || 0), 0);
    const totalProfit = activeInvestments.reduce((sum, inv) => sum + Number(inv.profit || 0), 0);

    res.json({
      totalInvested,
      totalProfit,
      investmentsCount: totalInvestments,
      dealsCount: totalDeals
  );



);

// Fetch single deal
router.get('/:dealId', verifyToken, async (req, res) => {
  try {
    const { dealId } = req.params;
    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' );
    return res.json(deal);

    return res.status(400).json({ error: err.message );

);

// Admin: edit deal
router.put('/:dealId', verifyToken, isAdminOrSuperAdmin, updateDeal);

// Admin: cancel deal
router.post('/:dealId/cancel', verifyToken, isAdminOrSuperAdmin, cancelDeal);

// Admin: approve deal
router.post('/:dealId/approve', verifyToken, isAdminOrSuperAdmin, approveDeal);

// Admin: close deal
router.post('/:dealId/close', verifyToken, isAdminOrSuperAdmin, closeDeal);

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
  );

    res.json({ investments );

    console.error('Error fetching investments:', err.message);


);

export default router;





