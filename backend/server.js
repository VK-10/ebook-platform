require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const aiRoutes = require('./routes/aiRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
)

connectDB();

app.use(express.json());

// dev only
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:8000 ws://localhost:8000; img-src 'self' data: http://localhost:8000; style-src 'self' 'unsafe-inline';"
  );
  next();
});


//static uploads
app.use("/backend/uploads", express.static(path.join(__dirname, "uploads")));

// Validate route modules before using them
// assertIsRouter(authRoutes, 'authRoutes');
// assertIsRouter(bookRoutes, 'bookRoutes');
// assertIsRouter(aiRoutes, 'aiRoutes');
// assertIsRouter(exportRoutes, 'exportRoutes');

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SERVER running on PORT ${PORT}`));