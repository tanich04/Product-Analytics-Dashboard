const sequelize = require('./config/database');
const { User, FeatureClick } = require('./models');
const bcrypt = require('bcryptjs');

const FEATURES = ['date_filter', 'gender_filter', 'age_filter', 'bar_chart_click', 'line_chart_click'];
const GENDERS = ['Male', 'Female', 'Other'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomAge() {
  const ages = [15, 22, 25, 28, 30, 35, 42, 45, 50, 65];
  return ages[Math.floor(Math.random() * ages.length)];
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if we already have data
    const userCount = await User.count();
    if (userCount > 5) {
      console.log(`📊 Database already has ${userCount} users, skipping seed...`);
      process.exit(0);
    }

    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Create 10 users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        username: `user${i}`,
        password: await bcrypt.hash('password123', 10),
        age: getRandomAge(),
        gender: GENDERS[Math.floor(Math.random() * GENDERS.length)]
      });
      users.push(user);
      console.log(`✅ Created user: ${user.username} (ID: ${user.id})`);
    }

    // Generate clicks for the last 60 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    const clicks = [];
    
    // Generate 200 random clicks
    for (let i = 0; i < 200; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const timestamp = randomDate(startDate, endDate);
      const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
      
      clicks.push({
        user_id: user.id,
        feature_name: feature,
        timestamp: timestamp
      });
    }

    // Sort clicks by timestamp (oldest first)
    clicks.sort((a, b) => a.timestamp - b.timestamp);

    // Bulk insert clicks
    await FeatureClick.bulkCreate(clicks);
    console.log(`✅ Created ${clicks.length} feature clicks`);

    // Add more recent clicks for date_filter
    const recentUsers = users.slice(0, 5);
    const recentClicks = [];
    for (let i = 0; i < 30; i++) {
      const user = recentUsers[Math.floor(Math.random() * recentUsers.length)];
      const timestamp = randomDate(new Date(Date.now() - 7*24*60*60*1000), new Date());
      recentClicks.push({
        user_id: user.id,
        feature_name: 'date_filter',
        timestamp: timestamp
      });
    }
    await FeatureClick.bulkCreate(recentClicks);

    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Total clicks: ${clicks.length + recentClicks.length}`);
    console.log(`   - Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();