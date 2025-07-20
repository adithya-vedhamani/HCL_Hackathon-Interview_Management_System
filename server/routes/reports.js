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



// Get all candidates for detailed reports
router.get('/candidates', (req, res) => {
  db.all(`
    SELECT 
      id, name, email, phone, university, skills, age, degree, batch, created_at
    FROM candidates
    ORDER BY name
  `, (err, candidates) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(candidates);
  });
});

// Get all squads for detailed reports
router.get('/squads', (req, res) => {
  db.all(`
    SELECT 
      s.id, s.name as squad_name, s.created_at,
      COUNT(sm.candidate_id) as member_count,
      GROUP_CONCAT(c.skills) as skills,
      GROUP_CONCAT(c.name) as member_names,
      GROUP_CONCAT(c.email) as member_emails,
      GROUP_CONCAT(c.university) as member_universities
    FROM squads s
    LEFT JOIN squad_members sm ON s.id = sm.squad_id
    LEFT JOIN candidates c ON sm.candidate_id = c.id
    GROUP BY s.id
    ORDER BY s.name
  `, (err, squads) => {
    if (err) {
      console.error('Error fetching squads:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Format the data for better readability
    const formattedSquads = squads.map(squad => ({
      ...squad,
      member_names: squad.member_names ? squad.member_names.split(',') : [],
      member_emails: squad.member_emails ? squad.member_emails.split(',') : [],
      member_universities: squad.member_universities ? squad.member_universities.split(',') : [],
      skills: squad.skills ? squad.skills.split(',') : []
    }));
    
    res.json(formattedSquads);
  });
});

// Get detailed attendance records
router.get('/attendance-details', (req, res) => {
  db.all(`
    SELECT 
      a.id,
      c.name as candidate_name,
      c.email,
      a.check_in_time,
      a.check_out_time,
      a.status,
      DATE(a.check_in_time) as date
    FROM attendance a
    JOIN candidates c ON a.candidate_id = c.id
    ORDER BY a.check_in_time DESC
  `, (err, attendance) => {
    if (err) {
      console.error('Error fetching attendance details:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(attendance);
  });
});

// Download detailed Excel report with multiple sheets
router.post('/download-detailed-excel', async (req, res) => {
  try {
    const { comprehensive, attendance, squadPerformance, candidates, squads, attendanceDetails, attendanceTrends } = req.body;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [{
      'Metric': 'Total Candidates',
      'Value': comprehensive?.summary?.totalCandidates || 0
    }, {
      'Metric': 'Total Squads',
      'Value': comprehensive?.summary?.totalSquads || 0
    }, {
      'Metric': 'Total Attendance Days',
      'Value': comprehensive?.summary?.totalAttendanceDays || 0
    }, {
      'Metric': 'Attendance Rate (%)',
      'Value': comprehensive?.summary?.totalCandidates > 0 ? 
        Math.round((comprehensive?.summary?.averageAttendancePerDay / comprehensive?.summary?.totalCandidates) * 100) : 0
    }, {
      'Metric': 'Report Generated',
      'Value': new Date().toLocaleString()
    }];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Candidates Sheet
    if (candidates && candidates.length > 0) {
      const candidatesData = candidates.map(c => ({
        'ID': c.id,
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone || 'N/A',
        'University': c.university,
        'Skills': c.skills,
        'Age': c.age || 'N/A',
        'Degree': c.degree || 'N/A',
        'Batch': c.batch || 'N/A',
        'Registration Date': c.created_at
      }));
      const candidatesSheet = XLSX.utils.json_to_sheet(candidatesData);
      XLSX.utils.book_append_sheet(workbook, candidatesSheet, 'Candidates');
    }

    // Squads Sheet
    if (squads && squads.length > 0) {
      const squadsData = squads.map(s => ({
        'Squad ID': s.id,
        'Squad Name': s.squad_name,
        'Member Count': s.member_count || 0,
        'Member Names': s.member_names ? s.member_names.join(', ') : 'N/A',
        'Member Emails': s.member_emails ? s.member_emails.join(', ') : 'N/A',
        'Member Universities': s.member_universities ? s.member_universities.join(', ') : 'N/A',
        'Team Skills': s.skills ? [...new Set(s.skills)].join(', ') : 'N/A',
        'Created Date': s.created_at
      }));
      const squadsSheet = XLSX.utils.json_to_sheet(squadsData);
      XLSX.utils.book_append_sheet(workbook, squadsSheet, 'Squads');
      
      // Detailed Squad Members Sheet
      const squadMembersData = [];
      squads.forEach(squad => {
        if (squad.member_names && squad.member_names.length > 0) {
          squad.member_names.forEach((name, index) => {
            const email = squad.member_emails && squad.member_emails[index] ? squad.member_emails[index] : 'N/A';
            const university = squad.member_universities && squad.member_universities[index] ? squad.member_universities[index] : 'N/A';
            const skills = squad.skills && squad.skills[index] ? squad.skills[index] : 'N/A';
            
            squadMembersData.push({
              'Squad ID': squad.id,
              'Squad Name': squad.squad_name,
              'Member Name': name,
              'Email': email,
              'University': university,
              'Skills': skills
            });
          });
        }
      });
      
      if (squadMembersData.length > 0) {
        const squadMembersSheet = XLSX.utils.json_to_sheet(squadMembersData);
        XLSX.utils.book_append_sheet(workbook, squadMembersSheet, 'Squad Members');
      }
    }

    // Attendance Sheet
    if (attendanceDetails && attendanceDetails.length > 0) {
      const attendanceData = attendanceDetails.map(a => ({
        'Attendance ID': a.id,
        'Candidate Name': a.candidate_name,
        'Email': a.email,
        'Date': a.date,
        'Check In Time': a.check_in_time,
        'Check Out Time': a.check_out_time || 'N/A',
        'Status': a.status
      }));
      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
    }

    // Skills Distribution Sheet
    if (comprehensive?.skillsDistribution && comprehensive.skillsDistribution.length > 0) {
      const skillsData = comprehensive.skillsDistribution.map(s => ({
        'Skill': s.skills,
        'Count': s.count,
        'Percentage': comprehensive?.summary?.totalCandidates > 0 ? 
          Math.round((s.count / comprehensive.summary.totalCandidates) * 100) : 0
      }));
      const skillsSheet = XLSX.utils.json_to_sheet(skillsData);
      XLSX.utils.book_append_sheet(workbook, skillsSheet, 'Skills Distribution');
    }

    // Attendance Trends Sheet
    if (attendanceTrends && attendanceTrends.length > 0) {
      const trendsData = attendanceTrends.map(t => ({
        'Date': t.date,
        'Attendance Count': t.attendance_count,
        'Total Candidates': comprehensive?.summary?.totalCandidates || 0,
        'Attendance Rate (%)': comprehensive?.summary?.totalCandidates > 0 ? 
          Math.round((t.attendance_count / comprehensive.summary.totalCandidates) * 100) : 0
      }));
      const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Attendance Trends');
    }

    // Squad Performance Sheet
    if (squadPerformance && squadPerformance.length > 0) {
      const performanceData = squadPerformance.map(s => ({
        'Squad ID': s.id,
        'Squad Name': s.squad_name,
        'Member Count': s.member_count || 0,
        'Total Attendance': s.total_attendance || 0,
        'Members': s.members ? s.members.join(', ') : 'N/A',
        'Skills': s.skills ? s.skills.join(', ') : 'N/A'
      }));
      const performanceSheet = XLSX.utils.json_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Squad Performance');
    }

    // Detailed Attendance Report Sheet
    if (attendance && attendance.length > 0) {
      const detailedAttendanceData = attendance.map(a => ({
        'Date': a.date,
        'Total Attendance': a.total_attendance,
        'Checked Out': a.checked_out || 0,
        'Currently Present': a.currently_present || 0,
        'Attendance Rate (%)': comprehensive?.summary?.totalCandidates > 0 ? 
          Math.round((a.total_attendance / comprehensive.summary.totalCandidates) * 100) : 0
      }));
      const detailedAttendanceSheet = XLSX.utils.json_to_sheet(detailedAttendanceData);
      XLSX.utils.book_append_sheet(workbook, detailedAttendanceSheet, 'Daily Attendance');
    }

    // Generate Excel file
    const fileName = `hackathon_detailed_report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  } catch (error) {
    console.error('Error generating detailed Excel report:', error);
    res.status(500).json({ error: 'Error generating detailed Excel report' });
  }
});

module.exports = router; 