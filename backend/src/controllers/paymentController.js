// backend/src/controllers/paymentController.js
import Payment from '../models/Payment.js';
import Investment from '../models/Investment.js';


// Create a new payment
export async function createPayment(req, res) {
  try {
    const { investment_id, amount, method } = req.body;

    // Ensure investment exists
    const investment = await Investment.findByPk(investment_id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Create payment
    const payment = await Payment.create({
      investment_id,
      amount,
      method
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all payments
export async function getPayments(req, res) {
  try {
    const payments = await Payment.findAll({
      include: [Investment]
    });

    res.status(200).json({ payments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}