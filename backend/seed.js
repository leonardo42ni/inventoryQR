
const mysql = require('mysql2');
require('dotenv').config(); 

// 1. Lấy cấu hình từ biến môi trường (Ưu tiên Cloud)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
};

console.log('-----------------------------------------');
console.log('>> ĐANG THỬ SEED DỮ LIỆU VÀO HOST:', dbConfig.host);
console.log('-----------------------------------------');

// 2. Kết nối (Thêm SSL nếu là Cloud)
const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    multipleStatements: true,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Lỗi kết nối:', err.message);
        return;
    }
    console.log('✅ Đã kết nối MySQL!');

    // 3. Khởi tạo Database & Tables
    const initSQL = `
        USE ${dbConfig.database};

        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS equipment (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(200) NOT NULL,
            qr_code VARCHAR(100) UNIQUE NOT NULL,
            image_url VARCHAR(255),
            status ENUM('available', 'in_use', 'broken') DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS borrow_requests (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            equipment_id INT,
            borrower_name VARCHAR(100),
            borrower_phone VARCHAR(20),
            borrow_date DATE,
            return_date DATE,
            note TEXT,
            status ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (equipment_id) REFERENCES equipment(id)
        );
    `;

    connection.query(initSQL, (err) => {
        if (err) {
            console.error('❌ Lỗi tạo cấu trúc:', err.message);
            return;
        }
        console.log('✅ Cấu trúc bảng đã sẵn sàng.');
        seedData(connection);
    });
});

function seedData(conn) {
    console.log('Đang dọn dẹp dữ liệu cũ...');
    const cleanSQL = `
        SET FOREIGN_KEY_CHECKS = 0;
        TRUNCATE TABLE borrow_requests;
        TRUNCATE TABLE equipment;
        TRUNCATE TABLE users;
        SET FOREIGN_KEY_CHECKS = 1;
    `;

    conn.query(cleanSQL, (err) => {
        if (err) return console.error('Lỗi xóa dữ liệu:', err);
        console.log('✅ Đã dọn dẹp dữ liệu cũ!');

        const sqlUsers = `INSERT INTO users (username, password, role) VALUES 
            ('admin', 'admin123', 'admin'),
            ('user1', 'user123', 'user');`;

        const sqlEquipment = `
      INSERT INTO equipment (name, qr_code, image_url, status) VALUES 
      ('Ổ cắm nối dài', 'POWER001', 'image/ổ cắm nối dài.jpg', 'in_use'),
      ('Ổ cắm nối dài', 'POWER002', 'image/ổ cắm nối dài.jpg', 'available'),
      ('Quạt lửng', 'FAN001', 'image/quạt lửng.jpg', 'available'),
      ('Dây HDMI', 'HDMI001', 'image/dây hdmi.jpg', 'available'),
      ('Dây HDMI', 'HDMI002', 'image/dây hdmi.jpg', 'available'),
      ('Mic trợ giảng', 'MIC001', 'image/Mic trợ giảng.jpg', 'in_use'),
      ('Mic trợ giảng', 'MIC002', 'image/Mic trợ giảng.jpg', 'available'),
      ('Camera Canon', 'CAM001', 'image/Máy ảnh Canon.jpg', 'available'),
      ('Loa Bluetooth', 'SPEAKER001', 'image/loa.jpg', 'available'),
      ('Máy chiếu Epson', 'PROJ001', 'image/Máy chiếu Epson.jpg', 'available'),
      ('Chuột không dây', 'MOUSE001', 'image/chuột không dây.jpg', 'available'),
      ('Bàn phím cơ', 'KEYBOARD001', 'image/bàn phím cơ.jpg', 'available'),          
      ('Tai nghe Logitech', 'HEADSET001', 'image/tai nghe logitech.jpg', 'available'),
      ('Webcam Microsoft', 'WEBCAM001', 'image/webcam microsoft.jpg', 'available'),
      ('Bảng vẽ Wacom', 'WACOM001', 'image/bảng vẽ wacom.jpg', 'available'),
      ('Docking Station Dell', 'DOCK001', 'image/docking station dell.jpg', 'available'),
      ('Microphone Blue Yeti', 'MICBLUE001', 'image/microphone blue yeti.jpg', 'available');
    `;

        conn.query(sqlUsers, (err) => {
            if (err) console.error('Lỗi tạo user:', err);
            else {
                console.log('✅ Seed Users OK');
                conn.query(sqlEquipment, (err) => {
                    if (err) console.error('Lỗi tạo thiết bị:', err);
                    else {
                        console.log('✅ Seed Equipment OK');
                        console.log('🚀 HOÀN TẤT! DỮ LIỆU ĐÃ LÊN CLOUD.');
                        setTimeout(() => { conn.end(); process.exit(); }, 1000);
                    }
                });
            }
        });
    });
}