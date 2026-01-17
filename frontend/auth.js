// Lấy các elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');

// Chuyển đổi giữa form đăng nhập và đăng ký
showLoginBtn.addEventListener('click', () => {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  showLoginBtn.classList.add('active');
  showRegisterBtn.classList.remove('active');
});

showRegisterBtn.addEventListener('click', () => {
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  showRegisterBtn.classList.add('active');
  showLoginBtn.classList.remove('active');
});

// ĐĂNG NHẬP
loginButton.addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Validate input
  if (!username || !password) {
    alert('Vui lòng nhập đầy đủ username và password!');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Đăng nhập thành công!');
      
      // Lưu thông tin user vào localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      // Chuyển trang dựa vào role
      if (data.user.role === 'admin') {
        window.location.href = '/admin_dashboard.html';
      } else {
        window.location.href = '/user_dashboard.html';
      }
    } else {
      alert(data.message || 'Đăng nhập thất bại!');
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('Không thể kết nối tới server!');
  }
});

// ĐĂNG KÝ
registerButton.addEventListener('click', async () => {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const email = document.getElementById('registerEmail').value.trim();
  const full_name = document.getElementById('registerFullname').value.trim();

  // Validate input
  if (!username || !password) {
    alert('Vui lòng nhập đầy đủ username và password!');
    return;
  }

  if (password.length < 3) {
    alert('Password phải có ít nhất 3 ký tự!');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        password, 
        email: email || null, 
        full_name: full_name || null 
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      
      // Chuyển về form đăng nhập
      showLoginBtn.click();
      
      // Xóa các input
      document.getElementById('registerUsername').value = '';
      document.getElementById('registerPassword').value = '';
      document.getElementById('registerEmail').value = '';
      document.getElementById('registerFullname').value = '';
    } else {
      alert(data.message || 'Đăng ký thất bại!');
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('Không thể kết nối tới server!');
  }
});
// Bắt sự kiện nhấn Enter để đăng nhập/đăng ký
document.getElementById('loginPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginButton.click();
  }
});

document.getElementById('registerFullname').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    registerButton.click();
  }
});