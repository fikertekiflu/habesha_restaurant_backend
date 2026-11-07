import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';

// @desc    Get all tables with live status and active orders
// @route   GET /api/tables
// @access  Private (Staff)
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort('tableNumber');
    const activeOrders = await Order.find({
      type: 'dine_in',
      status: { $nin: ['settled', 'cancelled'] },
    });

    const populated = tables.map((tbl) => {
      const orders = activeOrders.filter((o) => o.tableNumber === tbl.tableNumber);
      return {
        ...tbl.toObject(),
        orders,
      };
    });

    res.status(200).json({ success: true, count: populated.length, tables: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get specific table details (used by Customer QR scan)
// @route   GET /api/tables/:number
// @access  Public
export const getTableByNumber = async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const table = await Table.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({ success: false, error: `Table ${tableNumber} not found` });
    }

    const activeOrders = await Order.find({
      tableNumber,
      status: { $nin: ['settled', 'cancelled'] },
    });

    res.status(200).json({
      success: true,
      table,
      activeOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Customer triggers "Call Waiter"
// @route   POST /api/tables/:number/call
// @access  Public
export const callWaiter = async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const table = await Table.findOne({ tableNumber });

    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

    table.status = 'call_waiter';
    table.lastCallAt = new Date();
    await table.save();

    const io = req.app.get('io');
    if (io) {
      io.to('room:waiter').emit('alert:call_waiter', {
        tableNumber,
        timestamp: table.lastCallAt,
      });
      io.emit('table:status', { tableNumber, status: 'call_waiter' });
    }

    res.status(200).json({ success: true, message: 'Waiter has been notified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Customer triggers "Request Bill"
// @route   POST /api/tables/:number/bill
// @access  Public
export const requestBill = async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const table = await Table.findOne({ tableNumber });

    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

    table.status = 'bill_requested';
    table.lastBillRequestAt = new Date();
    await table.save();

    const io = req.app.get('io');
    if (io) {
      io.to('room:waiter').emit('alert:bill_requested', {
        tableNumber,
        timestamp: table.lastBillRequestAt,
      });
      io.to('room:cashier').emit('alert:bill_requested', {
        tableNumber,
        timestamp: table.lastBillRequestAt,
      });
      io.emit('table:status', { tableNumber, status: 'bill_requested' });
    }

    res.status(200).json({ success: true, message: 'Bill requested. Waiter on the way' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Clear / Reset table to Available
// @route   POST /api/tables/:number/clear
// @access  Private (Staff)
export const clearTable = async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const table = await Table.findOne({ tableNumber });

    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

    table.status = 'available';
    table.activeSessionId = null;
    table.lastCallAt = null;
    table.lastBillRequestAt = null;
    await table.save();

    const io = req.app.get('io');
    if (io) io.emit('table:status', { tableNumber, status: 'available' });

    res.status(200).json({ success: true, message: `Table ${tableNumber} cleared` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
