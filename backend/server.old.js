const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql');

const db_content = fs.readFileSync(path.join(__dirname, 'mysql.json'));

const db = mysql.createConnection(JSON.parse(db_content));
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root123', // Use your MySQL root password
//     database: 'storage', // Use your storage database
// });
  
  // Connect to the database
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      return;
    }
    console.log('Connected to MySQL database');
  });


const usersFilePath = path.join(__dirname, 'users_data.json');

// Function to read users from file
const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) return [];
  const data = fs.readFileSync(usersFilePath);
  return JSON.parse(data);
};

// Function to write users to file
const writeUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/dashboard') {
    // Fetch data from MySQL database
    db.query('SELECT * FROM product', (err, results) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error fetching data from database' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  }else if (req.method === 'GET') {
    let filePath = path.join(__dirname, '../frontend', pathname === '/' ? 'index.html' : pathname);
    fs.readFile(filePath, (err, content) => {
    
      if(err){
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
        return;
      }
      //setting mime
      let contentType = 'text/html';
      if (pathname.endsWith('.css')) contentType = 'text/css';
      if (pathname.endsWith('.js')) contentType = 'application/javascript';

      //this runs if content is valid
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  }else if (req.method === 'POST' && pathname === '/api/signup') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const users = readUsers();

      if (users.find(user => user.username === username)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Username already exists' }));
      } else {
        users.push({ username, password });
        writeUsers(users);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User registered successfully' }));
      }
    });
  } else if (req.method === 'POST' && pathname === '/api/index') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const users = readUsers();

      if (users.find(user => user.username === username && user.password === password)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Login successful',redirect: 'dashboard.html' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid credentials' }));
      }
    });
} else if (req.method === 'POST' && pathname === '/api/product') {
    // Create a new product
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { name, amount } = JSON.parse(body);
      db.query('INSERT INTO product (name, amount) VALUES (?, ?)', [name, amount], (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error creating product' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Product created successfully' }));
      });
    });
  } else if (req.method === 'PUT' && pathname === '/api/product') {
    // Update an existing product
    console.log("updating product");
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { pname, amount } = JSON.parse(body);
      console.log("$$$",amount,"$$$");
      db.query('UPDATE product SET amount ='+ amount + ' WHERE name = '+ '"'+pname+'"', (err, result) => {
        if (err) {
          console.log(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error updating product' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Product updated successfully' }));
      });
    });
  } else if (req.method === 'DELETE' && pathname === '/api/product') {
    // Delete an existing product
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { pname } = JSON.parse(body);
      db.query('DELETE FROM product WHERE name = ?', [pname], (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error deleting product' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Product deleted successfully' }));
      });
    });
  }
});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});