import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const Message = sequelize.define(
  'Message',
  {
    message_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },

    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },

    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      // simple status for future expansion (read/unread, archived, etc.)
      type: DataTypes.ENUM('sent', 'read'),
      defaultValue: 'sent',
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Associations (for eager loading convenience)
User.hasMany(Message, { as: 'sent_messages', foreignKey: 'sender_id' });
User.hasMany(Message, { as: 'received_messages', foreignKey: 'receiver_id' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });

export default Message;

