const express = require('express');
const { FeatureClick } = require('../models');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Track feature click
router.post('/', authenticate, async (req, res) => {
  try {
    const { feature_name } = req.body;

    // Validate feature name
    const validFeatures = ['date_filter', 'gender_filter', 'age_filter', 'bar_chart_click', 'line_chart_click'];
    if (!validFeatures.includes(feature_name)) {
      return res.status(400).json({ error: 'Invalid feature name' });
    }

    // Create click record
    await FeatureClick.create({
      user_id: req.userId,
      feature_name,
      timestamp: new Date()
    });

    res.status(201).json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

module.exports = router;