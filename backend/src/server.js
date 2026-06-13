require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify DB Connection
    await prisma.$connect();
    console.log('✅ Connected to MongoDB via Prisma ORM.');
    
    app.listen(PORT, () => {
      console.log(`🚀 MediHist Core API listening on port ${PORT}...`);
    });
  } catch (error) {
    console.error('❌ Failed to start MediHist backend:', error.message);
    process.exit(1);
  }
};

startServer();
