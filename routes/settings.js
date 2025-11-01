const express = require('express');
const { getTable, saveTable } = require('../services/db_service');
const authMiddleware = require('../middleware/auth_middleware');
const { verifyAdmin, verifyUser } = require('../middleware/role_middleware');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');



const router = express.Router();

router.use(authMiddleware);

// --- GET all users ---
router.get('/users', (req, res) => {
  try {
    const users = getTable('users') || [];
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADD user ---
router.post("/users", authMiddleware, async (req, res) => {
  try {
    const { username, password, name, surname, role } = req.body;

    // Load current users
    const users = getTable("users") || [];

    // Check for existing username
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUser = {
      username,
      password: hashedPassword,
      name,
      surname,
      role,
      devicetoken: ""
    };

    // Save
    users.push(newUser);
    saveTable("users", users);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

router.put('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { name, surname, role, password } = req.body;

    const users = getTable('users') || [];
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (role) user.role = role;

    if (password) {
      // Only hash if it's a plain password
      if (!password.startsWith("$2b$")) {
        user.password = await bcrypt.hash(password, 10);
      } else {
        user.password = password; // already hashed
      }
    }

    saveTable('users', users);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DELETE user ---
router.delete('/users/:username', (req, res) => {
  try {
    const { username } = req.params;
    let users = getTable('users') || [];
    const index = users.findIndex(u => u.username === username);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    users.splice(index, 1);
    saveTable('users', users);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users/:username/password", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const { oldPassword, newPassword } = req.body;

    const users = getTable("users") || [];
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Verify old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ error: "Current password is incorrect" });

    // ✅ Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    saveTable("users", users);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
