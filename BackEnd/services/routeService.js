const express = require("express");
const router = express.Router();
const axios = require("axios");

const ORS_API_KEY = process.env.ORS_API_KEY;

// POST /api/route/distance
router.post("/distance", async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to coordinates required",
      });
    }

   try {
  const response = await axios.post(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat]
      ]
    },
    {
      headers: {
        Authorization: process.env.ORS_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const distance = response.data.routes[0].summary.distance / 1000;
  res.json({ success: true, distance });

} catch (err) {
  console.error("❌ ORS API ERROR:", err.response?.data || err.message);

  res.status(500).json({
    success: false,
    message: "ORS API failed",
    error: err.response?.data || err.message
  });
}

    const distanceMeters =
      response.data.features[0].properties.summary.distance;

    res.json({
      success: true,
      distance: distanceMeters / 1000, // convert to KM
    });

  } catch (error) {
    console.error("🔥 ORS API ERROR:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Failed to calculate road distance",
      error: error.message,
    });
  }
});

module.exports = router;
