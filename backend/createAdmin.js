const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  department: String
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model('User', userSchema);

const admins = [
  { name: 'IT Admin',             email: 'it@rgukt.ac.in',             password: 'it@admin123',             role: 'admin', department: 'IT' },
  { name: 'HR Admin',             email: 'hr@rgukt.ac.in',             password: 'hr@admin123',             role: 'admin', department: 'HR' },
  { name: 'Finance Admin',        email: 'finance@rgukt.ac.in',        password: 'finance@admin123',        role: 'admin', department: 'Finance' },
  { name: 'Maintenance Admin',    email: 'maintenance@rgukt.ac.in',    password: 'maintenance@admin123',    role: 'admin', department: 'Maintenance' },
  { name: 'Administration Admin', email: 'administration@rgukt.ac.in', password: 'administration@admin123', role: 'admin', department: 'Administration' },
  { name: 'Academics Admin',      email: 'academics@rgukt.ac.in',      password: 'academics@admin123',      role: 'admin', department: 'Academics' },
  { name: 'Hostel Admin',         email: 'hostel@rgukt.ac.in',         password: 'hostel@admin123',         role: 'admin', department: 'Hostel' },
  { name: 'Super Admin',          email: 'superadmin@rgukt.ac.in',     password: 'super@admin123',          role: 'superadmin', department: null },
];

async function createAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const adminData of admins) {
      const exists = await User.findOne({ email: adminData.email });
      if (exists) {
        console.log(`Already exists: ${adminData.email}`);
        continue;
      }
      const user = new User(adminData);
      await user.save();
      console.log(`Created: ${adminData.email} | Password: ${adminData.password} | Dept: ${adminData.department}`);
    }

    console.log('\nAll admins created successfully!');
    console.log('\n--- Login Credentials ---');
    admins.forEach(a => {
      console.log(`${a.department || 'SUPER'} | ${a.email} | ${a.password}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmins();