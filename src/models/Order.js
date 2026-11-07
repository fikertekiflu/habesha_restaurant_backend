import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true },
  },
  price: {
    type: Number,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending',
  },
});

const splitPaymentSchema = new mongoose.Schema({
  guestName: String,
  method: {
    type: String,
    enum: ['telebirr', 'cbe_transfer', 'awash_transfer', 'cash'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  referenceCode: String,
  status: {
    type: String,
    enum: ['pending', 'verified'],
    default: 'pending',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery'],
      required: true,
      default: 'dine_in',
    },
    tableNumber: {
      type: Number,
      default: null,
    },
    customer: {
      name: { type: String, default: 'Guest' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'pending', // Waiting waiter approval (or direct to kitchen)
        'approved', // Waiter approved
        'preparing', // Kitchen cooking
        'ready', // Food plated
        'served', // Served to table
        'out_for_delivery', // With courier
        'delivered', // Handed to customer
        'settled', // Bill paid & closed by cashier
        'cancelled', // Cancelled / voided
      ],
      default: 'pending',
    },
    payment: {
      method: {
        type: String,
        enum: ['telebirr', 'cbe_transfer', 'awash_transfer', 'cash', 'split', 'unpaid'],
        default: 'unpaid',
      },
      referenceCode: {
        type: String,
        default: '',
      },
      screenshotUrl: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'refunded'],
        default: 'pending',
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      splits: [splitPaymentSchema],
    },
    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    driverLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    timeline: {
      createdAt: { type: Date, default: Date.now },
      approvedAt: Date,
      preparingAt: Date,
      readyAt: Date,
      servedAt: Date,
      deliveredAt: Date,
      settledAt: Date,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
