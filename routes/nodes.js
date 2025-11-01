// routes/nodes.js
const express = require('express');
const { getTable } = require('../services/db_service');
const authMiddleware = require('../middleware/auth_middleware');

const router = express.Router();

// Protect all node routes
router.use(authMiddleware);

router.get('/', (req, res) => {
  const nodes = getTable('nodes'); // returns an array
  res.json(nodes);
});

module.exports = router;