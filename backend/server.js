const express = require('express');
const cors = require('cors');
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
});

