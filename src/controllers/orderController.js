import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Setting } from '../models/Setting.js';

// Helper to generate sequential order number
const getNextOrderNumber = async () => {
  const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
  return lastOrder ? lastOrder.orderNumber + 1 : 101;
};

// @desc    Create new order (Dine-in, Takeaway, Delivery)
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const { type, tableNumber, customer, items, payment } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Your cart is empty' });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId || item.id);
      if (!dbItem || !dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          error: `Item '${item.name?.en || 'Food'}' is unavailable or out of stock`,
        });
      }
      const qty = Math.max(1, parseInt(item.qty) || 1);
      totalAmount += dbItem.price * qty;

      validatedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        qty,
        notes: item.notes || '',
        status: 'pending',
      });
    }

    const settings = await Setting.findOne();
    const isDirectRouting = settings?.directKitchenRouting || false;

    // Direct routing bypasses waiter; otherwise waits for waiter approval
    const initialStatus = isDirectRouting ? 'preparing' : 'pending';

    const orderNumber = await getNextOrderNumber();

    const order = await Order.create({
      orderNumber,
      type: type || 'dine_in',
      tableNumber: tableNumber ? parseInt(tableNumber) : null,
      customer: customer || {},
      items: validatedItems,
      totalAmount,
      status: initialStatus,
      payment: payment || { method: 'unpaid', status: 'pending' },
      timeline: {
        createdAt: new Date(),
        preparingAt: isDirectRouting ? new Date() : null,
      },
    });

    // Update table status if dine-in
    if (tableNumber) {
      await Table.findOneAndUpdate(
        { tableNumber: parseInt(tableNumber) },
        { status: 'occupied' }
      );
    }

    // Emit live socket event
    const io = req.app.get('io');
    if (io) {
      if (initialStatus === 'preparing') {
        io.to('room:kitchen').emit('kds:new_ticket', order);
      } else {
        io.to('room:waiter').emit('order:pending_approval', order);
      }
      io.to('room:admin').emit('order:created', order);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update order status in prep/delivery pipeline
// @route   PATCH /api/orders/:id/status
// @access  Private (Staff)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.status = status;
    const now = new Date();

    if (status === 'approved') {
      order.timeline.approvedAt = now;
      order.status = 'preparing'; // Move straight to kitchen queue
      order.timeline.preparingAt = now;
    } else if (status === 'ready') {
      order.timeline.readyAt = now;
    } else if (status === 'served') {
      order.timeline.servedAt = now;
    } else if (status === 'delivered') {
      order.timeline.deliveredAt = now;
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`order:${order._id}`, { status: order.status });
      if (status === 'approved' || status === 'preparing') {
        io.to('room:kitchen').emit('kds:new_ticket', order);
      } else if (status === 'ready') {
        io.to('room:waiter').emit('alert:order_ready', {
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
        });
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cashier strictly verifies Telebirr/Bank payment reference and settles bill
// @route   POST /api/orders/:id/settle
// @access  Private (Cashier, Admin, Manager)
export const settlePayment = async (req, res) => {
  try {
    const { method, referenceCode, splits } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.payment = {
      method: method || order.payment.method,
      referenceCode: referenceCode || order.payment.referenceCode,
      status: 'verified',
      verifiedBy: req.user?._id,
      verifiedAt: new Date(),
      splits: splits || [],
    };

    order.status = 'settled';
    order.timeline.settledAt = new Date();
    await order.save();

    // If dine in, check if all orders for this table are settled
    if (order.tableNumber) {
      const remainingUnsettled = await Order.countDocuments({
        tableNumber: order.tableNumber,
        status: { $nin: ['settled', 'cancelled'] },
      });
      if (remainingUnsettled === 0) {
        await Table.findOneAndUpdate(
          { tableNumber: order.tableNumber },
          { status: 'available', activeSessionId: null }
        );
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit(`order:${order._id}`, { status: 'settled', payment: order.payment });
      io.to('room:cashier').emit('order:settled', { orderId: order._id, tableNumber: order.tableNumber });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order settled successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all orders with filter
// @route   GET /api/orders
// @access  Private (Staff)
export const getOrders = async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Driver streams live GPS location
// @route   POST /api/orders/:id/driver-location
// @access  Private (Driver)
export const updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.driverLocation = { lat: parseFloat(lat), lng: parseFloat(lng), updatedAt: new Date() };
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`driver:location:${order._id}`, order.driverLocation);
    }

    res.status(200).json({ success: true, location: order.driverLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
