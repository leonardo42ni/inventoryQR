/* =========================================
   PHẦN 1: CẤU HÌNH CHUNG & GIAO DIỆN
   ========================================= */

// 1. Kiểm tra đăng nhập
const checkLogin = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vui lòng đăng nhập để truy cập!');
        window.location.href = '/index.html';
    } else {
        console.log(`✅ Đang đăng nhập với: ${user.username}`);
        // Update tên user lên header nếu có
        const userInfo = document.getElementById('user-info');
        if(userInfo) userInfo.textContent = `Hi, ${user.username}`;
    }
};
checkLogin();

// 2. Xử lý Menu Mobile & Logout
let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');

if(menuBtn) {
    menuBtn.onclick = () => { navbar.classList.toggle('active'); }
}
window.onscroll = () => {
    if(navbar) navbar.classList.remove('active');
}

document.querySelector('#logout-btn').onclick = () => {
    localStorage.removeItem('user');
    if(confirm('Bạn có chắc muốn đăng xuất?')) {
        window.location.href = '/index.html';
    }
}

// 3. Xử lý nút Upload QR trên Header
document.querySelector('#qr-btn').onclick = () => {
    document.getElementById('form').scrollIntoView({behavior: "smooth"});
    document.getElementById('qr-input').click();
}


/* =========================================
   PHẦN 2: LẤY DỮ LIỆU TỪ SERVER (DATABASE)
   ========================================= */

// Biến toàn cục để lưu danh sách thiết bị (dùng cho việc check QR)
let currentEquipmentList = []; 

// A. Tải danh sách thiết bị
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

// B. Tải lịch sử mượn
async function fetchAndRenderHistory() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        const response = await fetch(`/api/history/${user.id}`); 
        if (!response.ok) throw new Error('Mã lỗi: ' + response.status);
        const data = await response.json();
        const list = document.getElementById('history-list');
        if(!list) return;
        list.innerHTML = '';
        if(data.length === 0) {
            list.innerHTML = '<p style="text-align:center; font-size:1.4rem">Chưa có lịch sử mượn nào.</p>';
            return;
        }
        data.forEach(item => {
            let statusText = '', statusClass = '';
            switch(item.status) {
                case 'pending': statusText = 'Chờ duyệt'; statusClass = 'status-pending'; break;
                case 'approved': statusText = 'Đang mượn'; statusClass = 'status-approved'; break;
                case 'returned': statusText = 'Đã trả'; statusClass = 'status-returned'; break;
                case 'rejected': statusText = 'Từ chối'; statusClass = 'status-rejected'; break;
            }

            const borrowDate = new Date(item.borrow_date).toLocaleDateString('vi-VN');
            const returnDate = new Date(item.return_date).toLocaleDateString('vi-VN');

            const html = `
                <div class="history-card">
                    <img src="${item.image_url}" alt="device" onerror="this.src='https://via.placeholder.com/100'">
                    <div class="info">
                        <h3>${item.device_name}</h3>
                        <p><i class="far fa-user"></i> Người mượn: <b>${item.borrower_name}</b></p>
                        <p><i class="far fa-calendar-alt"></i> ${borrowDate} - ${returnDate}</p>
                        <p style="font-style: italic; font-size: 1.2rem; margin-top: 0.5rem;">Ghi chú: ${item.note || 'Không có'}</p>
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${statusText}
                    </div>
                </div>
            `;
            list.innerHTML += html;
        });
    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
    }
}

// Gọi hàm chạy ngay khi vào trang
fetchAndRenderEquipment();
fetchAndRenderHistory();
/* PHẦN 3: XỬ LÝ QR CODE*/
const fileInput = document.getElementById('qr-input');
const previewImg = document.getElementById('qr-preview');
const instruction = document.getElementById('qr-instruction');

if(fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target.result;
            previewImg.style.display = 'block'; 
            if(instruction) instruction.style.display = 'none';
            scanQRCode(previewImg.src); 
        };
        reader.readAsDataURL(file);
    });
}

function scanQRCode(imageSrc) {
    const image = new Image();
    image.src = imageSrc;
    
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        if(typeof jsQR === 'undefined') {
            alert('Lỗi: Chưa tải được thư viện jsQR!');
            return;
        }

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            handleQRFound(code.data);
        } else {
            alert('❌ Không tìm thấy mã QR! Vui lòng thử ảnh rõ nét hơn.');
            resetFormQR();
        }
    };
}

function handleQRFound(qrCodeText) {
    const device = currentEquipmentList.find(item => item.qr_code === qrCodeText);
    if (device) {
        if (device.status === 'in_use' || device.status === 'broken') {
            alert(`⛔ THIẾT BỊ BẬN: "${device.name}" đang có người mượn.`);
            resetFormQR();
            return;
        }
        alert(`✅ Đã nhận diện: ${device.name}`);
        document.getElementById('device-name').value = device.name;
        document.getElementById('device-id').value = device.id;
        document.getElementById('form').scrollIntoView({behavior: "smooth"});
        
    } else {
        alert('⚠️ Mã QR này không tồn tại trong hệ thống!');
        resetFormQR();
    }
}

function resetFormQR() {
    document.getElementById('device-name').value = '';
    document.getElementById('device-id').value = '';
    previewImg.style.display = 'none';
    if(instruction) instruction.style.display = 'block';
}


/* PHẦN 4: GỬI ĐƠN MƯỢN (SUBMIT FORM) */

const borrowForm = document.getElementById('borrow-form');

if(borrowForm) {
    borrowForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem('user'));
        const equipmentId = document.getElementById('device-id').value;
        const borrowerName = document.getElementById('borrower-name').value;
        const borrowerPhone = document.getElementById('borrower-phone').value;
        const borrowDate = document.getElementById('borrow-date').value;
        const returnDate = document.getElementById('return-date').value;
        const note = document.getElementById('note').value;
        if (!equipmentId) {
            alert('⚠️ Vui lòng upload ảnh QR để chọn thiết bị trước!');
            return;
        }

        const payload = {
            user_id: user.id,
            equipment_id: equipmentId,
            borrower_name: borrowerName,
            borrower_phone: borrowerPhone,
            borrow_date: borrowDate,
            return_date: returnDate,
            note: note
        };

        try {
            const response = await fetch('/api/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert('🎉 ' + result.message);
                window.location.reload(); 
            } else {
                alert('❌ Lỗi: ' + result.message);
            }

        } catch (error) {
            console.error('Lỗi gửi đơn:', error);
            alert('Không thể kết nối tới server!');
        }
    });
}