const express = require('express');
const db = require('../config/db');
const router = express.Router();

// PHẢI CÓ :userId Ở ĐÂY
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Câu lệnh SQL cực kỳ tường minh (Explicit) để tránh lỗi Ambiguous
    const sql = `
        SELECT 
            br.id, 
            br.borrower_name, 
            br.borrow_date, 
            br.status,
            e.name AS device_name, 
            e.image_url 
        FROM borrow_requests br
        INNER JOIN equipment e ON br.equipment_id = e.id
        WHERE br.user_id = ?
        ORDER BY br.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            // NHÌN VÀO ĐÂY: Nó sẽ hiện lỗi ở Terminal máy ông (VS Code)
            console.log("---------- LỖI SQL Ở ĐÂY ----------");
            console.error(err); 
            console.log("----------------------------------");
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
module.exports = router;