# NEO EDU - Learning Management System

<div align="center">
  <img src="assets/logo.png" alt="NEO EDU Logo" width="120" />
  
  **Nền tảng học trực tuyến | Hỗ trợ Offline | Miễn phí**

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
</div>

---

## 🚀 Tính năng

### Cho học viên
- 📚 **Duyệt & Đăng ký** - Khám phá khóa học theo danh mục
- 💾 **Học Offline** - Hoạt động không cần internet
- 📊 **Theo dõi tiến độ** - Xem hành trình học tập
- 🌐 **Đa ngôn ngữ** - Tiếng Việt & English
- 📝 **Làm bài thi** - Nhiều loại câu hỏi (MCQ, Đúng/Sai, Trả lời ngắn)
- 📖 **Wiki** - Tra cứu tài liệu học tập

### Cho giảng viên
- ✏️ **Tạo khóa học** - Quản lý nội dung dễ dàng
- 📹 **Video & Bài viết** - Nhiều loại nội dung
- 👥 **Quản lý học viên** - Xem danh sách đăng ký
- 🏆 **Tổ chức thi** - Tạo cuộc thi & Xem Live Leaderboard

### Cho Admin
- 👤 **Quản lý Users** - CRUD users, phân quyền
- 📚 **Quản lý Courses** - Duyệt, chỉnh sửa khóa học
- 📝 **Quản lý Exams** - Tạo bài thi, xem kết quả
- 📖 **Quản lý Wiki** - Thêm, sửa, xóa bài viết
- 🏆 **Quản lý Contests** - Tổ chức cuộc thi trực tuyến
- 📊 **Analytics** - Thống kê người dùng, khóa học

### Bảo mật
- 🔒 **Cookie HTTP-only** - Bảo vệ token khỏi XSS
- 🛡️ **CSRF Protection** - Token xác thực
- 👮 **Phân quyền** - Student / Instructor / Admin

---

## 📦 Tech Stack

| Frontend | Backend |
|----------|---------|
| Next.js 15 | Express.js |
| React 19 | PostgreSQL |
| Tailwind CSS | Redis |
| React Query | Socket.IO |
| Zustand | JWT + Cookies |

---

## 🛠️ Cài đặt

### Yêu cầu
- Node.js 20+
- PostgreSQL 15+
- Redis (optional)

### Cách 1: Dùng Setup Script (Khuyến nghị)

```bash
# Clone repository
git clone https://github.com/your-repo/neoedu.git
cd neoedu

# Chạy script setup
chmod +x setup.sh
./setup.sh
```

Script sẽ tự động:
- ✅ Kiểm tra dependencies
- ✅ Tạo database PostgreSQL
- ✅ Chạy schema SQL
- ✅ Cài đặt npm packages
- ✅ Tạo file .env
- ✅ Tạo admin user

### Cách 2: Thủ công

```bash
# 1. Cài dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Tạo database
sudo -u postgres psql -c "CREATE DATABASE neoedu;"
sudo -u postgres psql -d neoedu -f backend/src/db/schema.sql

# 3. Tạo file .env
cp backend/.env.example backend/.env
# Chỉnh sửa backend/.env với thông tin database

# 4. Tạo admin user
cd backend && npm run cli create-admin admin@neoedu.vn "Admin" Admin@123

# 5. Chạy
cd backend && npm run dev &
cd frontend && npm run dev
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### Tài khoản Admin mặc định

| Field | Value |
|-------|-------|
| Email | `admin@neoedu.vn` |
| Password | `Admin@123` |

> ⚠️ **Bắt buộc đổi mật khẩu sau khi đăng nhập lần đầu!**

### Database mặc định

| Field | Value |
|-------|-------|
| Database | `neoedu_db` |
| User | `neoedu` |
| Password | `neoedu_secure_password_change_me` |

> 💡 Nếu setup thủ công, bạn có thể dùng bất kỳ credentials nào và cập nhật trong `.env`

---

## 💻 CLI Commands

Backend CLI cho phép quản lý qua command line:

```bash
cd backend
npm run cli <command> [args]
```

### Các lệnh có sẵn

| Lệnh | Mô tả |
|------|-------|
| `create-admin <email> <name> [password]` | Tạo admin mới |
| `list-users [role]` | Liệt kê users (optional: filter by role) |
| `set-role <email> <role>` | Đổi role (admin/instructor/student) |
| `reset-password <email> [new-password]` | Reset mật khẩu user |
| `delete-user <email>` | Xóa user |
| `help` | Hiển thị trợ giúp |

### Ví dụ

```bash
# Tạo admin mới
npm run cli create-admin teacher@school.edu "Nguyen Van A" MyPassword123

