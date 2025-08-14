const express = require('express');
const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Home page - show all contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await req.db.getAllContacts();
    res.render('index', { 
      contacts,
      user: req.session.userId ? await req.db.getUserById(req.session.userId) : null
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).send('Server error');
  }
});

// Create contact form - MUST come before /:id routes
router.get('/create', requireAuth, (req, res) => {
  res.render('create');
});

// Create contact POST - MUST come before /:id routes
router.post('/create', requireAuth, async (req, res) => {
  try {
    const contactData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone_number: req.body.phone_number,
      email_address: req.body.email_address,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      country: req.body.country,
      contact_by_email: req.body.contact_by_email !== undefined,
      contact_by_phone: req.body.contact_by_phone !== undefined
    };

    await req.db.createContact(contactData);
    res.redirect('/');
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).send('Server error');
  }
});

// Edit contact form - MUST come before /:id route
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const contact = await req.db.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).send('Contact not found');
    }
    res.render('edit', { contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).send('Server error');
  }
});

// Edit contact POST - MUST come before /:id route
router.post('/:id/edit', requireAuth, async (req, res) => {
  try {
    const contactData = {
      first_name: req.body.first_name || '',
      last_name: req.body.last_name || '',
      phone_number: req.body.phone_number || '',
      email_address: req.body.email_address || '',
      street: req.body.street || '',
      city: req.body.city || '',
      state: req.body.state || '',
      zip: req.body.zip || '',
      country: req.body.country || '',
      contact_by_email: req.body.contact_by_email !== undefined,
      contact_by_phone: req.body.contact_by_phone !== undefined
    };

    await req.db.updateContact(req.params.id, contactData);
    res.redirect(`/${req.params.id}`);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).send('Server error');
  }
});

// Delete confirmation - MUST come before /:id route
router.get('/:id/delete', requireAuth, async (req, res) => {
  try {
    const contact = await req.db.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).send('Contact not found');
    }
    res.render('delete', { contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).send('Server error');
  }
});

// Delete contact POST - MUST come before /:id route
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    await req.db.deleteContact(req.params.id);
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Server error');
  }
});

// View specific contact - MUST come LAST among /:id routes
router.get('/:id', async (req, res) => {
  try {
    const contact = await req.db.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).send('Contact not found');
    }
    res.render('contact', { 
      contact,
      user: req.session.userId ? await req.db.getUserById(req.session.userId) : null
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
