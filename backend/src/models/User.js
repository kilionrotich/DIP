// backend/src/models/User.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  user_id: {   // ✅ consistent PK name
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,   // ✅ enforce unique usernames
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'investor'),
    defaultValue: 'investor',
  },
}, {
  tableName: 'users',   // ✅ lowercase table name
  timestamps: true,
});

export default User;