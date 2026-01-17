const express = require('express');
const db = require('../config/db'); 

const router = express.Router();

// API: Lấy danh sách thiết bị
// GET /api/equipment
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM equipment ORDER BY id DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi SQL:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }
        res.json(results);
    });
});

module.exports = router;