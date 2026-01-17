const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/history
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            br.*, 
            u.username, 
            e.name as device_name, 
            e.image_url 
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        JOIN equipment e ON br.equipment_id = e.id
        ORDER BY br.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi server' });
        res.json(results);
    });
});

module.exports = router;