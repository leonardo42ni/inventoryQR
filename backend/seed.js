const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// 1. Đọc config từ mysql.json
const db_content = fs.readFileSync(path.join(__dirname, 'mysql.json'));
const dbConfig = JSON.parse(db_content);

// 2. Kết nối MySQL (Bật multipleStatements để chạy nhiều lệnh 1 lúc)
const connection = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  multipleStatements: true 
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Lỗi kết nối:', err);
    return;
  }
  console.log('✅ Đã kết nối MySQL!');

  // 3. Tạo Database & Tables
  const initSQL = `
    CREATE DATABASE IF NOT EXISTS ${dbConfig.database};
    USE ${dbConfig.database};

    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      full_name VARCHAR(100),
      phone VARCHAR(20),
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      qr_code VARCHAR(100) UNIQUE NOT NULL,
      image_url VARCHAR(255),
      description TEXT,
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
      actual_return_date DATE,
      note TEXT,
      status ENUM('pending', 'approved', 'rejected', 'returned') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );
  `;

  connection.query(initSQL, (err) => {
    if (err) {
      console.error('❌ Lỗi tạo bảng:', err);
      return;
    }
    console.log('✅ Cấu trúc bảng đã sẵn sàng.');
    
    // Gọi hàm nạp dữ liệu
    seedData(connection);
  });
});

function seedData(conn) {
  console.log('Đang dọn dẹp dữ liệu cũ...');

  // TẮT KHÓA NGOẠI & TRUNCATE (Reset ID về 1) ---
  const cleanSQL = `
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE borrow_requests;
    TRUNCATE TABLE equipment;
    TRUNCATE TABLE users;
    SET FOREIGN_KEY_CHECKS = 1;
  `;

  conn.query(cleanSQL, (err) => {
    if (err) { 
        console.error(' Vẫn lỗi xóa dữ liệu:', err); 
        return; 
    }
    console.log(' Đã xóa dữ liệu cũ!');

    // --- NẠP DỮ LIỆU MỚI ---
    
    // 1. Users
    const sqlUsers = `
      INSERT INTO users (username, password, email, full_name, role) VALUES 
      ('admin', 'admin123', 'admin@inventory.com', 'Admin Quản Trị', 'admin'),
      ('user1', 'user123', 'user1@inventory.com', 'Người Dùng Test', 'user');
    `;

    // 2. Equipment

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
        if(err) console.error('Lỗi tạo user:', err);
        else console.log('Seed Users OK');
        
        conn.query(sqlEquipment, (err) => {
            if(err) console.error('Lỗi tạo thiết bị:', err);
            else {
                console.log('Seed Equipment OK');
  
                console.log('Hoàn tất quá trình seed dữ liệu!');
                // Đóng kết nối sau 1 giây
                setTimeout(() => {
                    conn.end();
                    process.exit();
                }, 1000);
            }
        });
    });
  });
}