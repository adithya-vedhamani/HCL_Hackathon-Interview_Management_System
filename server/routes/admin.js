const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

// JWT secret (you should set this in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      console.error('Error finding admin:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcrypt.compare(password, admin.password_hash, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    });
  });
});

// Create admin (for initial setup)
router.post('/create', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', 
      [username, hashedPassword], function(err) {
      if (err) {
        console.error('Error creating admin:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        message: 'Admin created successfully',
        admin: {
          id: this.lastID,
          username
        }
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error creating admin' });
  }
});

// Get dashboard statistics
router.get('/dashboard', authenticateToken, (req, res) => {
  // Get total candidates
  db.get('SELECT COUNT(*) as total FROM candidates', (err, candidateCount) => {
    if (err) {
      console.error('Error getting candidate count:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    db.get(`
      SELECT COUNT(*) as present_today 
      FROM attendance 
      WHERE DATE(check_in_time) = ?
    `, [today], (err, attendanceToday) => {
      if (err) {
        console.error('Error getting attendance count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get total squads
      db.get('SELECT COUNT(*) as total_squads FROM squads', (err, squadCount) => {
        if (err) {
          console.error('Error getting squad count:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Get skills distribution
        db.all(`
          SELECT skills, COUNT(*) as count
          FROM candidates
          WHERE skills IS NOT NULL AND skills != ''
          GROUP BY skills
          ORDER BY count DESC
          LIMIT 10
        `, (err, skillsDistribution) => {
          if (err) {
            console.error('Error getting skills distribution:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            totalCandidates: candidateCount.total,
            presentToday: attendanceToday.present_today,
            totalSquads: squadCount.total_squads,
            skillsDistribution,
            date: today
          });
        });
      });
    });
  });
});

// Get recent activity
router.get('/recent-activity', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      'attendance' as type,
      a.check_in_time as timestamp,
      c.name as candidate_name,
      'checked in' as action
    FROM attendance a
    JOIN candidates c ON a.candidate_id = c.id
    WHERE DATE(a.check_in_time) = DATE('now')
    UNION ALL
    SELECT 
      'squad' as type,
      s.created_at as timestamp,
      s.name as squad_name,
      'created' as action
    FROM squads s
    WHERE DATE(s.created_at) = DATE('now')
    ORDER BY timestamp DESC
    LIMIT 20
  `, (err, activities) => {
    if (err) {
      console.error('Error getting recent activity:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(activities);
  });
});

// Get university distribution
router.get('/university-stats', authenticateToken, (req, res) => {
  db.all(`
    SELECT university, COUNT(*) as count
    FROM candidates
    WHERE university IS NOT NULL AND university != ''
    GROUP BY university
    ORDER BY count DESC
  `, (err, universityStats) => {
    if (err) {
      console.error('Error getting university stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(universityStats);
  });
});

// Get attendance trends
router.get('/attendance-trends', authenticateToken, (req, res) => {
  const { days = 7 } = req.query;

  db.all(`
    SELECT 
      DATE(check_in_time) as date,
      COUNT(*) as attendance_count
    FROM attendance
    WHERE check_in_time >= DATE('now', '-${days} days')
    GROUP BY DATE(check_in_time)
    ORDER BY date
  `, (err, trends) => {
    if (err) {
      console.error('Error getting attendance trends:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(trends);
  });
});

// Get all admins
router.get('/all', authenticateToken, (req, res) => {
  db.all('SELECT id, username, password_hash, created_at FROM admins ORDER BY created_at DESC', (err, admins) => {
    if (err) {
      console.error('Error getting admins:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(admins);
  });
});

// Update admin
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    let updateQuery = 'UPDATE admins SET username = ?';
    let params = [username];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    db.run(updateQuery, params, function(err) {
      if (err) {
        console.error('Error updating admin:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ message: 'Admin updated successfully' });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error updating admin' });
  }
});

// Delete admin
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Prevent deleting the last admin
  db.get('SELECT COUNT(*) as count FROM admins', (err, result) => {
    if (err) {
      console.error('Error checking admin count:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    db.run('DELETE FROM admins WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting admin:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ message: 'Admin deleted successfully' });
    });
  });
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

module.exports = router; 