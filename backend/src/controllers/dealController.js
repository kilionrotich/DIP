// backend/src/controllers/dealController.js
import Deal from '../models/Deal.js';

// Create a new deal (Admin only)
export async function createDeal(req, res) {
  try {
    const { title, description, amount_required, fixed_amount, expected_return, start_date, end_date, status } = req.body;

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
      // ROI % = (expected_return - amount_required) / amount_required * 100
      // amount_required may be missing in some seed/data; fallback to fixed_amount if needed.
      const expected = Number(d.expected_return);
      const required = Number(d.amount_required ?? d.fixed_amount);
      if (!Number.isFinite(expected) || !Number.isFinite(required) || required <= 0) {
        return roiMin === null && roiMax === null; // keep only if no ROI filter
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

