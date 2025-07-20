const express = require('express');
const db = require('../database');

const router = express.Router();

// Scan QR code and mark attendance
router.post('/scan', (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({ error: 'QR code is required' });
  }

  // Find candidate by QR code
  db.get('SELECT * FROM candidates WHERE qr_code = ?', [qrCode], (err, candidate) => {
    if (err) {
      console.error('Error finding candidate:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!candidate) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    // Check if attendance already exists for today
    const today = new Date().toISOString().split('T')[0];
    
    db.get(`
      SELECT * FROM attendance 
      WHERE candidate_id = ? AND DATE(check_in_time) = ?
    `, [candidate.id, today], (err, existingAttendance) => {
      if (err) {
        console.error('Error checking attendance:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingAttendance) {
        // Update check-out time if already checked in
        if (!existingAttendance.check_out_time) {
          db.run(`
            UPDATE attendance 
            SET check_out_time = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [existingAttendance.id], function(err) {
            if (err) {
              console.error('Error updating check-out:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: 'Check-out successful',
              candidate: {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                university: candidate.university,
                skills: candidate.skills,
                selfie_path: candidate.selfie_path
              },
              attendance: {
                check_in_time: existingAttendance.check_in_time,
                check_out_time: new Date().toISOString(),
                status: 'checked_out'
              }
            });
          });
        } else {
          res.json({
            message: 'Already checked out today',
            candidate: {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              university: candidate.university,
              skills: candidate.skills,
              selfie_path: candidate.selfie_path
            },
            attendance: existingAttendance
          });
        }
      } else {
        // Create new attendance record
        db.run(`
          INSERT INTO attendance (candidate_id, check_in_time, status)
          VALUES (?, CURRENT_TIMESTAMP, 'present')
        `, [candidate.id], function(err) {
          if (err) {
            console.error('Error creating attendance:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: 'Check-in successful',
            candidate: {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              university: candidate.university,
              skills: candidate.skills,
              selfie_path: candidate.selfie_path
            },
            attendance: {
              check_in_time: new Date().toISOString(),
              status: 'present'
            }
          });
        });
      }
    });
  });
});

// Get attendance for a specific candidate
router.get('/candidate/:id', (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT a.*, c.name, c.email 
    FROM attendance a 
    JOIN candidates c ON a.candidate_id = c.id 
    WHERE a.candidate_id = ? 
    ORDER BY a.check_in_time DESC
  `, [id], (err, attendance) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(attendance);
  });
});

// Get all attendance records
router.get('/', (req, res) => {
  const { date } = req.query;

  let query = `
    SELECT a.*, c.name, c.email, c.university, c.skills, c.selfie_path
    FROM attendance a 
    JOIN candidates c ON a.candidate_id = c.id 
  `;

  let params = [];

  if (date) {
    query += ' WHERE DATE(a.check_in_time) = ?';
    params.push(date);
  }

  query += ' ORDER BY a.check_in_time DESC';

  db.all(query, params, (err, attendance) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(attendance);
  });
});

// Get attendance statistics
router.get('/stats', (req, res) => {
  const { date } = req.query;

  let dateFilter = '';
  let params = [];

  if (date) {
    dateFilter = 'WHERE DATE(a.check_in_time) = ?';
    params.push(date);
  }

  const query = `
    SELECT 
      COUNT(*) as total_attendance,
      COUNT(CASE WHEN a.check_out_time IS NULL THEN 1 END) as currently_present,
      COUNT(CASE WHEN a.check_out_time IS NOT NULL THEN 1 END) as checked_out
    FROM attendance a 
    ${dateFilter}
  `;

  db.get(query, params, (err, stats) => {
    if (err) {
      console.error('Error fetching attendance stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(stats);
  });
});

// Manual attendance update
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, check_in_time, check_out_time } = req.body;

  let updateFields = [];
  let updateValues = [];

  if (status) { updateFields.push('status = ?'); updateValues.push(status); }
  if (check_in_time) { updateFields.push('check_in_time = ?'); updateValues.push(check_in_time); }
  if (check_out_time) { updateFields.push('check_out_time = ?'); updateValues.push(check_out_time); }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateValues.push(id);

  const query = `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`;

  db.run(query, updateValues, function(err) {
    if (err) {
      console.error('Error updating attendance:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance updated successfully' });
  });
});

module.exports = router; 