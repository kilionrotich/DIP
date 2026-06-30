// backend/src/controllers/dealController.js
import { Op } from 'sequelize';
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';
import { actorId, logAudit, notifyInvestors } from '../utils/lifecycle.js';

// Helper: collect investor ids that have a (non-refunded) investment in a deal.
async function investorIdsForDeal(dealId) {
  const rows = await Investment.findAll({
    where: { deal_id: dealId },
    attributes: ['investor_id'],
    raw: true,
  });
  return rows.map((r) => r.investor_id).filter(Boolean);
}

// Create a new deal (Admin only)
export async function createDeal(req, res) {
  try {
    let {
      title,
      description,
      amount_required,
      fixed_amount,
      expected_return,
      start_date,
      end_date,
      status,
    } = req.body;

    // Normalize numeric fields coming from the frontend (empty strings cause Sequelize "invalid syntax" errors)
    amount_required = amount_required === '' || amount_required == null ? null : Number(amount_required);
    fixed_amount = fixed_amount === '' || fixed_amount == null ? null : Number(fixed_amount);
    expected_return = expected_return === '' || expected_return == null ? null : Number(expected_return);

    if (!Number.isFinite(amount_required)) amount_required = null;
    if (!Number.isFinite(fixed_amount)) fixed_amount = null;
    if (!Number.isFinite(expected_return)) expected_return = null;

    // If the admin form provides only fixed_amount (or amount_required is empty), keep DB constraints happy.
    // Deal model requires both amount_required and fixed_amount as NOT NULL, so derive one from the other.
    if (amount_required == null && fixed_amount != null) amount_required = fixed_amount;
    if (fixed_amount == null && amount_required != null) fixed_amount = amount_required;

    if (amount_required == null || fixed_amount == null) {
      return res.status(400).json({ error: 'amount_required and fixed_amount must be valid numbers' });
    }

    const deal = await Deal.create({
      title,
      description,
      amount_required,
      fixed_amount,
      expected_return,
      start_date,
      end_date,
      // Admin can set status (e.g. 'approved'). Investor commits will be blocked unless approved.
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
    const {
      status,
      sector,
      roi_min,
      roi_max,
      deadline,
      risk,
    } = req.query;

    // NOTE: current Deal model only includes: title, description, amount_required,
    // expected_return, start_date, end_date, status.
    // We map the requested filters onto available fields as follows:
    // - sector -> not available yet (ignored)
    // - roi_min/roi_max -> interpreted using expected_return / amount_required - 1 (in %)
    // - deadline -> interpreted as end_date <= deadline (if provided)
    // - risk -> not available yet (ignored)

    const where = {};
    if (status) where.status = status;

    // Visibility rule: investors may only ever see deals the admin has approved.
    // Any status filter they pass is ignored in favour of 'approved'.
    if (req.user?.role === 'investor') {
      where.status = 'approved';
    }

    // Deadline filter (end_date)
    if (deadline) {
      const dt = new Date(deadline);
      if (!Number.isNaN(dt.getTime())) {
        where.end_date = where.end_date || {};
        where.end_date["$lte"] = dt;
      }
    }

    // Fetch first, then ROI filter in JS (to avoid adding DB columns right now)
    const deals = await Deal.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [['deal_id', 'DESC']],
    });

    const roiMin = roi_min !== undefined ? Number(roi_min) : null;
    const roiMax = roi_max !== undefined ? Number(roi_max) : null;

    const filtered = deals.filter((d) => {
      // ROI % = (expected_return - required) / required * 100
      // required can be amount_required (legacy) or fixed_amount (new)
      const expected = Number(d.expected_return);
      const required = Number(d.amount_required ?? d.fixed_amount);

      // If ROI filters are not requested, keep the deal even if ROI inputs are missing.
      if (roiMin === null && roiMax === null) return true;

      // If ROI filters are requested but we can't compute ROI for this deal, drop it.
      if (!Number.isFinite(expected) || !Number.isFinite(required) || required <= 0) {
        return false;
      }

      const roiPct = ((expected - required) / required) * 100;

      if (roiMin !== null && roiPct < roiMin) return false;
      if (roiMax !== null && roiPct > roiMax) return false;
      return true;
    });


    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



// Get active/open deals
export async function getActiveDeals(req, res) {
  try {
    const deals = await Deal.findAll({
      where: { status: 'open' },
      order: [['deal_id', 'DESC']],
    });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update deal (admin)
export async function updateDeal(req, res) {
  try {
    const { dealId } = req.params;

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const {
      title,
      description,
      amount_required,
      expected_return,
      fixed_amount,
      start_date,
      end_date,
    } = req.body;

    // Only allow edits for open deals
    if (deal.status !== 'open') {
      return res.status(400).json({ error: 'Only open deals can be edited' });
    }

    await deal.update({
      title: title ?? deal.title,
      description: description ?? deal.description,
      amount_required: amount_required ?? deal.amount_required,
      expected_return: expected_return ?? deal.expected_return,
      fixed_amount: fixed_amount ?? deal.fixed_amount,
      start_date: start_date ?? deal.start_date,
      end_date: end_date ?? deal.end_date,
    });

    return res.json(deal);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Approve a deal so it becomes visible to investors (admin/super-admin).
// Lifecycle: open ("Active") -> approved.
export async function approveDeal(req, res) {
  try {
    const { dealId } = req.params;

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status === 'cancelled' || deal.status === 'completed') {
      return res.status(400).json({ error: `Cannot approve a ${deal.status} deal` });
    }
    if (deal.status === 'approved') {
      return res.status(400).json({ error: 'Deal is already approved' });
    }

    await deal.update({ status: 'approved' });
    await logAudit({ user_id: actorId(req), action: `Approved deal "${deal.title}"`, target_id: deal.deal_id });

    return res.json({ message: 'Deal approved', deal });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Close a deal once it has run its course (admin/super-admin).
// Lifecycle: approved -> completed; investor investments move to history (completed).
export async function closeDeal(req, res) {
  try {
    const { dealId } = req.params;

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status === 'cancelled') {
      return res.status(400).json({ error: 'Cancelled deals cannot be closed' });
    }
    if (deal.status === 'completed') {
      return res.status(400).json({ error: 'Deal is already completed' });
    }

    await deal.update({ status: 'completed' });

    // Move active/verified investments into history as completed.
    await Investment.update(
      { status: 'completed' },
      { where: { deal_id: dealId, status: { [Op.in]: ['active', 'verified', 'pending'] } } }
    );

    const investorIds = await investorIdsForDeal(dealId);
    await notifyInvestors({
      sender_id: actorId(req),
      receiverIds: investorIds,
      subject: `Deal completed: ${deal.title}`,
      body: `The deal "${deal.title}" has been closed and marked completed. It now appears in your investment history.`,
    });
    await logAudit({ user_id: actorId(req), action: `Closed deal "${deal.title}"`, target_id: deal.deal_id });

    return res.json({ message: 'Deal closed (completed)', deal });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Cancel/delete deal (admin/super-admin)
// Lifecycle: open/approved -> cancelled; investor side is locked (investments refunded).
export async function cancelDeal(req, res) {
  try {
    const { dealId } = req.params;
    const { hardDelete = false } = req.body || {};

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Soft cancel: lock the deal and the investor side.
    if (!hardDelete) {
      if (deal.status === 'completed') {
        return res.status(400).json({ error: 'Completed deals cannot be cancelled' });
      }
      if (deal.status === 'cancelled') {
        return res.status(400).json({ error: 'Deal is already cancelled' });
      }

      await deal.update({ status: 'cancelled' });

      // Lock investor side: refund any non-completed investments.
      await Investment.update(
        { status: 'refunded' },
        { where: { deal_id: dealId, status: { [Op.ne]: 'completed' } } }
      );

      const investorIds = await investorIdsForDeal(dealId);
      await notifyInvestors({
        sender_id: actorId(req),
        receiverIds: investorIds,
        subject: `Deal cancelled: ${deal.title}`,
        body: `The deal "${deal.title}" has been cancelled by the administrator. Your commitment has been locked/refunded.`,
      });
      await logAudit({ user_id: actorId(req), action: `Cancelled deal "${deal.title}"`, target_id: deal.deal_id });

      return res.json({ message: 'Deal cancelled', deal });
    }

    // Hard delete
    await logAudit({ user_id: actorId(req), action: `Deleted deal "${deal.title}"`, target_id: deal.deal_id });
    await deal.destroy();
    return res.json({ message: 'Deal deleted', dealId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

