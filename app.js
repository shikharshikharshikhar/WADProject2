const express = require('express');
const session = require('express-session');
const ContactDB = require('./ContactDB');
const path = require('path');

// Set DBPATH environment variable if not already set
if (!process.env.DBPATH) {
  process.env.DBPATH = path.join(__dirname, 'contacts.db');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database initialization
const db = new ContactDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'cmps369-contact-app-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Database middleware
app.use((req, res, next) => {
  req.db = db;
  next();
});

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Routes
const contactRoutes = require('./routes/contacts');
const authRoutes = require('./routes/auth');

app.use('/', contactRoutes);
app.use('/', authRoutes);

// Initialize database and start server
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
