const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    unique: true, 
    required: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  role: { 
    type: String, 
    enum: ["admin", "agent"], 
    required: true 
  },

  // Agent-specific fields
  phone: { 
    type: String 
  },

  status: { 
    type: String, 
    enum: ["available", "on-delivery", "off-duty"],
    default: "available"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
