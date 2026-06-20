// Simple utility to calculate expected return
module.exports = function calculateReturn(amount, profitPercent) {
  return amount + (amount * profitPercent / 100);
};