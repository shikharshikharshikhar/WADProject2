const DB = require('dbcmps369');
const bcrypt = require('bcryptjs');

class ContactDB {
  constructor() {
    this.db = new DB('contacts.db');
  }

  async initialize() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT,
        email_address TEXT,
        street TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        contact_by_email INTEGER DEFAULT 0,
        contact_by_phone INTEGER DEFAULT 0
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create default user if it doesn't exist
    const existingUser = await this.getUserByUsername('cmps369');
    if (!existingUser) {
      await this.createUser({
        first_name: 'CMPS',
        last_name: '369',
        username: 'cmps369',
        password: 'rcnj'
      });
    }
  }

  // Contact methods
  async getAllContacts() {
    return await this.db.query('SELECT * FROM contacts ORDER BY last_name, first_name');
  }

  async getContactById(id) {
    const contacts = await this.db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    return contacts[0] || null;
  }

  async createContact(contact) {
    const result = await this.db.query(`
      INSERT INTO contacts 
      (first_name, last_name, phone_number, email_address, street, city, state, zip, country, contact_by_email, contact_by_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contact.first_name,
      contact.last_name,
      contact.phone_number,
      contact.email_address,
      contact.street,
      contact.city,
      contact.state,
      contact.zip,
      contact.country,
      contact.contact_by_email ? 1 : 0,
      contact.contact_by_phone ? 1 : 0
    ]);
    return result.lastInsertRowid;
  }

  async updateContact(id, contact) {
    await this.db.query(`
      UPDATE contacts SET
      first_name = ?, last_name = ?, phone_number = ?, email_address = ?,
      street = ?, city = ?, state = ?, zip = ?, country = ?,
      contact_by_email = ?, contact_by_phone = ?
      WHERE id = ?
    `, [
      contact.first_name,
      contact.last_name,
      contact.phone_number,
      contact.email_address,
      contact.street,
      contact.city,
      contact.state,
      contact.zip,
      contact.country,
      contact.contact_by_email ? 1 : 0,
      contact.contact_by_phone ? 1 : 0,
      id
    ]);
  }

  async deleteContact(id) {
    await this.db.query('DELETE FROM contacts WHERE id = ?', [id]);
  }

  // User methods
  async getUserByUsername(username) {
    const users = await this.db.query('SELECT * FROM users WHERE username = ?', [username]);
    return users[0] || null;
  }

  async getUserById(id) {
    const users = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return users[0] || null;
  }

  async createUser(user) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    const result = await this.db.query(`
      INSERT INTO users (first_name, last_name, username, password)
      VALUES (?, ?, ?, ?)
    `, [
      user.first_name,
      user.last_name,
      user.username,
      hashedPassword
    ]);
    return result.lastInsertRowid;
  }

  async validateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}

module.exports = ContactDB;
