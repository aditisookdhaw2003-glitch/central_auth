require('dotenv').config(); // load .env first

const mqtt = require('mqtt');

const MQTT_BROKER = 'mqtt://localhost:1883'; // for internal broker
const mqttClient = mqtt.connect(MQTT_BROKER);

const express = require('express');
const bodyParser = require('body-parser');

//const { PORT } = require('./config');
const authMiddleware = require('./middleware/auth_middleware');

const authRoutes = require('./routes/auth');
const hubsRoutes = require('./routes/hubs');
const nodeRoutes = require('./routes/nodes');
const usersnodesRoutes = require('./routes/users_nodes');
const settingsRoutes = require('./routes/settings');
const notificationsRoutes = require("./routes/notifications");

const app = express();
app.use(bodyParser.json());

// Public routes
app.use('/auth', authRoutes);
app.use('/hubs', hubsRoutes);
app.use('/notifications', notificationsRoutes);


// All routes after this require a valid token
//hghg
//app.use(authMiddleware);
app.use('/nodes', authMiddleware, nodeRoutes);
app.use('/users_nodes', authMiddleware, usersnodesRoutes);
app.use('/settings', authMiddleware, settingsRoutes);

mqttClient.on('connect', () => {
  console.log('Central Auth connected to MQTT broker');

  // subscribe to hub registration topic
  mqttClient.subscribe('hub/register', (err) => {
    if(!err) console.log('Subscribed to hub/register');
  });
});

mqttClient.on('message', (topic, message) => {
  if(topic === 'hub/register') {
    const hub = JSON.parse(message.toString());
    console.log('Received hub registration:', hub);

    // Save/update hub in nodes table
    const hubs = getTable('nodes') || [];
    const existing = hubs.find(h => h.node_id === hub.node_id);

    if(existing) {
      const idx = hubs.findIndex(h => h.node_id === hub.node_id);
      hubs[idx] = { ...hubs[idx], ...hub, lastSeen: new Date().toISOString() };
    } else {
      hubs.push({ ...hub, lastSeen: new Date().toISOString() });
    }
    saveTable('nodes', hubs);
  }
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => console.log(`Central Auth running on port ${PORT}`));