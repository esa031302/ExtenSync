# ExtensSync

A modern full-stack web application for extension program management.

## 🚀 Tech Stack

- **Frontend**: React.js with Bootstrap for UI
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Styling**: Bootstrap 5

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Set Up Database
1. Create a MySQL database
2. Configure your database connection in `server/.env`
3. Run database setup:
```bash
npm run setup-db
```

### 3. Start Development Servers
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## ✨ Features

### 🔐 User Management
- User authentication and authorization
- Role-based access control
- Secure password hashing with bcrypt
- JWT token authentication

### 📊 Project Management
- Create and manage extension projects
- Project proposal system
- Project evaluation and monitoring
- Document upload and management

### 📈 System Monitoring
- Comprehensive activity logging
- Real-time system statistics
- Advanced filtering and search
- Performance tracking

### 🔒 Security
- CORS configuration
- Input validation
- Helmet.js security headers
- Protected file uploads

### 💬 Real-time Features
- Live notifications
- Real-time updates with Socket.io
- Interactive dashboard
