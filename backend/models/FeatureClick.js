const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeatureClick = sequelize.define('FeatureClick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  feature_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['date_filter', 'gender_filter', 'age_filter', 'bar_chart_click', 'line_chart_click']]
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

module.exports = FeatureClick;