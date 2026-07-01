// backend/src/controllers/investmentController.js
import Deal from '../models/Deal.js';
import Investment from '../models/Investment.js';
import { Op, UniqueConstraintError } from 'sequelize';

// Investor commits to a deal (creates investment, status = pending)
export async function commitInvestment(req, res) {
  try {
    const { investor_id: bodyInvestorId, deal_id: bodyDealId, amount, amount_invested, mpesa_code, proof_url } = req.body;
    const deal_id = Number(req.params.dealId || bodyDealId);
    const investor_id = Number(bodyInvestorId || req.user?.id || req.user?.user_id);

    if (!investor_id || !deal_id) {
      return res.status(400).json({ error: 'investor_id and deal_id are required' });
    }

    const amountToSave = amount !== undefined ? Number(amount) : Number(amount_invested);
    if (!Number.isFinite(amountToSave) || amountToSave <= 0) {
      return res.status(400).json({ error: 'amount must be a valid number greater than 0' });
    }

    // Ensure deal exists and is open for investment
    const deal = await Deal.findByPk(deal_id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (deal.status !== 'open') {
      return res.status(400).json({ error: `Deal is not open for investment (status: ${deal.status})` });
    }

    const existingInvestment = await Investment.findOne({
      where: {
        deal_id,
        status: { [Op.in]: ['pending', 'active', 'completed'] },
      }
    });
    if (existingInvestment) {
      return res.status(400).json({ error: 'This deal already has a committed investor' });
    }

    const investment = await Investment.create({
      investor_id,
      deal_id,
      amount_invested: amountToSave,
      mpesa_code,
      proof_url,
      status: 'pending'
    });

    // one deal, one client: first commitment locks deal out of available list
    await deal.update({ status: 'pending' });

    res.status(201).json({ message: 'Investment committed successfully', investment });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(400).json({ error: 'This deal already has a committed investor' });
    }
    res.status(500).json({ error: err.message });
  }
}

// Admin verifies investment (status = active, deal = active)
export async function verifyInvestment(req, res) {
  try {
    const investmentId = req.params.id || req.params.investmentId;
    const investment = await Investment.findByPk(investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    if (investment.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending investments can be verified' });
    }

    // Update investment status to active
    await investment.update({ status: 'active' });

    // Ensure parent deal stays active once verified
    const deal = await Deal.findByPk(investment.deal_id);
    if (deal && (deal.status === 'open' || deal.status === 'pending')) {
      await deal.update({ status: 'active' });
    }

    return res.json({ message: 'Investment verified', investment });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Admin updates profit for an investment (with validation)
export async function updateProfit(req, res) {
  try {
    const investmentId = req.params.id || req.params.investmentId;
    const { profit } = req.body;

    if (profit === undefined) {
      return res.status(400).json({ error: 'Profit amount is required' });
    }

    const investment = await Investment.findByPk(investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    // Check: investment status must be active
    if (investment.status !== 'active') {
      return res.status(400).json({ error: `Investment status must be 'active' to update profit (current: ${investment.status})` });
    }

    // Check: deal status must not be cancelled/completed
    const deal = await Deal.findByPk(investment.deal_id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (['cancelled', 'completed'].includes(deal.status)) {
      return res.status(400).json({ error: `Cannot update profit for deal with status '${deal.status}'` });
    }

    // All validations passed - update profit
    await investment.update({ profit });
    return res.json({ message: 'Profit updated', investment });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Existing: Create a new investment (legacy direct creation)
export async function createInvestment(req, res) {
  try {
    const { investor_id, deal_id, amount_invested } = req.body;

    const deal = await Deal.findByPk(deal_id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const investment = await Investment.create({
      investor_id,
      deal_id,
      amount_invested,
      status: 'pending' // normalize legacy creation into pending
    });

    await deal.update({ status: 'pending' });

    res.status(201).json(investment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all investments (filter by investor_id and status)
export async function getInvestments(req, res) {
  try {
    const { status } = req.query;
    const investor_id = req.user?.id ?? req.user?.user_id;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    const where = {};
    if (!isAdmin && investor_id) where.investor_id = investor_id;
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      where.status = statuses.length > 1 ? statuses : status;
    }

    const investments = await Investment.findAll({
      where: Object.keys(where).length ? where : undefined,
      include: [Deal],
      order: [['investment_id', 'DESC']],
    });

    res.status(200).json({ investments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get Available Opportunities for investor (open deals without investor's commitment)
export async function getAvailableDeals(req, res) {
  try {
    const investor_id = req.user?.id ?? req.user?.user_id;
    
    // Find all open deals
    const deals = await Deal.findAll({
      where: { status: 'open' },
      order: [['deal_id', 'DESC']],
    });

    // Filter out deals where this investor already has an investment
    const availableDeals = [];
    for (const deal of deals) {
      const existing = await Investment.findOne({
        where: {
          deal_id: deal.deal_id,
          investor_id,
          status: { [Op.in]: ['pending', 'active'] }
        }
      });
      if (!existing) {
        availableDeals.push(deal);
      }
    }

    res.json(availableDeals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

