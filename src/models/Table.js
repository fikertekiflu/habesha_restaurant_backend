import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    zone: {
      type: String,
      enum: ['Indoor', 'Terrace', 'VIP', 'Balcony'],
      default: 'Indoor',
    },
    capacity: {
      type: Number,
      default: 4,
    },
    qrCodeToken: {
      type: String,
      default: function () {
        return `tbl_${this.tableNumber}_${Math.random().toString(36).substring(2, 9)}`;
      },
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'call_waiter', 'bill_requested'],
      default: 'available',
    },
    activeSessionId: {
      type: String,
      default: null,
    },
    currentWaiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastCallAt: {
      type: Date,
      default: null,
    },
    lastBillRequestAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Table = mongoose.model('Table', tableSchema);
