const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Đọc config từ mysql.json 
const db_content = fs.readFileSync(path.join(__dirname, '../mysql.json'));
const db = mysql.createConnection(JSON.parse(db_content));

// Kết nối database
db.connect((err) => {
  if (err) {
    console.error('❌ Lỗi kết nối MySQL:', err);
    return;
  }
  console.log('✅ Đã kết nối MySQL database');
});

module.exports = db;