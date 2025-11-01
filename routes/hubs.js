// routes/hubs.js (central_auth)
const express = require('express');
const { getTable, saveTable } = require('../services/db_service');
const router = express.Router();

// Hub register (simple): POST /hubs/register { node_id, ip, port }
router.post('/register', (req, res) => {
  const { node_id, ip, port, name } = req.body;
  const hubs = getTable('nodes') || [];

  const existing = hubs.find(h => h.node_id === node_id);
  const hubRecord = { node_id, ip, port, name, lastSeen: new Date().toISOString() };

  if (existing) {
    // update
    const idx = hubs.findIndex(h => h.node_id === node_id);
    hubs[idx] = { ...hubs[idx], ...hubRecord };
  } else {
    hubs.push(hubRecord);
  }
  saveTable('nodes', hubs);
  res.json({ ok: true });
});

module.exports = router;