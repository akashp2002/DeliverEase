const express = require('express');
const router = express.Router();
const {
  getAllDeliveries,
  getDeliveryById,
  getDeliveriesByAgent,
  createDelivery,
  updateDeliveryStatus,
  assignDeliveryToAgent,
  updateDelivery,
  deleteDelivery,
  getDeliveryStats,
} = require('../controllers/deliveryController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

/**
 * GET /api/deliveries
 * Get all deliveries with optional filters
 */
router.get('/', verifyToken, getAllDeliveries);

/**
 * GET /api/deliveries/stats
 * Get delivery statistics
 */
router.get('/stats', verifyToken, getDeliveryStats);

/**
 * GET /api/deliveries/agent/:agentId
 * Get deliveries for a specific agent
 */
router.get('/agent/:agentId', verifyToken, getDeliveriesByAgent);

/**
 * GET /api/deliveries/:id
 * Get single delivery by ID
 */
router.get('/:id', verifyToken, getDeliveryById);

/**
 * POST /api/deliveries
 * Create a new delivery (admin only)
 */
router.post('/', verifyToken, verifyAdmin, createDelivery);

/**
 * PUT /api/deliveries/:id/status
 * Update delivery status
 */
router.put('/:id/status', verifyToken, updateDeliveryStatus);

/**
 * PUT /api/deliveries/:id/assign
 * Assign delivery to agent (admin only)
 */
router.put('/:id/assign', verifyToken, verifyAdmin, assignDeliveryToAgent);

/**
 * PUT /api/deliveries/:id
 * Update delivery information (admin only)
 */
router.put('/:id', verifyToken, verifyAdmin, updateDelivery);

/**
 * DELETE /api/deliveries/:id
 * Delete a delivery (admin only)
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteDelivery);

module.exports = router;
