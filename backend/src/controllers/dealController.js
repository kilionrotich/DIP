// backend/src/controllers/dealController.js
import Deal from '../models/Deal.js';

// Create a new deal (Admin only)
export async function createDeal(req, res) {
  try {
    const { title, description, amount_required, expected_return, start_date, end_date, status } = req.body;

    const deal = await Deal.create({
      title,
      description,
      amount_required,
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
    const deals = await Deal.findAll();
    res.json(deals);
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

