const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, 'hackathon.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Candidates table
      db.run(`
        CREATE TABLE IF NOT EXISTS candidates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          age INTEGER,
          degree TEXT,
          university TEXT,
          batch TEXT,
          phone TEXT,
          email TEXT UNIQUE,
          skills TEXT,
          resume_path TEXT,
          selfie_path TEXT,
          photo_url TEXT,
          qr_code TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Attendance table
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          candidate_id INTEGER,
          check_in_time DATETIME,
          check_out_time DATETIME,
          status TEXT DEFAULT 'present',
          FOREIGN KEY (candidate_id) REFERENCES candidates (id)
        )
      `);

      // Squads table
      db.run(`
        CREATE TABLE IF NOT EXISTS squads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Squad members table
      db.run(`
        CREATE TABLE IF NOT EXISTS squad_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          squad_id INTEGER,
          candidate_id INTEGER,
          role TEXT DEFAULT 'member',
          FOREIGN KEY (squad_id) REFERENCES squads (id),
          FOREIGN KEY (candidate_id) REFERENCES candidates (id)
        )
      `);

      // Admins table
      db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Initialize database on startup
initDatabase().catch(console.error);

module.exports = db; 