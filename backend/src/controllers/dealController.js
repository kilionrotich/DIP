// backend/src/controllers/dealController.js
import Deal from '../models/Deal.js';

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

// Cancel/delete deal (admin/super-admin)
export async function cancelDeal(req, res) {
  try {
    const { dealId } = req.params;
    const { hardDelete = false } = req.body || {};

    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Soft close: for safety + mirrors “cancel” semantics
    if (!hardDelete) {
      if (deal.status !== 'open') {
        return res.status(400).json({ error: 'Deal is not active' });
      }
      await deal.update({ status: 'closed' });
      return res.json({ message: 'Deal cancelled (closed)', deal });
    }

    // Hard delete
    await deal.destroy();
    return res.json({ message: 'Deal deleted', dealId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

