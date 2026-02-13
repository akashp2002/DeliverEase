const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DeliveryAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'on-delivery', 'off-duty'],
      default: 'available',
    },
    assignedDeliveries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
      },
    ],
    completedDeliveries: {
      type: Number,
      default: 0,
    },
    totalDistance: {
      type: Number,
      default: 0, // in km
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
DeliveryAgentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
DeliveryAgentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('DeliveryAgent', DeliveryAgentSchema);
