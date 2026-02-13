const Delivery = require('../models/Delivery');
const DeliveryAgent = require('../models/DeliveryAgent');

/**
 * Get all deliveries with optional filters
 */
const getAllDeliveries = async (req, res) => {
  try {
    const { status, area, agentId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (area) filter.area = area;
    if (agentId) filter.agentId = agentId;

    const deliveries = await Delivery.find(filter)
      .populate('agentId', 'name email phone status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: error.message,
    });
  }
};

/**
 * Get single delivery by ID
 */
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('agentId');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery',
      error: error.message,
    });
  }
};

/**
 * Get deliveries for a specific agent
 */
const getDeliveriesByAgent = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ agentId: req.params.agentId })
      .populate('agentId', 'name email phone status')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent deliveries',
      error: error.message,
    });
  }
};

/**
 * Create a new delivery
 */
const createDelivery = async (req, res) => {
  try {
    const {
      orderId,
      location,
      scheduledDate,
      scheduledTime,
      agentId,
      area,
      priority,
      packageWeight,
    } = req.body;

    // Validate required main fields
    if (!orderId || !location || !scheduledDate || !area || !packageWeight) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, location, scheduledDate, area, packageWeight',
      });
    }

    // Validate and clean location data
    const cleanLocation = {
      streetAddress: location.streetAddress?.trim(),
      area: location.area?.trim(),
      city: location.city?.trim(),
      state: location.state?.trim(),
      country: location.country || 'India',
      postalCode: location.postalCode?.trim() || '000000',
      landmark: location.landmark || null,
      customerName: location.customerName?.trim(),
      phone: location.phone?.trim() || '0000000000',
      notes: location.notes || null,
      lat: parseFloat(location.lat), // Convert to number
      lng: parseFloat(location.lng),  // Convert to number
    };

    // Validate required fields after cleaning
    const missingFields = [];
    if (!cleanLocation.streetAddress) missingFields.push('streetAddress');
    if (!cleanLocation.area) missingFields.push('area');
    if (!cleanLocation.city) missingFields.push('city');
    if (!cleanLocation.state) missingFields.push('state');
    if (!cleanLocation.customerName) missingFields.push('customerName');
    if (isNaN(cleanLocation.lat)) missingFields.push('lat (must be a valid number)');
    if (isNaN(cleanLocation.lng)) missingFields.push('lng (must be a valid number)');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate coordinates are valid numbers
    if (typeof cleanLocation.lat !== 'number' || typeof cleanLocation.lng !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers',
      });
    }

    // Check if orderId already exists
    const existingDelivery = await Delivery.findOne({ orderId });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery with this orderId already exists',
      });
    }

    // Validate agentId if provided - must be valid MongoDB ObjectId format
    let validAgentId = null;
    if (agentId && typeof agentId === 'string' && agentId.trim()) {
      const trimmedAgentId = agentId.trim();
      // Check if it's a valid MongoDB ObjectId (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(trimmedAgentId)) {
        validAgentId = trimmedAgentId;
      } else {
        // Invalid ObjectId format - log warning but don't break the request
        console.warn(`⚠️ Invalid agentId format: "${trimmedAgentId}". Expected 24-character hex string. Proceeding without agent assignment.`);
      }
    }

    const delivery = new Delivery({
      orderId,
      location: cleanLocation, // Use cleaned location data
      scheduledDate,
      scheduledTime: scheduledTime || '10:00 AM',
      status: 'pending',
      agentId: validAgentId || null, // Only set if valid ObjectId, otherwise null
      area,
      priority: priority || 'medium',
      packageWeight,
    });

    await delivery.save();
    
    // Populate agent data if agentId is provided
    if (delivery.agentId) {
      await delivery.populate('agentId', 'name email phone status');
    }

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery,
    });
  } catch (error) {
    console.error('❌ DELIVERY CREATION ERROR:');
    console.error('Message:', error.message);
    console.error('Full Error:', error);
    
    // Better error messaging for validation errors
    let errorMessage = 'Error creating delivery';
    if (error.errors) {
      const fieldErrors = Object.keys(error.errors)
        .map(key => `${key}: ${error.errors[key].message}`)
        .join('; ');
      errorMessage = fieldErrors;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

/**
 * Update delivery status
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'in-transit', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, in-transit, delivered, failed)',
      });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('agentId', 'name email phone status');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      error: error.message,
    });
  }
};

/**
 * Assign delivery to an agent
 */
const assignDeliveryToAgent = async (req, res) => {
  try {
    const { agentId } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { agentId },
      { new: true }
    ).populate('agentId', 'name email phone status');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery assigned to agent successfully',
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning delivery',
      error: error.message,
    });
  }
};

/**
 * Update delivery information
 */
const updateDelivery = async (req, res) => {
  try {
    const { location, scheduledDate, scheduledTime, priority, area } = req.body;

    const updateData = {};
    if (location) updateData.location = location;
    if (scheduledDate) updateData.scheduledDate = scheduledDate;
    if (scheduledTime) updateData.scheduledTime = scheduledTime;
    if (priority) updateData.priority = priority;
    if (area) updateData.area = area;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('agentId', 'name email phone status');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating delivery',
      error: error.message,
    });
  }
};

/**
 * Delete a delivery
 */
const deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      message: 'Delivery deleted successfully',
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery',
      error: error.message,
    });
  }
};

/**
 * Get delivery statistics
 */
const getDeliveryStats = async (req, res) => {
  try {
    const totalDeliveries = await Delivery.countDocuments();
    const completedDeliveries = await Delivery.countDocuments({ status: 'delivered' });
    const pendingDeliveries = await Delivery.countDocuments({ status: 'pending' });
    const inTransitDeliveries = await Delivery.countDocuments({ status: 'in-transit' });
    const failedDeliveries = await Delivery.countDocuments({ status: 'failed' });

    res.json({
      success: true,
      data: {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        inTransitDeliveries,
        failedDeliveries,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  getDeliveriesByAgent,
  createDelivery,
  updateDeliveryStatus,
  assignDeliveryToAgent,
  updateDelivery,
  deleteDelivery,
  getDeliveryStats,
};
