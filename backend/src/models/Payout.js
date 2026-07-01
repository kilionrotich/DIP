import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Investment from './Investment.js';
import User from './User.js';

const Payout = sequelize.define('Payout', {
  payout_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  investment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'investments',
      key: 'investment_id',
    },
  },
  capital: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  profit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paid_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
}, {
  tableName: 'payouts',
  timestamps: true,
});

Investment.hasMany(Payout, { foreignKey: 'investment_id' });
Payout.belongsTo(Investment, { foreignKey: 'investment_id' });

User.hasMany(Payout, { foreignKey: 'created_by' });
Payout.belongsTo(User, { foreignKey: 'created_by' });

export default Payout;
