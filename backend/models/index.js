const User = require('./User');
const FeatureClick = require('./FeatureClick');

// Define associations
User.hasMany(FeatureClick, { foreignKey: 'user_id' });
FeatureClick.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  FeatureClick
};