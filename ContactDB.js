const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class ContactDB {
  constructor() {
    // Set the database path - use environment variable or default to local file
    const dbPath = process.env.DBPATH || path.join(__dirname, 'contacts.db');
    this.db = new sqlite3.Database(dbPath);
  }

  // Custom promisified run method that returns lastID and changes
  runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // Promisified get method
  getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Promisified all method
  allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Promisified exec method
  execAsync(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async initialize() {
    // Create contacts table
    await this.execAsync(`
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

    // Create users table
    await this.execAsync(`
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
    return await this.allAsync('SELECT * FROM contacts ORDER BY last_name, first_name');
  }

  async getContactById(id) {
    return await this.getAsync('SELECT * FROM contacts WHERE id = ?', [id]);
  }

  async createContact(contact) {
    const result = await this.runAsync(`
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
    return result.lastID;
  }

  async updateContact(id, contact) {
    await this.runAsync(`
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
    await this.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
  }

  // User methods
  async getUserByUsername(username) {
    return await this.getAsync('SELECT * FROM users WHERE username = ?', [username]);
  }

  async getUserById(id) {
    return await this.getAsync('SELECT * FROM users WHERE id = ?', [id]);
  }

  async createUser(user) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    const result = await this.runAsync(`
      INSERT INTO users (first_name, last_name, username, password)
      VALUES (?, ?, ?, ?)
    `, [
      user.first_name,
      user.last_name,
      user.username,
      hashedPassword
    ]);
    return result.lastID;
  }

  async validateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = ContactDB;
