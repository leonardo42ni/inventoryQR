// --- BẢO MẬT: Kiểm tra quyền Admin ngay khi vào trang ---
function checkAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '/index.html';
    }
}

// --- 1. Đổ dữ liệu Kho thiết bị (Phần 2) ---
async function fetchAndRenderEquipment() {
    try {
        const response = await fetch('/api/equipment');
        const data = await response.json();
        
        currentEquipmentList = data; // Lưu lại để dùng check QR

        const list = document.getElementById('equipment-list');
        if(!list) return;
        list.innerHTML = ''; 

        if(data.length === 0) {
            list.innerHTML = '<p style="text-align:center; font-size:1.6rem; width:100%">Chưa có thiết bị nào.</p>';
            return;
        }

        data.forEach(item => {
            const isAvailable = item.status === 'available';
            const statusText = isAvailable ? 'Sẵn sàng' : 'Đang bận';
            const statusClass = isAvailable ? 'status-available' : 'status-in_use';
            
            // Link tạo ảnh QR
            const qrImageLink = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.qr_code}`;

            const html = `
                <div class="box" style="${!isAvailable ? 'opacity: 0.8;' : ''}">
                    <span class="status-tag ${statusClass}">${statusText}</span>
                    <div class="image">
                        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                    </div>
                    <h3>${item.name}</h3>
                    <div class="qr-area">
                        <img src="${qrImageLink}" alt="QR Code">
                        <p>${item.qr_code}</p>
                    </div>
                    <p style="font-size: 1.4rem; color: #666; margin-top: 1rem;">
                        ${isAvailable ? '✅ Có thể mượn' : '❌ Đang có người mượn'}
                    </p>
                </div>
            `;
            list.innerHTML += html;
        });
    } catch (error) {
        console.error('Lỗi tải thiết bị:', error);
    }
}

// --- 2. Đổ dữ liệu Đơn mượn vào Bảng (Phần 3) ---
async function loadRequests() {
    const res = await fetch('/api/admin/requests');
    const data = await res.json();
    const tbody = document.getElementById('request-tbody');
    
    tbody.innerHTML = data.map(req => `
        <tr>
            <td>
                <b>${req.borrower_name || req.username}</b><br>
                <small>SĐT: ${req.borrower_phone || 'N/A'}</small>
            </td>
            <td>${req.device_name}</td>
            <td>
                <small>Mượn: ${new Date(req.borrow_date).toLocaleDateString('vi-VN')}</small><br>
                <small>Trả: ${new Date(req.return_date).toLocaleDateString('vi-VN')}</small>
            </td>
            <td><p style="font-size: 1.2rem; max-width: 150px;">${req.note || 'Không có'}</p></td>
            <td><span class="status-badge ${req.status}">${req.status.toUpperCase()}</span></td>
            <td>
                ${req.status === 'pending' ? `
                    <button class="btn-action btn-approve" onclick="updateStatus(${req.id}, 'approve', ${req.equipment_id})">Duyệt</button>
                    <button class="btn-action btn-reject" onclick="updateStatus(${req.id}, 'reject', ${req.equipment_id})">Từ chối</button>
                ` : ''}
                ${req.status === 'approved' ? `
                    <button class="btn-action btn-return" onclick="updateStatus(${req.id}, 'return', ${req.equipment_id})">Xác nhận trả</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// --- 3. Xử lý sự kiện Click nút (Gọi đến backend/routes/admin.js) ---
async function updateStatus(id, action, equipment_id) {
    if(!confirm(`Xác nhận thực hiện hành động: ${action}?`)) return;

    try {
        const res = await fetch('/api/admin/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action, equipment_id })
        });

        const result = await res.json();
        alert(result.message);
        
        // Load lại cả 2 phần để cập nhật trạng thái mới nhất
        loadRequests();
        loadEquipment();
    } catch (err) {
        console.error('Lỗi cập nhật:', err);
        alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
}

// --- Đăng xuất ---
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Khởi chạy khi trang web đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    loadEquipment();
    loadRequests();
    
    // Xử lý menu mobile giống bản User
    let menu = document.querySelector('#menu-btn');
    let navbar = document.querySelector('.navbar');
    if(menu) {
        menu.onclick = () => {
            menu.classList.toggle('fa-times');
            navbar.classList.toggle('active');
        }
    }
});