require('dotenv').config();
const mongoose = require('mongoose');
const ROLE = require('./model/role');
const STAFF = require('./model/staff');
const CUSTOMIZATIONTYPE = require('./model/customizationType');
const { encryptData } = require('./utils/crypto');
const { LEAD_STATUSES } = require('./constants/leadStatus');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await ROLE.deleteMany({});
    await STAFF.deleteMany({});
    await CUSTOMIZATIONTYPE.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin Role
    const adminRole = await ROLE.create({
      roleName: 'Admin',
      allowedStatuses: LEAD_STATUSES,
      canAccessSettings: true,
      canAccessAccountMaster: true,
      accountMasterViewType: 'view_all',
      isActive: true,
      isDeleted: false
    });
    console.log('✅ Admin role created');

    // Create Admin User
    const encryptedPassword = encryptData('12345678');
    await STAFF.create({
      fullName: 'Admin User',
      email: 'admin@gmail.com',
      phone: '9999999999',
      password: encryptedPassword,
      role: adminRole._id,
      isDeleted: false
    });
    console.log('✅ Admin user created (admin@gmail.com / 12345678)');

    // Create Customization Types
    const customizationTypes = [
      'Laser Engrave',
      'UV Color Logo',
      'Jingle Ad',
      'B.T Pair Name',
      'U.V. DTF Sticker',
      'Glow Logo',
      'O.E.M',
      'Other'
    ];

    for (const type of customizationTypes) {
      await CUSTOMIZATIONTYPE.create({ name: type, isDeleted: false });
    }
    console.log('✅ Customization types created');

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
