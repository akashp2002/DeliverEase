const express = require('express');
const router = express.Router();
const {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgentStatus,
  updateAgent,
  deleteAgent,
  updateAgentAssignments,
} = require('../controllers/agentController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

/**
 * GET /api/agents
 * Get all delivery agents
 */
router.get('/', verifyToken, getAllAgents);

/**
 * GET /api/agents/:id
 * Get single agent by ID
 */
router.get('/:id', verifyToken, getAgentById);

/**
 * POST /api/agents
 * Create a new agent (admin only)
 */
router.post('/', verifyToken, verifyAdmin, createAgent);

/**
 * PUT /api/agents/:id/status
 * Update agent status (admin only)
 */
router.put('/:id/status', verifyToken, verifyAdmin, updateAgentStatus);

/**
 * PUT /api/agents/:id
 * Update agent information (admin only)
 */
router.put('/:id', verifyToken, verifyAdmin, updateAgent);

/**
 * PUT /api/agents/:id/assignments
 * Update agent assignments (admin only)
 */
router.put('/:id/assignments', verifyToken, verifyAdmin, updateAgentAssignments);

/**
 * DELETE /api/agents/:id
 * Delete an agent (admin only)
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteAgent);

module.exports = router;
