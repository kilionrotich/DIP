import { sequelize } from './config/db.js';
import bcrypt from 'bcryptjs';
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
    const superAdminPasswordHash = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await User.create({
      username: 'kilion',
      email: 'kilionkimurgor@gmail.com',
      password: superAdminPasswordHash,
      role: 'super_admin',
    });

    const investorPasswordHash = await bcrypt.hash('investor123', 10);
    const investor = await User.create({
      username: 'investor1',
      email: 'investor@example.com',
      password: investorPasswordHash,
      role: 'investor',
    });

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin1',
      email: 'admin@example.com',
      password: adminPasswordHash,
      role: 'admin',
    });

    // Create sample deals
    const now = new Date();
    const inOneYear = new Date(now);
    inOneYear.setFullYear(inOneYear.getFullYear() + 1);

    const deal1 = await Deal.create({
      title: 'Real Estate Project',
      description: 'Luxury apartments in Eldoret',
      amount_required: 500000,
      expected_return: 650000,
      start_date: now,
      end_date: inOneYear,
      status: 'open',
    });

    const deal2 = await Deal.create({
      title: 'AgriTech Startup',
      description: 'Smart irrigation systems',
      amount_required: 200000,
      expected_return: 260000,
      start_date: now,
      end_date: inOneYear,
      status: 'open',
    });

    // Investor invests in deal1 (match Investment model fields)
    await Investment.create({
      investor_id: investor.user_id ?? investor.id,
      deal_id: deal1.deal_id ?? deal1.id,
      amount_invested: 100000,
      expected_return: 150000,
      status: 'active',
    });

    // Add profit record (match Profit model fields)
    await Profit.create({
      investor_id: investor.user_id ?? investor.id,
      total_profit: 15000,
    });


    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();