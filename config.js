require('dotenv').config(); // load .env first

module.exports = {
  PORT: process.env.PORT || 4002,
  DB_FILE: 'db.json',
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey123',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};