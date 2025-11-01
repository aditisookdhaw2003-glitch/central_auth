const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config"); // import correctly
const { getTable, saveTable } = require("../services/db_service");

const router = express.Router();

// ========================== REGISTER ==========================
router.post("/register", async (req, res) => {
  const { username, password, role, name, surname } = req.body;

  const users = getTable("users");

  const existingUser = users.find((u) => u.username === username);
  if (existingUser) return res.status(400).json({ message: "User exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    role: role || "user",
    name: name || "",
    surname: surname || "",
  };

  users.push(newUser);
  saveTable("users", users);

  res.json({ message: "User registered successfully" });
});

// ========================== LOGIN ==========================
router.post("/login", async (req, res) => {
  const { username, password, devicetoken } = req.body;

  const users = getTable("users");
  const user = users.find((u) => u.username === username);

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // optional: store device token
  if (devicetoken) user.devicetoken = devicetoken;
  saveTable("users", users);

  // ✅ sign JWT with secret
  console.log("JWT Secret:", jwtSecret);

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      surname: user.surname,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  res.json({
    message: "Login successful",
    token,
    username: user.username,
    role: user.role,
    name: user.name,
    surname: user.surname,
  });
});

module.exports = router;