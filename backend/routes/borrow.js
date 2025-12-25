const express = require('express');
const db = require('../config/db');
const router = express.Router();

// API: Xử lý mượn thiết bị
// POST /api/borrow
router.post('/', (req, res) => {
    const { user_id, equipment_id, borrower_name, borrower_phone, borrow_date, return_date, note } = req.body;

    // 1. Kiểm tra: Thiết bị này có đang rảnh (available) không?
    db.query('SELECT status FROM equipment WHERE id = ?', [equipment_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Lỗi server khi kiểm tra thiết bị' });
        }
        
        // Nếu không tìm thấy máy hoặc máy không rảnh
        if (results.length === 0 || results[0].status !== 'available') {
            return res.status(400).json({ message: 'Rất tiếc! Thiết bị này vừa có người khác mượn rồi.' });
        }

        // 2. Nếu rảnh -> Thực hiện 2 việc cùng lúc
        
        // Việc A: Tạo đơn mượn mới (trạng thái 'pending')
        const sqlInsert = `
            INSERT INTO borrow_requests 
            (user_id, equipment_id, borrower_name, borrower_phone, borrow_date, return_date, note, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending') 
        `;

        db.query(sqlInsert, [user_id, equipment_id, borrower_name, borrower_phone, borrow_date, return_date, note], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Lỗi khi tạo đơn mượn' });
            }

            // Việc B: Cập nhật trạng thái máy thành 'in_use' (Đang bận)
            db.query("UPDATE equipment SET status = 'in_use' WHERE id = ?", [equipment_id], (err) => {
                if (err) console.error('Lỗi update trạng thái:', err);
                
                // 3. Trả về thông báo thành công cho Frontend
                res.json({ message: 'Đăng ký mượn thành công! Vui lòng bảo quản thiết bị.' });
            });
        });
    });
});

module.exports = router;