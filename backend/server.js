const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;
const JWT_SECRET = "Aadhithyan"; // change this in production

// Serve uploaded images publicly from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`🌀 ${req.method} ${req.url}`);
  next();
});

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "PremaPleasant",
  database: "social_app",
});
db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

// JWT Auth Middleware
function requireLogin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Signup
app.post("/auth/signup", (req, res) => {
  const { username, email, password } = req.body;
  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (results.length > 0) return res.json({ message: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashed], (err) => {
      if (err) return res.json({ message: "Signup failed" });
      res.json({ message: "Signup successful" });
    });
  });
});

// Login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (results.length === 0) return res.json({ message: "Invalid credentials" });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  });
});

app.post("/auth/change-password", requireLogin, async (req, res) => {
  const { old_password, new_password } = req.body;
  const userId = req.user.id;

  // STEP 1: Get current password hash
  db.query("SELECT password FROM users WHERE id = ?", [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: "Database error or user not found" });
    }

    const currentHashedPassword = results[0].password;

    // STEP 2: Verify old password is correct
    const isOldPasswordCorrect = await bcrypt.compare(old_password, currentHashedPassword);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const isSameAsCurrent = await bcrypt.compare(new_password, currentHashedPassword);
if (isSameAsCurrent) {
  return res.status(400).json({ message: "New password must be different from current password" });
}

    // STEP 3: Get last 3 old password hashes from history
    db.query(
      "SELECT old_password FROM password_history WHERE user_id = ? ORDER BY changed_at DESC LIMIT 3",
      [userId],
      async (err, historyRows) => {
        if (err) return res.status(500).json({ message: "Error checking password history" });

        // STEP 4: Compare new password with each of the last 3
        for (let row of historyRows) {
          const isMatch = await bcrypt.compare(new_password, row.old_password);
          if (isMatch) {
            return res.status(400).json({ message: "Cannot reuse last 3 passwords" });
          }
        }

        // STEP 5: Hash the new password AFTER comparing
        const newHashedPassword = await bcrypt.hash(new_password, 10);

        // STEP 6: Update user password
        db.query("UPDATE users SET password = ? WHERE id = ?", [newHashedPassword, userId], (err) => {
          if (err) return res.status(500).json({ message: "Failed to update password" });

          // STEP 7: Store OLD password in history (this is the important part)
          db.query(
            "INSERT INTO password_history (user_id, old_password) VALUES (?, ?)",
            [userId, currentHashedPassword], // ✅ store CURRENT hash, not new one
            (err) => {
              if (err) return res.status(500).json({ message: "Failed to update password history" });

              res.json({ message: "Password changed successfully" });
            }
          );
        });
      }
    );
  });
});



// Create post (with image)
app.post("/posts/create", requireLogin, upload.single("image"), (req, res) => {
  const { content, is_public } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO posts (user_id, content, image_url, is_public) VALUES (?, ?, ?, ?)",
    [req.user.id, content, image, is_public === "on" ? 1 : 0],
    (err) => {
      if (err) return res.json({ message: "Post failed" });
      res.json({ message: "Post created" });
    }
  );
});

// Get posts
app.get("/posts", requireLogin, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT posts.*, users.username FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.is_public = 1 OR posts.user_id = ?
    ORDER BY posts.id DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.json({ message: "Error fetching posts" });
    res.json({ posts: results });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
