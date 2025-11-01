// routes/users_nodes.js
const express = require('express');
const { getTable, saveTable} = require('../services/db_service');
const authMiddleware = require('../middleware/auth_middleware');

const router = express.Router();
router.use(authMiddleware);


function requireAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can perform this action' });
    return false;
  }
  return true;
}

router.get("/", (req, res) => {
  try {
    const users = getTable("users") || [];
    const nodes = getTable("nodes") || [];
    const usersNodes = getTable("users_nodes") || [];

    const result = usersNodes.map((entry) => {
      const user = users.find((u) => u.username === entry.username);
      const node = nodes.find((n) => n.node_id === entry.node_id);

      return {
        id: entry.id,
        username: entry.username,
        name: user ? `${user.name} ${user.surname}` : entry.username,
        role: user ? user.role : null,
        node_id: entry.node_id,
        node_name: node ? node.name : "Unknown Node",
        node_location: node ? node.location : "Unknown Location",
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users (for dropdown)
router.get('/users', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const users = getTable('users') || [];
    // return minimal info
    const out = users.map(u => ({
      username: u.username,
      name: `${u.name ?? ''} ${u.surname ?? ''}`.trim(),
    }));
    res.json(out);
  } catch (err) {
    console.error('GET /users_nodes/users error', err);
    res.status(500).json({ error: err.message });
  }
});

// GET nodes (for dropdown)
router.get('/nodes', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const nodes = getTable('nodes') || [];
    const out = nodes.map(n => ({
      node_id: n.node_id,
      name: n.name,
      location: n.location,
    }));
    res.json(out);
  } catch (err) {
    console.error('GET /users_nodes/nodes error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST assign access { username, node_id }
router.post('/', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username, node_id } = req.body;
    if (!username || !node_id) return res.status(400).json({ error: 'username and node_id required' });

    const users = getTable('users') || [];
    const nodes = getTable('nodes') || [];
    const users_nodes = getTable('users_nodes') || [];

    const userExists = users.some(u => u.username === username);
    const nodeExists = nodes.some(n => n.node_id === node_id);

    if (!userExists) return res.status(404).json({ error: 'User not found' });
    if (!nodeExists) return res.status(404).json({ error: 'Node not found' });

    // Prevent duplicate
    if (users_nodes.some(un => un.username === username && un.node_id === node_id)) {
      return res.status(409).json({ error: 'Access already exists' });
    }

    // Generate id (max id + 1) — keep in line with your db.json ids
    const newId = users_nodes.length ? Math.max(...users_nodes.map(x => x.id || 0)) + 1 : 1;
    users_nodes.push({ id: newId, username, node_id });
    saveTable('users_nodes', users_nodes);

    res.status(201).json({ message: 'Access assigned successfully' });
  } catch (err) {
    console.error('POST /users_nodes error', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove access { username, node_id }
router.delete('/', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username, node_id } = req.body;
    if (!username || !node_id) return res.status(400).json({ error: 'username and node_id required' });

    let users_nodes = getTable('users_nodes') || [];
    const index = users_nodes.findIndex(un => un.username === username && un.node_id === node_id);

    if (index === -1) return res.status(404).json({ error: 'Access not found' });

    users_nodes.splice(index, 1);
    saveTable('users_nodes', users_nodes);

    res.json({ message: 'Access removed successfully' });
  } catch (err) {
    console.error('DELETE /users_nodes error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;