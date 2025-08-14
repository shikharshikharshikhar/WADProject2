const express = require('express');
const router = express.Router();

// Login form
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await req.db.validateUser(username, password);
    
    if (user) {
      req.session.userId = user.id;
      res.redirect('/');
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Server error during login' });
  }
});

// Signup form
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// Signup POST
router.post('/signup', async (req, res) => {
  try {
    const { first_name, last_name, username, password, confirm_password } = req.body;
    
    // Validation
    if (password !== confirm_password) {
      return res.render('signup', { error: 'Passwords do not match' });
    }
    
    // Check if username already exists
    const existingUser = await req.db.getUserByUsername(username);
    if (existingUser) {
      return res.render('signup', { error: 'Username already exists' });
    }
    
    // Create user
    await req.db.createUser({ first_name, last_name, username, password });
    res.redirect('/login');
  } catch (error) {
    console.error('Signup error:', error);
    res.render('signup', { error: 'Server error during signup' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
