const express = require("express");
const fs = require("fs");
const path = require("path");
const serviceAccount = require("firebase-admin");

const router = express.Router();

// Path to db.json (adjust if needed)
const DB_PATH = path.join(__dirname, "..", "db.json");

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

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

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ devicetoken: user.devicetoken || null });
});

router.post("/notifications/trigger", async (req, res) => {
  try {
    const { sensor, value, node_id, timestamp } = req.body;

    // 1️⃣ Find usernames linked to node_id
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db.json"), "utf8"));
    const matchedNodes = db.users_nodes.filter(entry => entry.node_id === node_id);
    const usernames = matchedNodes.map(m => m.username);

    // 2️⃣ Find device tokens
    const tokens = usernames.map(username => {
      const user = db.users.find(u => u.username === username);
      return user ? user.devicetoken : null;
    }).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(200).json({ message: "No device tokens found" });
    }

    // 3️⃣ Send FCM notifications
    const admin = require("firebase-admin");
    const serviceAccount = require("../firebase-service-account.json");

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

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