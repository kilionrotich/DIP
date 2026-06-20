// backend/src/models/Profit.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const Profit = sequelize.define('Profit', {
  profit_id: {   // ✅ clearer PK name
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  investor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',   // ✅ matches User.js table name
      key: 'user_id',   // ✅ matches PK in User.js
    },
  },
  total_profit: {       // ✅ snake_case for DB consistency
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'profits',
  timestamps: true,
});

// Associations
User.hasMany(Profit, { foreignKey: 'investor_id' });
Profit.belongsTo(User, { foreignKey: 'investor_id' });

export default Profit;