# Liệt kê tất cả admin
npm run cli list-users admin

# Liệt kê tất cả users
npm run cli list-users

# Reset mật khẩu
npm run cli reset-password user@email.com NewPassword123

# Đổi role thành instructor
npm run cli set-role user@email.com instructor

# Xóa user
npm run cli delete-user user@email.com
```

---

## 📱 Routes

### Public (Guest có thể truy cập)
| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ |
| `/login` | Đăng nhập |
| `/signup` | Đăng ký |
| `/dashboard` | Dashboard (xem tổng quan) |
| `/dashboard/courses` | Duyệt khóa học |
| `/dashboard/courses/[id]` | Chi tiết khóa học |
| `/dashboard/wiki` | Danh sách Wiki |
| `/dashboard/wiki/[slug]` | Chi tiết Wiki |
| `/dashboard/exams` | Danh sách bài thi |
| `/dashboard/exams/[id]` | Chi tiết bài thi |

### Yêu cầu đăng nhập
| Route | Mô tả |
|-------|-------|
| `/dashboard/my-courses` | Khóa học của tôi |
| `/dashboard/profile` | Hồ sơ cá nhân |
| `/dashboard/settings` | Cài đặt |
| `/dashboard/exams/[id]/take` | Làm bài thi |
| `/dashboard/exams/[id]/result` | Xem kết quả |

### Admin Only
| Route | Mô tả |
|-------|-------|
| `/dashboard/admin` | Admin Panel |
| `/dashboard/admin/users` | Quản lý Users |
| `/dashboard/admin/courses` | Quản lý Courses |
| `/dashboard/admin/lessons` | Quản lý Lessons |
| `/dashboard/admin/exams` | Quản lý Exams |
| `/dashboard/admin/wiki` | Quản lý Wiki |
| `/dashboard/admin/contests` | Quản lý Contests |
| `/dashboard/admin/analytics` | Thống kê |
| `/dashboard/admin/settings` | Cài đặt hệ thống |

---

## 📝 Loại câu hỏi trong Exam

### 1. Multiple Choice (Trắc nghiệm)
- 4 đáp án A, B, C, D
- Chọn 1 đáp án đúng

### 2. True/False (Đúng/Sai)
- 4 ý nhỏ: a), b), c), d)
- Chọn Đ (Đúng) hoặc S (Sai) cho mỗi ý
- **Thang điểm:**
  - 1 ý đúng = 0.1 điểm
  - 2 ý đúng = 0.25 điểm
  - 3 ý đúng = 0.5 điểm
  - 4 ý đúng = 1 điểm

### 3. Short Answer (Trả lời ngắn)
- Nhập đáp án số
- Chỉ cho phép: số, dấu phẩy, dấu âm
- Ví dụ: `-2,5` hoặc `100`

---

## 🔧 Biến môi trường

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neoedu

# JWT
JWT_SECRET=your-super-secret-key-change-me
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000

# Cookie
COOKIE_SECRET=your-cookie-secret
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Deploy lên Server

### Cách 1: Dùng Setup Script

```bash
# SSH vào server
ssh user@server

# Clone code
git clone https://github.com/your-repo/neoedu.git
cd neoedu

# Chạy setup
chmod +x setup.sh
./setup.sh
```

### Cách 2: Dùng PM2

```bash
# Build
cd frontend && npm run build
cd backend && npm run build

# Chạy với PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### Lỗi "relation does not exist"

Database chưa có bảng. Chạy lại schema:

```bash
sudo -u postgres psql -d neoedu -f backend/src/db/schema.sql
```

### Lỗi "role does not exist"

Kết nối với user postgres:

```bash
sudo -u postgres psql -d neoedu
```

### Lỗi Redis connection

Redis không bắt buộc. Nếu không có Redis, caching sẽ bị disable:

```bash
# Cài Redis (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis
```

### Lỗi 404 trên /dashboard/*

Đảm bảo folder `frontend/src/app/dashboard` (không phải `(dashboard)`) tồn tại.

---

## 📄 License

MIT License - Miễn phí cho cá nhân và thương mại.

---

<div align="center">
  Made with ❤️ by NEO EDU Team
</div>
