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
- ⚙️ **Đồng bộ Settings** - Cài đặt lưu theo tài khoản

### Cho giảng viên
- ✏️ **Tạo khóa học** - Quản lý nội dung dễ dàng
- 📹 **Video & Bài viết** - Nhiều loại nội dung
- 👥 **Quản lý học viên** - Xem danh sách đăng ký

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

## 🛠️ Cài đặt nhanh

### Yêu cầu
- Node.js 20+
- PostgreSQL 15+
- Redis

### Cách 1: Dùng Script (Khuyến nghị)

```bash
# Cấp quyền
chmod +x start.sh

# Cài dependencies & chạy
./start.sh install
./start.sh

# Hoặc chạy riêng
./start.sh frontend  # Chỉ frontend
./start.sh backend   # Chỉ backend
./start.sh build     # Build production
```

### Cách 2: Thủ công

```bash
# 1. Cài dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Tạo database
psql -U postgres -c "CREATE DATABASE neoedu_dev;"
psql -U postgres -d neoedu_dev -f backend/src/db/schema.sql

# 3. Cấu hình môi trường
cp backend/.env.example backend/.env

# 4. Chạy
cd backend && npm run dev &
cd frontend && npm run dev
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health Check | http://localhost:4000/health |

### Tài khoản Admin mặc định

| Field | Value |
|-------|-------|
| Email | `admin@neoedu.vn` |
| Password | `Admin@123` |

> ⚠️ **Bắt buộc đổi mật khẩu sau khi đăng nhập lần đầu!**

---

## 📱 Routes

### Public (Không cần đăng nhập)
- `/` - Trang chủ
- `/courses` - Duyệt khóa học
- `/courses/[id]` - Chi tiết khóa học
- `/login` - Đăng nhập
- `/signup` - Đăng ký

### Dashboard (Cần đăng nhập)
- `/dashboard` - Tổng quan
- `/dashboard/courses` - Duyệt khóa học
- `/dashboard/my-courses` - Khóa học của tôi
- `/dashboard/profile` - Hồ sơ
- `/dashboard/settings` - Cài đặt (ngôn ngữ, giao diện)

---

## 🌐 Đa ngôn ngữ

- **Tiếng Việt** 🇻🇳 - Mặc định
- **English** 🇺🇸 - Có thể chuyển trong Settings

---

## ⚙️ Đồng bộ Settings

Khi đăng nhập, các cài đặt được lưu vào tài khoản:
- **Ngôn ngữ** - Tiếng Việt / English
- **Giao diện** - Light / Dark / System
- **Thông báo** - Bật / Tắt

Settings tự động đồng bộ khi thay đổi. Đăng nhập trên thiết bị khác sẽ tự động áp dụng cài đặt đã lưu.

---

## 🔧 Biến môi trường

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/neoedu
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
COOKIE_SECRET=your-cookie-secret
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Deploy lên Server

```bash
# 1. Chạy script cài đặt (root)
sudo bash setup.sh

# 2. Copy code
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dist' \
  ./ user@server:/opt/neoedu/

# 3. Build trên server
cd /opt/neoedu
./start.sh install
./start.sh build

# 4. Chạy với PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 📄 License

MIT License - Miễn phí cho cá nhân và thương mại.

---

<div align="center">
  Made with ❤️ by NEO EDU Team
</div>
