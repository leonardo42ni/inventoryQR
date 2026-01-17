require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const path = require('path');
const historyRoutes = require('./routes/history');
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const borrowRoutes = require('./routes/borrow');
const adminRoutes = require('./routes/admin'); 
const app = express();
// Middleware
app.use(cors());
app.use(express.json());

// Serve static files từ frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/admin', adminRoutes); 
// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend đang chạy!' });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/admin_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'admin_dashboard.html'));
});

app.get('/user_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'user_dashboard.html'));
});

// backend/server.js
const PORT = process.env.PORT || 5000; // Thay đổi từ 5000 cố định sang biến môi trường

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
