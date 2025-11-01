const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config');

const dbPath = path.join(__dirname, '..', DB_FILE);

const readDB = () => {
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Generic functions
const getTable = (table) => readDB()[table];
const saveTable = (table, data) => {
  const db = readDB();
  db[table] = data;
  writeDB(db);
};

module.exports = {
  readDB,
  writeDB,
  getTable,
  saveTable
};