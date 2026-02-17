const express = require("express");
const router = express.Router();
const axios = require("axios");

const ORS_API_KEY = process.env.ORS_API_KEY;

// POST /api/route/distance
router.post("/distance", async (req, res) => {
  try {
    const { from, to } = req.body;

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const distance = response.data.routes[0].summary.distance / 1000; // km

    res.json({ distance });
  } catch (error) {
    console.error("ORS ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to calculate road distance",
    });
  }
});

module.exports = router;
