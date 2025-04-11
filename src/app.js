const express = require('express');
const path = require('path');
const fetchFieldsRoute = require('./routes/fetchFields');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Add routes
fetchFieldsRoute(app);

// Catch-all handler for React router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;