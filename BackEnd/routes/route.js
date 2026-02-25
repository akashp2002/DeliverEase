const express = require("express");
const router = express.Router();
const axios = require("axios");

const ORS_API_KEY = process.env.ORS_API_KEY;

// POST /api/route/distance  (kept for backward compatibility)
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
    res.json({ success: true, distance });

  } catch (error) {
    console.error("ORS /distance ERROR:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to calculate road distance",
      error: error.response?.data || error.message,
    });
  }
});

// POST /api/route/matrix
// Accepts: { locations: [{lat, lng}, ...] }
// Returns: { success: true, distances: [[...], ...] } — full NxN matrix in km
// ONE API call replaces N*N individual /distance calls — fixes rate limit errors.
router.post("/matrix", async (req, res) => {
  try {
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return res.status(400).json({
        success: false,
        message: "locations array with at least 2 points is required",
      });
    }

    // ORS Matrix expects [[lng, lat], [lng, lat], ...]
    const coordinates = locations.map((loc) => [
      parseFloat(loc.lng),
      parseFloat(loc.lat),
    ]);

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/matrix/driving-car",
      {
        locations: coordinates,
        metrics: ["distance"],
        resolve_locations: false,
        units: "km",
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // distances is a 2D array in km
    const distances = response.data.distances;

    res.json({ success: true, distances });

  } catch (err) {
    console.error("❌ ORS /matrix ERROR:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "ORS Matrix API failed",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
