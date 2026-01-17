const express = require('express');
const db = require('../config/db');
const router = express.Router();

// API: Lấy tất cả danh sách đơn mượn
// GET /api/admin/requests
router.get('/requests', (req, res) => {
    const sql = `
        SELECT 
            br.id, br.borrower_name, br.borrow_date, br.status,
            u.username, 
            e.name AS device_name
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        JOIN equipment e ON br.equipment_id = e.id
        ORDER BY br.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Lỗi SQL Admin:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// API: Xử lý hành động (Duyệt / Từ chối / Trả)
// PUT /api/admin/update
router.put('/update', (req, res) => {
    const { id, action, equipment_id } = req.body; 

    let sqlRequest = '';
    let sqlEquipment = '';
    let message = '';

    switch (action) {
        case 'approve': // DUYỆT
            sqlRequest = "UPDATE borrow_requests SET status = 'approved' WHERE id = ?";
            sqlEquipment = null; 
            message = 'Đã duyệt đơn thành công!';
            break;

        case 'reject': // TỪ CHỐI
            sqlRequest = "UPDATE borrow_requests SET status = 'rejected' WHERE id = ?";
            sqlEquipment = "UPDATE equipment SET status = 'available' WHERE id = ?";
            message = 'Đã từ chối đơn mượn.';
            break;

        case 'return': // ĐÃ TRẢ'
            sqlRequest = "UPDATE borrow_requests SET status = 'returned', actual_return_date = CURDATE() WHERE id = ?";
            sqlEquipment = "UPDATE equipment SET status = 'available' WHERE id = ?";
            message = 'Xác nhận trả thiết bị thành công!';
            break;

        default:
            return res.status(400).json({ message: 'Hành động không hợp lệ' });
    }
    // Cập nhật bảng Đơn mượn trước
    db.query(sqlRequest, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Lỗi cập nhật đơn hàng' });
        }

        // Nếu cần cập nhật bảng Thiết bị (trường hợp Reject hoặc Return)
        if (sqlEquipment) {
            db.query(sqlEquipment, [equipment_id], (err) => {
                if (err) console.error('Lỗi update thiết bị:', err);
                res.json({ message: message });
            });
        } else {
            res.json({ message: message });
        }
    });
});
// API: Thống kê số lượt mượn theo thiết bị
router.get('/statistics', (req, res) => {
const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    const filters = [];

    const sql = `
        SELECT e.name, COUNT(br.id) AS count 
        FROM borrow_requests br
        JOIN equipment e ON br.equipment_id = e.id
        WHERE br.status IN ('approved', 'returned')
        AND MONTH(br.borrow_date) = ?
        AND YEAR(br.borrow_date) = ?
        GROUP BY e.id
    `;

    db.query(sql, [month, year], (err, results) => {
        if (err) {
            console.error("Lỗi SQL Thống kê:", err);
            return res.status(500).json({ error: "Lỗi database" });
        }

        res.json(results); 
    });
});
module.exports = router;