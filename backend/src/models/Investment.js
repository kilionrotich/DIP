// backend/src/models/Investment.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';
import Deal from './Deal.js';

const Investment = sequelize.define('Investment', {
  investment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount_invested: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  expected_return: {
    type: DataTypes.DECIMAL(12, 2),
  },
  investment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed'),
    defaultValue: 'pending',
  },
  profit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  mpesa_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  proof_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  investor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',   // ✅ table name from User.js
      key: 'user_id',   // ✅ matches PK in User.js
    },
  },
  deal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'deals',
      key: 'deal_id',
    },
  },
}, {
  tableName: 'investments',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['deal_id'],
    },
  ],
});

// Associations
User.hasMany(Investment, { foreignKey: 'investor_id' });
Investment.belongsTo(User, { foreignKey: 'investor_id' });

Deal.hasMany(Investment, { foreignKey: 'deal_id' });
Investment.belongsTo(Deal, { foreignKey: 'deal_id' });

export default Investment;