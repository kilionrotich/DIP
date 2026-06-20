import { sequelize } from './config/db.js';
import User from './models/User.js';
import Deal from './models/Deal.js';
import Investment from './models/Investment.js';
import Profit from './models/Profit.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Drop & recreate tables for clean seed
    await sequelize.sync({ force: true });

    // Create sample users
    const investor = await User.create({
      username: 'investor1',   // ✅ required
      email: 'investor@example.com',
      password: 'hashedpassword' // use bcrypt in real app
    });

    const admin = await User.create({
      username: 'admin1',      // ✅ required
      email: 'admin@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    // Create sample deals
    const deal1 = await Deal.create({
      title: 'Real Estate Project',
      description: 'Luxury apartments in Eldoret',
      amountRequired: 500000,
      status: 'open'
    });

    const deal2 = await Deal.create({
      title: 'AgriTech Startup',
      description: 'Smart irrigation systems',
      amountRequired: 200000,
      status: 'open'
    });

    // Investor invests in deal1
    await Investment.create({
      investor_id: investor.id,
      deal_id: deal1.id,
      amount: 100000
    });

    // Add profit record
    await Profit.create({
      investor_id: investor.id,
      totalProfit: 15000
    });

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();