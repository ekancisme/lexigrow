# 📚 LexiGrow: Vocabulary Growth Tracker

> Ứng dụng web theo dõi và phát triển vốn từ vựng tiếng Anh, tích hợp AI để phân tích bài viết và đưa ra phản hồi thông minh cho học sinh & giáo viên.

---

## 🏗️ Kiến trúc dự án

| Thành phần | Mô tả |
|---|---|
| **Frontend** | Single Page Application (SPA) |
| **Backend** | RESTful API Server |
| **Database** | NoSQL Database |
| **AI Integration** | Phân tích bài viết & phản hồi tự động |

---

## 🚀 Công nghệ sử dụng

### 🎨 Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **React** | ^19.2.6 | Thư viện xây dựng giao diện người dùng |
| **React DOM** | ^19.2.6 | Render React components lên DOM |
| **React Router DOM** | ^7.15.1 | Điều hướng (Routing) SPA |
| **Vite** | ^8.0.12 | Build tool & Dev server siêu nhanh |
| **ESLint** | ^10.3.0 | Kiểm tra chất lượng code |
| **CSS thuần (Vanilla CSS)** | — | Styling giao diện |

### ⚙️ Backend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **Node.js** | — | Runtime JavaScript phía server |
| **Express** | ^5.1.0 | Framework xây dựng RESTful API |
| **Mongoose** | ^8.15.1 | ODM cho MongoDB |
| **JSON Web Token (JWT)** | ^9.0.2 | Xác thực & phân quyền người dùng |
| **bcryptjs** | ^3.0.2 | Mã hóa mật khẩu |
| **express-validator** | ^7.2.1 | Validate dữ liệu đầu vào |
| **cors** | ^2.8.5 | Xử lý Cross-Origin Resource Sharing |
| **dotenv** | ^16.5.0 | Quản lý biến môi trường |
| **multer** | ^2.0.1 | Upload file |
| **nodemailer** | ^8.0.9 | Gửi email (quên mật khẩu, thông báo) |
| **nodemon** | ^3.1.10 | Auto-restart server khi dev |

### 🤖 AI & Authentication

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **Google Generative AI (Gemini)** | ^0.24.1 | Phân tích bài viết, đánh giá từ vựng bằng AI |
| **Google Auth Library** | ^10.6.2 | Đăng nhập bằng Google OAuth |

### 🗄️ Cơ sở dữ liệu

| Công nghệ | Mục đích |
|---|---|
| **MongoDB** | Lưu trữ dữ liệu NoSQL (users, essays, vocabulary...) |

---

## 📂 Cấu trúc thư mục

```
LexiGrow/
├── 📁 public/                  # Tài nguyên tĩnh
├── 📁 src/                     # Mã nguồn Frontend
│   ├── 📁 assets/              # Hình ảnh, icons
│   ├── 📁 components/          # Components tái sử dụng
│   ├── 📁 contexts/            # React Context (state management)
│   ├── 📁 data/                # Dữ liệu tĩnh / mock data
│   ├── 📁 hooks/               # Custom React Hooks
│   ├── 📁 pages/               # Các trang giao diện
│   │   ├── 📁 auth/            # Login, Register, ForgotPassword
│   │   ├── 📁 student/         # Dashboard, WriteEssay, MyProgress...
│   │   └── 📁 teacher/         # Dashboard, ClassManagement, Alerts...
│   ├── 📁 services/            # API service layer
│   ├── 📁 styles/              # Global CSS styles
│   ├── 📁 utils/               # Hàm tiện ích
│   ├── App.jsx                 # Root component & routing
│   └── main.jsx                # Entry point
├── 📁 server/                  # Mã nguồn Backend
│   └── 📁 src/
│       ├── 📁 config/          # Cấu hình (DB, JWT...)
│       ├── 📁 controllers/     # Xử lý logic API
│       ├── 📁 middleware/      # Middleware (auth, validation...)
│       ├── 📁 models/          # Mongoose schemas
│       ├── 📁 routes/          # Định tuyến API
│       ├── 📁 services/        # Business logic & AI services
│       ├── 📁 utils/           # Hàm tiện ích server
│       └── index.js            # Entry point server
├── vite.config.js              # Cấu hình Vite
├── eslint.config.js            # Cấu hình ESLint
├── package.json                # Dependencies Frontend
└── index.html                  # HTML template
```

---

## 📊 Models (Cơ sở dữ liệu)

| Model | Mô tả |
|---|---|
| **User** | Thông tin người dùng (student / teacher) |
| **Essay** | Bài viết của học sinh |
| **Vocabulary** | Từ vựng đã học |
| **AIAnalysis** | Kết quả phân tích AI |
| **ManualFeedback** | Phản hồi thủ công từ giáo viên |
| **Class** | Quản lý lớp học |
| **WeeklyGoal** | Mục tiêu học tập hàng tuần |
| **Alert** | Cảnh báo sớm cho giáo viên |
| **SystemPrompt** | Quản lý prompt hệ thống cho AI |

---

## 🔑 Tính năng chính

### 👨‍🎓 Học sinh (Student)
- 📝 Viết bài luận (Essay Writing)
- 🤖 Nhận phản hồi AI tự động
- 📈 Theo dõi tiến độ học tập
- 🎯 Đặt mục tiêu hàng tuần
- 📖 Quản lý từ vựng

### 👩‍🏫 Giáo viên (Teacher)
- 📊 Dashboard tổng quan
- 🏫 Quản lý lớp học
- 👀 Xem chi tiết phân tích học sinh
- ✍️ Phản hồi thủ công bài viết
- ⚠️ Cảnh báo sớm học sinh yếu
- ⚙️ Quản lý System Prompts cho AI
- 👤 Cài đặt hồ sơ cá nhân

### 🔐 Xác thực (Authentication)
- Đăng nhập / Đăng ký
- Đăng nhập bằng Google OAuth
- Quên mật khẩu (qua Email)
- Phân quyền theo vai trò (Student / Teacher)

---

## 🛠️ Cách chạy dự án

### Frontend
```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev
# → http://localhost:5173
```

### Backend
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt dependencies
npm install

# Cấu hình file .env (copy từ .env.example)
cp .env.example .env

# Chạy dev server
npm run dev
# → http://localhost:5000
```

---

> **LexiGrow** — *Grow your vocabulary, one essay at a time!* 🌱
