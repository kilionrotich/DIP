import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

import User from './User.js';
import Admin from './Admin.js';

const InvestorAdmin = sequelize.define(
  'InvestorAdmin',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    investor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },

    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'admin_id',
      },
      onDelete: 'CASCADE',
    },

    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'investor_admins',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['investor_id', 'admin_id'],
      },
      {
        fields: ['investor_id'],
      },
      {
        fields: ['admin_id'],
      },
    ],
  }
);

// Associations
User.hasMany(InvestorAdmin, { foreignKey: 'investor_id', as: 'investor_admins' });
InvestorAdmin.belongsTo(User, { foreignKey: 'investor_id', as: 'investor' });

Admin.hasMany(InvestorAdmin, { foreignKey: 'admin_id', as: 'admin_investors' });
InvestorAdmin.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

export default InvestorAdmin;

