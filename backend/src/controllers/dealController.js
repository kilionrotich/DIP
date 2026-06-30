// backend/src/controllers/dealController.js
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';

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

    // Normalize numeric fields
    amount_required = amount_required === '' || amount_required == null ? null : Number(amount_required);
    fixed_amount = fixed_amount === '' || fixed_amount == null ? null : Number(fixed_amount);
    expected_return = expected_return === '' || expected_return == null ? null : Number(expected_return);

    if (!Number.isFinite(amount_required)) amount_required = null;
    if (!Number.isFinite(fixed_amount)) fixed_amount = null;
    if (!Number.isFinite(expected_return)) expected_return = null;

    // Derive missing values
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
      status: status || 'open', // default lifecycle start
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all deals (Investors/Admin)
export async function getDeals(req, res) {
  try {
    const { status, sector, roi_min, roi_max, deadline, risk } = req.query;

    const where = {};
    if (status) {
      // Support comma-separated status values (e.g., "completed,cancelled")
      const statuses = status.split(',').map(s => s.trim());
      where.status = statuses.length > 1 ? statuses : status;
    }

    if (deadline) {
      const dt = new Date(deadline);
      if (!Number.isNaN(dt.getTime())) {
        where.end_date = where.end_date || {};
        where.end_date["$lte"] = dt;
      }
    }

    const deals = await Deal.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [['deal_id', 'DESC']],
    });

    const roiMin = roi_min !== undefined ? Number(roi_min) : null;
    const roiMax = roi_max !== undefined ? Number(roi_max) : null;

    const filtered = deals.filter((d) => {
      const expected = Number(d.expected_return);
      const required = Number(d.amount_required ?? d.fixed_amount);

      if (roiMin === null && roiMax === null) return true;
      if (!Number.isFinite(expected) || !Number.isFinite(required) || required <= 0) return false;

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

// Update deal (Admin)
export async function updateDeal(req, res) {
  try {
    const { dealId } = req.params;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const { title, description, amount_required, expected_return, fixed_amount, start_date, end_date } = req.body;

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

// Cancel/delete deal (Admin)
export async function cancelDeal(req, res) {
  try {
    const { dealId } = req.params;
    const { hardDelete = false } = req.body || {};
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (!hardDelete) {
      if (deal.status === 'completed') {
        return res.status(400).json({ error: 'Completed deals cannot be cancelled' });
      }
      await deal.update({ status: 'cancelled' });
      return res.json({ message: 'Deal cancelled', deal });
    }

    await deal.destroy();
    return res.json({ message: 'Deal deleted', dealId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Approve deal (Admin)
export async function approveDeal(req, res) {
  try {
    const { dealId } = req.params;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status !== 'open') {
      return res.status(400).json({ error: 'Only open deals can be approved' });
    }

    await deal.update({ status: 'approved' });
    return res.json({ message: 'Deal approved', deal });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Close deal (Admin)
export async function closeDeal(req, res) {
  try {
    const { dealId } = req.params;
    const deal = await Deal.findByPk(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status !== 'approved' && deal.status !== 'active') {
      return res.status(400).json({ error: 'Only approved/active deals can be closed' });
    }

    await deal.update({ status: 'completed' });
    return res.json({ message: 'Deal closed', deal });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}