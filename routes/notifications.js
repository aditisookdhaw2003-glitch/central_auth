const express = require("express");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin"); // correct import

const router = express.Router();

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Path to db.json
const DB_PATH = path.join(__dirname, "..", "db.json");

function loadDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

router.get("/users/nodes/:node_id", (req, res) => {
  const nodeId = parseInt(req.params.node_id);
  const db = loadDB();
  const matches = db.users_nodes.filter(entry => entry.node_id === nodeId);
  const usernames = matches.map(m => ({ username: m.username }));
  return res.json(usernames);
});

router.get("/users/token/:username", (req, res) => {
  const username = req.params.username;
  const db = loadDB();
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ devicetoken: user.devicetoken || null });
});

router.post("/notifications/trigger", async (req, res) => {
  try {
    const { sensor, value, node_id, timestamp } = req.body;
    const db = loadDB();

    const matchedNodes = db.users_nodes.filter(entry => entry.node_id === node_id);
    const usernames = matchedNodes.map(m => m.username);

    const tokens = usernames.map(username => {
      const user = db.users.find(u => u.username === username);
      return user ? user.devicetoken : null;
    }).filter(Boolean);

    if (tokens.length === 0) return res.status(200).json({ message: "No device tokens found" });

    const message = {
      notification: {
        title: `${sensor.toUpperCase()} Alert!`,
        body: `${sensor} reading is ${value}`
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);

    return res.json({
      message: `Notifications sent: ${response.successCount}/${tokens.length}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;