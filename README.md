# Hackathon Management System

A comprehensive hackathon management system with QR code attendance tracking, AI-powered squad formation, and detailed reporting capabilities.

## Features

### 🎯 Core Functionality
- **Excel Import**: Import candidate data from Microsoft Forms responses
- **QR Code Generation**: Unique QR codes for each candidate
- **Attendance Tracking**: QR code scanning for check-in/check-out
- **AI Squad Formation**: Intelligent team formation based on skills
- **Admin Dashboard**: Comprehensive management interface
- **Report Generation**: Detailed analytics and Excel exports

### 📱 QR Scanner App
- Mobile-friendly web interface
- Real-time attendance marking
- Candidate details display with photos
- Check-in/check-out functionality

### 🤖 AI-Powered Squad Formation
- **Similar Skills**: Group candidates with similar technical skills
- **Diverse Skills**: Create balanced teams with varied expertise
- **Fallback**: Random formation if AI is unavailable
- **Dynamic**: Real-time squad creation and management

### 📊 Admin Dashboard
- Real-time statistics and analytics
- Attendance trends and patterns
- University and skills distribution
- Squad performance metrics
- Recent activity feed

### 📈 Reporting System
- Comprehensive reports with all data
- Excel export functionality
- Attendance analytics
- Squad performance reports
- University performance tracking

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (lightweight and portable)
- **Groq API** for AI squad formation (using Llama3-8b model)
- **JWT** authentication
- **Multer** for file uploads
- **QRCode** generation
- **XLSX** for Excel processing

### Frontend
- **React.js** with modern hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React QR Scanner** for attendance
- **React Dropzone** for file uploads
- **Lucide React** for icons

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd hackathon-management-system
chmod +x setup.sh
./setup.sh
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Create Admin Account
```bash
# Start the server
npm run server

# In another terminal, create admin (replace with your credentials)
curl -X POST http://localhost:5000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### 4. Start Development
```bash
# Start server (in one terminal)
cd server && npm run dev

# Start client (in another terminal)
cd client && npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Usage Guide

### 1. Import Candidates
1. Export responses from Microsoft Forms to Excel
2. Go to Admin Dashboard → Candidates
3. Upload Excel file
4. System automatically generates QR codes

### 2. QR Code Attendance
1. Access QR Scanner at `/scanner`
2. Scan candidate QR codes
3. Mark attendance (check-in/check-out)
4. View candidate details and photos

### 3. Squad Formation
1. Go to Admin Dashboard → Squads
2. Choose formation type (similar/diverse skills)
3. Set squad size
4. AI creates optimal teams
5. Manual adjustments available

### 4. Generate Reports
1. Access Reports section in Admin Dashboard
2. View comprehensive analytics
3. Download Excel reports
4. Track performance metrics

## API Endpoints

### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates/import-excel` - Import from Excel
- `GET /api/candidates/:id` - Get specific candidate
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Attendance
- `POST /api/attendance/scan` - Scan QR code
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get statistics
- `PUT /api/attendance/:id` - Update attendance

### Squads
- `POST /api/squads/create-with-ai` - AI squad formation
- `GET /api/squads` - Get all squads
- `POST /api/squads` - Create manual squad
- `PUT /api/squads/:id` - Update squad
- `DELETE /api/squads/:id` - Delete squad

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/recent-activity` - Recent activity

### Reports
- `GET /api/reports/comprehensive` - Full report
- `GET /api/reports/download-excel` - Excel download
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/squad-performance` - Squad analytics

## Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: JWT signing secret
- `GROQ_API_KEY`: Groq API key for AI features (using Llama3-8b model)


### Database
The system uses SQLite for simplicity. The database file is automatically created at `server/hackathon.db`.

## File Structure
```
hackathon-management-system/
├── server/
│   ├── routes/
│   │   ├── candidates.js
│   │   ├── attendance.js
│   │   ├── squads.js
│   │   ├── admin.js
│   │   └── reports.js
│   ├── database.js
│   ├── index.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── package.json
├── env.example
└── README.md
```

## Deployment

### Production Setup
1. Set up environment variables
2. Build frontend: `npm run build`
3. Start production server: `npm start`
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates

### Docker Deployment
```bash
# Build and run with Docker
docker build -t hackathon-system .
docker run -p 5000:5000 hackathon-system
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create new issue with details
4. Contact development team

---

**Built with ❤️ for efficient hackathon management** 