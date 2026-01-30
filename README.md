# eBook Platform

A full-stack eBook management application built with React and Node.js. Manage your digital book collection with authentication and AI features.

## Features

- User authentication with JWT
- eBook management (upload, organize, manage books)
- AI-powered features
- Responsive UI with Tailwind CSS
- File uploads for books and covers

## Live Demo

- Frontend: https://ebook-platform-1ncj.vercel.app
- Frontend (GitHub Pages): https://vk-10.github.io/ebook-platform (Not working)
- Backend API: https://ebook-platform-jsai.onrender.com

## Tech Stack

### Frontend
- React 18+ with Vite
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- Lucide React for icons
- React Hot Toast for notifications
- Context API for state management

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vk-10/ebook-platform.git
cd ebook-platform
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to `.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# CORS - no spaces, no trailing slashes
ALLOWED_ORIGINS=http://localhost:5173,https://ebook-platform-1ncj.vercel.app,https://vk-10.github.io/ebook-platform

# AI features (optional)
OPENAI_API_KEY=your_openai_api_key
```

Important: Don't add trailing slashes to URLs in ALLOWED_ORIGINS.

```bash
# Start the backend server
npm start

# For development with auto-reload
npm run dev
```



### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Deployment

### Backend (Render)

The backend runs on Render's free tier.

**Cold Start Issue**

Render's free tier puts the app to sleep after 15 minutes of inactivity. First request takes 30-60 seconds to wake it up.

What happens:
- First login attempt might fail with network error
- Second attempt works (server is awake now)





## Project Structure

```
ebook-platform/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   └── aiRoutes.js
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ui/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── ...
    │   ├── utils/
    │   │   ├── axiosInstance.js
    │   │   └── apiPaths.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    ├── vite.config.js
    └── package.json
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (auth required)

### Books
- `GET /api/books` - Get all books (auth required)
- `POST /api/books` - Create new book (auth required)
- `GET /api/books/:id` - Get single book (auth required)
- `PUT /api/books/:id` - Update book (auth required)
- `DELETE /api/books/:id` - Delete book (auth required)

### AI
- `POST /api/ai/*` - AI features (auth required)

## Authentication Flow

1. User registers/logs in
2. Server validates and returns JWT token
3. Token stored in localStorage
4. Axios interceptor adds token to requests automatically
5. Protected routes verify token
6. Token expires after 7 days

## Known Issues

### First login fails, second works
**Cause:** Render free tier cold start


