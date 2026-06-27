// backend/src/models/Deal.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';   // ✅ use named import

const Deal = sequelize.define('Deal', {
  deal_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  amount_required: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  // Fixed amount investors must commit (prevents partial/custom investments)
  fixed_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  expected_return: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'approved', 'closed', 'cancelled', 'completed'),
    defaultValue: 'open',
  },
}, {
  tableName: 'deals',
  timestamps: true,
});

export default Deal;