const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// CORS configuration matching local frontend access
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Global rate limiting: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for authentication routes (login, register, reset, OTP verification)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: { error: 'Too many authentication attempts. Please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Simple XSS sanitization checks to block common tag injections (<script>, javascript:)
const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      // Basic strip HTML tags
      let cleaned = val.replace(/<[^>]*>/g, '');
      // Strip script URIs
      cleaned = cleaned.replace(/javascript:/gi, '');
      return cleaned;
    }
    if (typeof val === 'object' && val !== null) {
      for (const k in val) {
        val[k] = sanitize(val[k]);
      }
    }
    return val;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Uncaught Error:', err.stack);

  if (err.message.includes('Invalid file format') || err.message.includes('file size')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ 
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  helmetHeaders: helmet(),
  corsConfig: cors(corsOptions),
  apiLimiter,
  authLimiter,
  sanitizeInput,
  errorHandler
};
