const express = require('express');
const path = require('path');
const { 
  helmetHeaders, 
  corsConfig, 
  apiLimiter, 
  sanitizeInput, 
  errorHandler 
} = require('./middlewares/securityMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const recordRoutes = require('./routes/recordRoutes');
const sharingRoutes = require('./routes/sharingRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Enable Global Security Headers
app.use(helmetHeaders);

// 2. Configure CORS
app.use(corsConfig);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Input Sanitization (Defense against XSS scripts)
app.use(sanitizeInput);

// 5. Global API Rate Limiter
app.use('/api', apiLimiter);

// 6. Static directory for file upload fallbacks
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 7. Route bindings
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Root path confirmation
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
