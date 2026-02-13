const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get all delivery agents
 */
const getAllAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).select('-password');

    res.json({
      success: true,
      data: agents,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agents',
      error: error.message,
    });
  }
};


/**
 * Get single agent by ID
 */
const getAgentById = async (req, res) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      role: 'agent'
    }).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent',
      error: error.message,
    });
  }
};


/**
 * Create a new agent (Admin only)
 */
const createAgent = async (req, res) => {
  try {
    const { name, email, password, phone, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'agent',
      phone,
      status: status || 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        role: agent.role,
        status: agent.status,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating agent',
      error: error.message,
    });
  }
};


/**
 * Update agent status
 */
const updateAgentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['available', 'on-delivery', 'off-duty'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required (available, on-delivery, off-duty)',
      });
    }

    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'agent' },
      { status },
      { new: true }
    ).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.json({
      success: true,
      message: 'Agent status updated successfully',
      data: agent,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating agent status',
      error: error.message,
    });
  }
};


/**
 * Update agent basic info
 */
const updateAgent = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (email) {
      const existing = await User.findOne({ email });

      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      updateData.email = email;
    }

    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'agent' },
      updateData,
      { new: true }
    ).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: agent,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating agent',
      error: error.message,
    });
  }
};


/**
 * Delete agent
 */
const deleteAgent = async (req, res) => {
  try {
    const agent = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'agent'
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting agent',
      error: error.message,
    });
  }
};


/**
 * Update agent assignments
 */
const updateAgentAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'Assignments array is required',
      });
    }

    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'agent' },
      { assignments },
      { new: true }
    ).select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.json({
      success: true,
      message: 'Agent assignments updated successfully',
      data: agent,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating agent assignments',
      error: error.message,
    });
  }
};


module.exports = {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgentStatus,
  updateAgent,
  deleteAgent,
  updateAgentAssignments,
};
