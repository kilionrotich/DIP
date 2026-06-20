// backend/src/models/Payment.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Investment from './Investment.js';

const Payment = sequelize.define('Payment', {
  payment_id: {   // ✅ clearer PK name
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  investment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'investments',   // ✅ lowercase table name
      key: 'investment_id',   // ✅ matches PK in Investment.js
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),   // ✅ consistent with Investment.js
    allowNull: false,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'payments',   // ✅ lowercase table name
  timestamps: true,
});

// Associations
Investment.hasMany(Payment, { foreignKey: 'investment_id' });
Payment.belongsTo(Investment, { foreignKey: 'investment_id' });

export default Payment;