// backend/src/models/PaymentProof.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Investment from './Investment.js';
import User from './User.js';

const PaymentProof = sequelize.define('PaymentProof', {
  proof_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  transaction_id: {
    type: DataTypes.STRING,
  },
  file_url: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  verified_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'payment_proofs',   // ✅ lowercase table name
  timestamps: true,
});

// Associations
Investment.hasOne(PaymentProof, { foreignKey: 'investment_id' });
PaymentProof.belongsTo(Investment, { foreignKey: 'investment_id' });

User.hasMany(PaymentProof, { foreignKey: 'verified_by' });
PaymentProof.belongsTo(User, { foreignKey: 'verified_by' });

export default PaymentProof;