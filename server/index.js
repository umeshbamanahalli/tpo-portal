const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pool = require('./db'); // The database connection we created earlier
const authRoutes = require('./routes/auth'); // We will create this next
const studentRoutes = require('./routes/student');
const jobRoutes = require('./routes/jobs');
const adminRoutes = require('./routes/admin');
const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

const resumeDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}
app.use('/uploads/resumes', express.static(resumeDir));

// Test Database Connection
pool
  .query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\', \'rejected\'))')
  .catch((err) => {
    console.error('Schema sync warning (companies.status):', err.message);
  });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('PostgreSQL Connected at:', res.rows[0].now);
  }
});

// Routes
app.use('/api/auth', authRoutes);
// ... existing middleware
app.use('/api/student', studentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
// Root Route for testing
app.get('/', (req, res) => {
  res.send('PlaceNext DMS API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});