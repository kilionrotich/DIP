// backend/src/models/AuditLog.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const AuditLog = sequelize.define('AuditLog', {
  log_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  target_id: {
    type: DataTypes.INTEGER,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
});

// Associations
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

export default AuditLog;