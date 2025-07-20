const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

// Generate comprehensive report
router.get('/comprehensive', async (req, res) => {
  try {
    // Get all candidates with attendance
    db.all(`
      SELECT 
        c.*,
        COUNT(a.id) as total_attendance_days,
        MAX(a.check_in_time) as last_attendance
      FROM candidates c
      LEFT JOIN attendance a ON c.id = a.candidate_id
      GROUP BY c.id
      ORDER BY c.name
    `, async (err, candidates) => {
      if (err) {
        console.error('Error fetching candidates for report:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get all squads with members
      db.all(`
        SELECT 
          s.*,
          GROUP_CONCAT(c.name) as member_names,
          GROUP_CONCAT(c.skills) as member_skills
        FROM squads s
        LEFT JOIN squad_members sm ON s.id = sm.squad_id
        LEFT JOIN candidates c ON sm.candidate_id = c.id
        GROUP BY s.id
        ORDER BY s.name
      `, async (err, squads) => {
        if (err) {
          console.error('Error fetching squads for report:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Get attendance statistics
        db.all(`
          SELECT 
            DATE(check_in_time) as date,
            COUNT(*) as attendance_count,
            COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as checked_out_count
          FROM attendance
          GROUP BY DATE(check_in_time)
          ORDER BY date DESC
        `, async (err, attendanceStats) => {
          if (err) {
            console.error('Error fetching attendance stats for report:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get skills distribution
          db.all(`
            SELECT skills, COUNT(*) as count
            FROM candidates
            WHERE skills IS NOT NULL AND skills != ''
            GROUP BY skills
            ORDER BY count DESC
          `, async (err, skillsDistribution) => {
            if (err) {
              console.error('Error fetching skills distribution for report:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            const report = {
              generatedAt: new Date().toISOString(),
              summary: {
                totalCandidates: candidates.length,
                totalSquads: squads.length,
                totalAttendanceDays: attendanceStats.reduce((sum, stat) => sum + stat.attendance_count, 0),
                averageAttendancePerDay: attendanceStats.length > 0 ? 
                  (attendanceStats.reduce((sum, stat) => sum + stat.attendance_count, 0) / attendanceStats.length).toFixed(2) : 0
              },
              candidates: candidates.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
                university: c.university,
                skills: c.skills,
                totalAttendanceDays: c.total_attendance_days,
                lastAttendance: c.last_attendance,
                selfiePath: c.selfie_path,
                resumePath: c.resume_path
              })),
              squads: squads.map(s => ({
                id: s.id,
                name: s.name,
                memberNames: s.member_names ? s.member_names.split(',') : [],
                memberSkills: s.member_skills ? s.member_skills.split(',') : [],
                createdAt: s.created_at
              })),
              attendanceStats,
              skillsDistribution
            };

            res.json(report);
          });
        });
      });
    });

  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
});

// Download Excel report
router.get('/download-excel', async (req, res) => {
  try {
    // Get all candidates
    db.all(`
      SELECT 
        c.*,
        COUNT(a.id) as total_attendance_days,
        MAX(a.check_in_time) as last_attendance
      FROM candidates c
      LEFT JOIN attendance a ON c.id = a.candidate_id
      GROUP BY c.id
      ORDER BY c.name
    `, async (err, candidates) => {
      if (err) {
        console.error('Error fetching candidates for Excel:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get all squads
      db.all(`
        SELECT 
          s.*,
          GROUP_CONCAT(c.name) as member_names
        FROM squads s
        LEFT JOIN squad_members sm ON s.id = sm.squad_id
        LEFT JOIN candidates c ON sm.candidate_id = c.id
        GROUP BY s.id
        ORDER BY s.name
      `, async (err, squads) => {
        if (err) {
          console.error('Error fetching squads for Excel:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Candidates sheet
        const candidatesData = candidates.map(c => ({
          'ID': c.id,
          'Name': c.name,
          'Age': c.age,
          'Degree': c.degree,
          'University': c.university,
          'Batch': c.batch,
          'Phone': c.phone,
          'Email': c.email,
          'Skills': c.skills,
          'Total Attendance Days': c.total_attendance_days,
          'Last Attendance': c.last_attendance,
          'Registration Date': c.created_at
        }));

        const candidatesSheet = XLSX.utils.json_to_sheet(candidatesData);
        XLSX.utils.book_append_sheet(workbook, candidatesSheet, 'Candidates');

        // Squads sheet
        const squadsData = squads.map(s => ({
          'Squad ID': s.id,
          'Squad Name': s.name,
          'Members': s.member_names || '',
          'Created Date': s.created_at
        }));

        const squadsSheet = XLSX.utils.json_to_sheet(squadsData);
        XLSX.utils.book_append_sheet(workbook, squadsSheet, 'Squads');

        // Attendance sheet
        db.all(`
          SELECT 
            a.id,
            c.name as candidate_name,
            c.email,
            a.check_in_time,
            a.check_out_time,
            a.status
          FROM attendance a
          JOIN candidates c ON a.candidate_id = c.id
          ORDER BY a.check_in_time DESC
        `, async (err, attendance) => {
          if (err) {
            console.error('Error fetching attendance for Excel:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          const attendanceData = attendance.map(a => ({
            'Attendance ID': a.id,
            'Candidate Name': a.candidate_name,
            'Email': a.email,
            'Check In Time': a.check_in_time,
            'Check Out Time': a.check_out_time,
            'Status': a.status
          }));

          const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
          XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');

          // Generate Excel file
          const fileName = `hackathon_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          const filePath = path.join(__dirname, '../uploads', fileName);

          // Ensure uploads directory exists
          const uploadDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          XLSX.writeFile(workbook, filePath);

          // Send file
          res.download(filePath, fileName, (err) => {
            if (err) {
              console.error('Error sending file:', err);
            }
            // Clean up file after sending
            setTimeout(() => {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }, 5000);
          });
        });
      });
    });

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ error: 'Error generating Excel report' });
  }
});

// Get attendance report
router.get('/attendance', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT 
      DATE(a.check_in_time) as date,
      COUNT(*) as total_attendance,
      COUNT(CASE WHEN a.check_out_time IS NOT NULL THEN 1 END) as checked_out,
      COUNT(CASE WHEN a.check_out_time IS NULL THEN 1 END) as currently_present
    FROM attendance a
  `;

  let params = [];

  if (startDate && endDate) {
    query += ' WHERE DATE(a.check_in_time) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' GROUP BY DATE(a.check_in_time) ORDER BY date DESC';

  db.all(query, params, (err, attendanceReport) => {
    if (err) {
      console.error('Error generating attendance report:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(attendanceReport);
  });
});

// Get squad performance report
router.get('/squad-performance', (req, res) => {
  db.all(`
    SELECT 
      s.id,
      s.name as squad_name,
      COUNT(sm.candidate_id) as member_count,
      GROUP_CONCAT(c.name) as members,
      GROUP_CONCAT(c.skills) as skills,
      COUNT(a.id) as total_attendance
    FROM squads s
    LEFT JOIN squad_members sm ON s.id = sm.squad_id
    LEFT JOIN candidates c ON sm.candidate_id = c.id
    LEFT JOIN attendance a ON c.id = a.candidate_id
    GROUP BY s.id
    ORDER BY total_attendance DESC
  `, (err, squadPerformance) => {
    if (err) {
      console.error('Error generating squad performance report:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const formattedPerformance = squadPerformance.map(squad => ({
      ...squad,
      members: squad.members ? squad.members.split(',') : [],
      skills: squad.skills ? squad.skills.split(',') : []
    }));

    res.json(formattedPerformance);
  });
});



module.exports = router; 