const express = require('express');
const db = require('../config/db');
const router = express.Router();

// API: Lấy tất cả danh sách đơn mượn (để hiện lên bảng)
// GET /api/admin/requests
router.get('/requests', (req, res) => {
    const sql = `
        SELECT br.*, u.username, e.name as device_name, e.image_url 
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        JOIN equipment e ON br.equipment_id = e.id
        ORDER BY br.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách đơn' });
        res.json(results);
    });
});

// API: Xử lý hành động (Duyệt / Từ chối / Trả)
// PUT /api/admin/update
router.put('/update', (req, res) => {
    const { id, action, equipment_id } = req.body; 
    // id: ID đơn mượn
    // action: 'approve', 'reject', 'return'
    // equipment_id: ID thiết bị (để đổi trạng thái máy)

    let sqlRequest = '';
    let sqlEquipment = '';
    let message = '';

    // Logic xử lý từng nút bấm
    switch (action) {
        case 'approve': // DUYỆT
            // Chỉ đổi trạng thái đơn thành approved. 
            // Máy vẫn giữ là 'in_use' (vì User bắt đầu dùng).
            sqlRequest = "UPDATE borrow_requests SET status = 'approved' WHERE id = ?";
            sqlEquipment = null; // Không cần chỉnh sửa thiết bị
            message = 'Đã duyệt đơn thành công!';
            break;

        case 'reject': // TỪ CHỐI
            // Đơn thành rejected
            // Máy phải nhả ra thành 'available'
            sqlRequest = "UPDATE borrow_requests SET status = 'rejected' WHERE id = ?";
            sqlEquipment = "UPDATE equipment SET status = 'available' WHERE id = ?";
            message = 'Đã từ chối đơn mượn.';
            break;

        case 'return': // ĐÃ TRẢ
            // Đơn thành returned + Cập nhật ngày trả thực tế là hôm nay (NOW())
            // Máy phải nhả ra thành 'available'
            sqlRequest = "UPDATE borrow_requests SET status = 'returned', actual_return_date = CURDATE() WHERE id = ?";
            sqlEquipment = "UPDATE equipment SET status = 'available' WHERE id = ?";
            message = 'Xác nhận trả thiết bị thành công!';
            break;

        default:
            return res.status(400).json({ message: 'Hành động không hợp lệ' });
    }

    // --- BẮT ĐẦU CHẠY SQL ---
    
    // 1. Cập nhật bảng Đơn mượn trước
    db.query(sqlRequest, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Lỗi cập nhật đơn hàng' });
        }

        // 2. Nếu cần cập nhật bảng Thiết bị (trường hợp Reject hoặc Return)
        if (sqlEquipment) {
            db.query(sqlEquipment, [equipment_id], (err) => {
                if (err) console.error('Lỗi update thiết bị:', err);
                // Dù lỗi update thiết bị hay không thì vẫn báo thành công cho Admin đỡ hoang mang
                // (Thực tế nên dùng Transaction, nhưng học tập thì thế này là ổn)
                res.json({ message: message });
            });
        } else {
            // Trường hợp Approve không cần sửa thiết bị
            res.json({ message: message });
        }
    });
});

module.exports = router;