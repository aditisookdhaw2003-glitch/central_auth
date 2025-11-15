const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Path to db.json (adjust if needed)
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

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ devicetoken: user.devicetoken || null });
});

module.exports = router;