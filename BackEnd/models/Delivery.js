const mongoose = require('mongoose');

const DeliveryLocationSchema = new mongoose.Schema(
  {
    // Structured address fields (replaces old single 'address' field)
    streetAddress: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: 'India',
    },
    postalCode: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
      default: null,
    },
    // GPS coordinates
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    // Customer info
    customerName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);

const DeliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: DeliveryLocationSchema,
      required: true,
    },
    scheduledDate: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-transit', 'delivered', 'failed'],
      default: 'pending',
    },
    agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    },
    area: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    packageWeight: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Delivery', DeliverySchema);
