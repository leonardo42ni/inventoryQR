const express = require('express');
const db = require('../config/db');

const router = express.Router();

// ĐĂNG KÝ 
router.post('/register', (req, res) => {
  const { username, password, email, full_name } = req.body;
  // Kiểm tra username đã tồn tại chưa
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Lỗi server!' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Username đã tồn tại!' });
    }

    // Thêm user mới 
    db.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, password, email || null, full_name || null, 'user'],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Lỗi tạo tài khoản!' });
        }
        res.status(201).json({ message: 'Đăng ký thành công!' });
      }
    );
  });
});

// ĐĂNG NHẬP
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Tìm user và so sánh password trực tiếp
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Lỗi server!' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Sai username hoặc password!' });
      }

      const user = results[0];
      
      res.json({
        message: 'Đăng nhập thành công!',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
    }
  );
});

module.exports = router;