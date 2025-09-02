# ExtenSync - Full Stack Application

A modern full-stack web application built with MySQL, React, Express + Node.js, and Bootstrap.

## 🚀 Tech Stack

- **Frontend**: React.js with Bootstrap for UI
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Styling**: Bootstrap 5

## 📁 Project Structure

```
extensync/
├── client/          # React frontend application
├── server/          # Express + Node.js backend API
├── database/        # MySQL database scripts and setup
├── package.json     # Root package.json for project management
└── README.md        # This file
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://dev.mysql.com/downloads/) (v8.0 or higher)
- [Git](https://git-scm.com/)

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

## 🔧 Configuration

### Environment Variables
1. Copy the environment template:
```bash
cp server/env.template server/.env
```

2. Edit `server/.env` with your actual values:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=extensync_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

**Important**: Never commit your `.env` file to version control. It contains sensitive information.

## 📝 Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the React app for production
- `npm run install-all` - Install dependencies for both frontend and backend
- `npm run setup-db` - Set up the database schema

## 🌐 API Endpoints

The backend API will be available at `http://localhost:5000/api/`

## 🎨 Frontend

The React application will be available at `http://localhost:3000/`

## 📊 Database

MySQL database with the following features:
- User authentication and authorization
- RESTful API endpoints
- Secure password hashing
- JWT token authentication
- Comprehensive system logging

## 📋 System Logs

The application includes a comprehensive logging system that tracks all user activities:

### Features:
- **Role-based access**: Non-admin users see only their own logs, admins see all system logs
- **Detailed tracking**: Captures user actions, entity changes, request details, and response times
- **Advanced filtering**: Filter by action type, entity type, date range, and more
- **Statistics dashboard**: Admin-only statistics showing system usage patterns
- **Real-time logging**: Automatic logging of all API requests and responses

### Logged Activities:
- User authentication (login/logout)
- User management (create, update, delete)
- Project operations (create, update, evaluate)
- Document uploads and management
- System errors and performance metrics

### Access:
- Navigate to `/logs` in the application
- Use filters to find specific activities
- View detailed information for each log entry
- Export and manage log data (admin only)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Input validation
- Helmet.js for security headers

## 🚀 Deployment

### GitHub Deployment

1. **Initialize Git repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub repository**:
   - Go to [GitHub](https://github.com) and create a new repository
   - Don't initialize with README (since you already have one)

3. **Connect local repository to GitHub**:
```bash
git remote add origin https://github.com/yourusername/extensync.git
git branch -M main
git push -u origin main
```

4. **Environment Setup for Production**:
   - Copy `server/env.template` to `server/.env` on your production server
   - Update all environment variables with production values
   - Use a strong JWT secret (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

5. **Production Deployment Options**:
   - **Heroku**: Use the provided `package.json` scripts
   - **VPS/Cloud**: Use PM2 for process management
   - **Docker**: Containerize both frontend and backend
   - **Vercel/Netlify**: Deploy frontend separately, backend on another service

### Pre-deployment Checklist

- [ ] All sensitive data is in environment variables
- [ ] `.env` files are not committed to Git
- [ ] Database is set up and accessible
- [ ] All dependencies are listed in `package.json`
- [ ] Frontend build works (`npm run build`)
- [ ] Backend starts successfully (`npm run start`)

### Production Commands

```bash
# Install dependencies
npm run install-all

# Build frontend
npm run build

# Start production server
cd server && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
