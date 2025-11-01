require('dotenv').config(); // load .env first

const express = require('express');
const bodyParser = require('body-parser');

//const { PORT } = require('./config');
const authMiddleware = require('./middleware/auth_middleware');

const authRoutes = require('./routes/auth');
const hubsRoutes = require('./routes/hubs');
const nodeRoutes = require('./routes/nodes');
const usersnodesRoutes = require('./routes/users_nodes');
const settingsRoutes = require('./routes/settings');

const app = express();
app.use(bodyParser.json());

// Public routes
app.use('/auth', authRoutes);
app.use('/hubs', hubsRoutes);


// All routes after this require a valid token
//app.use(authMiddleware);
app.use('/nodes', authMiddleware, nodeRoutes);
app.use('/users_nodes', authMiddleware, usersnodesRoutes);
app.use('/settings', authMiddleware, settingsRoutes);

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => console.log(`Central Auth running on port ${PORT}`));