const express = require('express');
const { Sequelize } = require('sequelize');
const { FeatureClick, User } = require('../models');
const authenticate = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, ageGroup, gender, selectedFeature } = req.query;

    // Build where clause for filtering
    const whereClause = {};
    const userWhereClause = {};

    // Date filter
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.timestamp[Sequelize.Op.lte] = new Date(endDate);
    }

    // Demographics filters
    if (ageGroup) {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      switch(ageGroup) {
        case '<18':
          userWhereClause.age = { [Sequelize.Op.lt]: 18 };
          break;
        case '18-40':
          userWhereClause.age = { [Sequelize.Op.between]: [18, 40] };
          break;
        case '>40':
          userWhereClause.age = { [Sequelize.Op.gt]: 40 };
          break;
      }
    }

    if (gender && gender !== 'All') {
      userWhereClause.gender = gender;
    }

    // Get users matching demographics
    let userIds = [];
    if (Object.keys(userWhereClause).length > 0) {
      const users = await User.findAll({ where: userWhereClause, attributes: ['id'] });
      userIds = users.map(u => u.id);
      if (userIds.length > 0) {
        whereClause.user_id = { [Sequelize.Op.in]: userIds };
      } else {
        // No users match demographics, return empty data
        return res.json({
          barChartData: [],
          lineChartData: []
        });
      }
    }

    // Bar chart data: Total clicks per feature
    const barChartData = await FeatureClick.findAll({
      where: whereClause,
      attributes: [
        'feature_name',
        [Sequelize.fn('COUNT', Sequelize.col('feature_name')), 'total_clicks']
      ],
      group: ['feature_name'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('feature_name')), 'DESC']]
    });

    // Line chart data: Daily clicks for selected feature or all features
    const lineWhereClause = { ...whereClause };
    if (selectedFeature) {
      lineWhereClause.feature_name = selectedFeature;
    }

    const lineChartData = await FeatureClick.findAll({
      where: lineWhereClause,
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('timestamp')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'click_count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('timestamp'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('timestamp')), 'ASC']],
      limit: 30 // Last 30 days
    });

    res.json({
      barChartData: barChartData.map(item => ({
        feature_name: item.feature_name,
        total_clicks: parseInt(item.dataValues.total_clicks)
      })),
      lineChartData: lineChartData.map(item => ({
        date: item.dataValues.date,
        click_count: parseInt(item.dataValues.click_count)
      }))
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;