const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const db = require('../database');


const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Generate unique QR code
const generateQRCode = async (candidateId) => {
  const qrData = `HACKATHON_${candidateId}_${Date.now()}`;
  const qrCodePath = path.join(__dirname, '../uploads', `qr_${candidateId}.png`);
  
  await QRCode.toFile(qrCodePath, qrData, {
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrData;
};

// Import candidates from Excel or CSV file
router.post('/import-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let data = [];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension === '.csv') {
      // Handle CSV file
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    } else {
      // Handle Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    const importedCandidates = [];
    const validCandidates = data.filter(row => {
      const candidate = {
        name: row.Name || row.name,
        email: row.Email || row.email
      };
      return candidate.name && candidate.email;
    });

    // Process candidates sequentially to ensure proper counting
    for (const row of validCandidates) {
      const candidate = {
        name: row.Name || row.name,
        age: parseInt(row.Age || row.age) || null,
        degree: row.Degree || row.degree,
        university: row.University || row.university,
        batch: row.Batch || row.batch,
        phone: row.Phone || row.phone,
        email: row.Email || row.email,
        skills: row.Skills || row.skills,
        photo_url: row.Photo || row.photo || row.photo_url || null
      };

      // Check if candidate already exists
      const existing = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM candidates WHERE email = ?', [candidate.email], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (!existing) {
        // Insert new candidate
        const insertResult = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO candidates (name, age, degree, university, batch, phone, email, skills, photo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [candidate.name, candidate.age, candidate.degree, candidate.university, 
               candidate.batch, candidate.phone, candidate.email, candidate.skills, candidate.photo_url], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });

        // Generate QR code for new candidate
        const qrCode = await generateQRCode(insertResult);
        await new Promise((resolve, reject) => {
          db.run('UPDATE candidates SET qr_code = ? WHERE id = ?', [qrCode, insertResult], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        importedCandidates.push({ ...candidate, id: insertResult });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: `${fileExtension === '.csv' ? 'CSV' : 'Excel'} file processed successfully`, 
      importedCount: importedCandidates.length,
      candidates: importedCandidates 
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Get all candidates with pagination and search
router.get('/', (req, res) => {
  let { page = 1, limit = 10, search = '' } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  let whereClause = '';
  let params = [];
  let countParams = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    whereClause = 'WHERE name LIKE ? OR email LIKE ? OR university LIKE ? OR degree LIKE ? OR skills LIKE ?';
    params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
  }

  const countQuery = `SELECT COUNT(*) as total FROM candidates ${whereClause}`;
  const dataQuery = `SELECT * FROM candidates ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting candidates:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const total = countResult.total;
    db.all(dataQuery, [...params, limit, offset], (err, candidates) => {
      if (err) {
        console.error('Error fetching candidates:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        data: candidates,
        total,
        page,
        pageSize: limit
      });
    });
  });
});

// Get candidate by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM candidates WHERE id = ?', [id], (err, candidate) => {
    if (err) {
      console.error('Error fetching candidate:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  });
});

// Update candidate
router.put('/:id', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), (req, res) => {
  const { id } = req.params;
  const { name, age, degree, university, batch, phone, email, skills } = req.body;

  let updateFields = [];
  let updateValues = [];

  if (name) { updateFields.push('name = ?'); updateValues.push(name); }
  if (age) { updateFields.push('age = ?'); updateValues.push(age); }
  if (degree) { updateFields.push('degree = ?'); updateValues.push(degree); }
  if (university) { updateFields.push('university = ?'); updateValues.push(university); }
  if (batch) { updateFields.push('batch = ?'); updateValues.push(batch); }
  if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); }
  if (email) { updateFields.push('email = ?'); updateValues.push(email); }
  if (skills) { updateFields.push('skills = ?'); updateValues.push(skills); }

  // Handle file uploads
  if (req.files) {
    if (req.files.resume) {
      updateFields.push('resume_path = ?');
      updateValues.push(req.files.resume[0].filename);
    }
    if (req.files.selfie) {
      updateFields.push('selfie_path = ?');
      updateValues.push(req.files.selfie[0].filename);
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateValues.push(id);

  const query = `UPDATE candidates SET ${updateFields.join(', ')} WHERE id = ?`;

  db.run(query, updateValues, function(err) {
    if (err) {
      console.error('Error updating candidate:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ message: 'Candidate updated successfully' });
  });
});

// Get QR code for candidate
router.get('/:id/qr-code', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT qr_code FROM candidates WHERE id = ?', [id], (err, candidate) => {
    if (err) {
      console.error('Error fetching candidate QR code:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!candidate || !candidate.qr_code) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    res.json({ qrCode: candidate.qr_code });
  });
});

// Get QR code image for candidate
router.get('/:id/qr-image', async (req, res) => {
  const { id } = req.params;
  
  try {
    db.get('SELECT qr_code FROM candidates WHERE id = ?', [id], async (err, candidate) => {
      if (err) {
        console.error('Error fetching candidate QR code:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!candidate || !candidate.qr_code) {
        return res.status(404).json({ error: 'QR code not found' });
      }
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(candidate.qr_code, {
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        margin: 2
      });
      
      res.json({ qrCodeImage: qrCodeDataURL, qrCode: candidate.qr_code });
    });
  } catch (error) {
    console.error('Error generating QR code image:', error);
    res.status(500).json({ error: 'Error generating QR code image' });
  }
});

// Generate new QR code for candidate
router.post('/:id/generate-qr', async (req, res) => {
  const { id } = req.params;
  
  try {
    const qrCode = await generateQRCode(id);
    
    // Update QR code in database
    db.run('UPDATE candidates SET qr_code = ? WHERE id = ?', [qrCode, id], function(err) {
      if (err) {
        console.error('Error updating QR code:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ 
        message: 'QR code generated successfully', 
        qrCode
      });
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Error generating QR code' });
  }
});

// Clear all data (candidates, attendance, squads)
router.delete('/clear-all', (req, res) => {
  // Delete in order to maintain foreign key constraints
  db.serialize(() => {
    db.run('DELETE FROM squad_members', (err) => {
      if (err) {
        console.error('Error deleting squad members:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      db.run('DELETE FROM squads', (err) => {
        if (err) {
          console.error('Error deleting squads:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        db.run('DELETE FROM attendance', (err) => {
          if (err) {
            console.error('Error deleting attendance:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          db.run('DELETE FROM candidates', (err) => {
            if (err) {
              console.error('Error deleting candidates:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
              message: 'All data cleared successfully',
              cleared: {
                candidates: true,
                attendance: true,
                squads: true,
                squadMembers: true
              }
            });
          });
        });
      });
    });
  });
});

// Delete candidate
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM candidates WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting candidate:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  });
});

module.exports = router; 