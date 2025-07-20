import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { reportsAPI, downloadFile } from '../services/api';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Users2, 
  Calendar,
  Code,
  FileText,
  Eye,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  MapPin,
  Building,
  Mail,
  Phone,
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react';

const Reports = () => {
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [squadPerformance, setSquadPerformance] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [candidatesData, setCandidatesData] = useState([]);
  const [squadsData, setSquadsData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [comprehensiveRes, attendanceRes, squadRes, candidatesRes, squadsRes, attendanceDetailsRes] = await Promise.all([
        reportsAPI.getComprehensive(),
        reportsAPI.getAttendance(),
        reportsAPI.getSquadPerformance(),
        reportsAPI.getCandidates(),
        reportsAPI.getSquads(),
        reportsAPI.getAttendanceDetails()
      ]);
      
      setComprehensiveReport(comprehensiveRes.data);
      setAttendanceReport(attendanceRes.data);
      setSquadPerformance(squadRes.data);
      setCandidatesData(candidatesRes.data || []);
      setSquadsData(squadsRes.data || []);
      setAttendanceData(attendanceDetailsRes.data || []);
      
      // Generate attendance trends from attendance report data
      if (attendanceRes.data && attendanceRes.data.length > 0) {
        const trends = attendanceRes.data
          .slice(-7) // Last 7 days
          .map(record => ({
            date: record.date,
            attendance_count: record.total_attendance
          }));
        setAttendanceTrends(trends);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const response = await reportsAPI.downloadDetailedExcel({
        comprehensive: comprehensiveReport,
        attendance: attendanceReport,
        squadPerformance: squadPerformance,
        candidates: candidatesData,
        squads: squadsData,
        attendanceDetails: attendanceData,
        attendanceTrends: attendanceTrends
      });
      const filename = `hackathon_detailed_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(response.data, filename);
      toast.success('Detailed Excel report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  const viewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading comprehensive reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-purple-100 text-lg">Comprehensive insights and performance metrics</p>
                <div className="flex items-center mt-4 space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Real-time data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Performance tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4" />
                    <span>Professional insights</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 lg:mt-0">
                <button
                  onClick={handleDownloadExcel}
                  disabled={isDownloading}
                  className="group relative inline-flex items-center px-8 py-4 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl text-white font-semibold hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
                  <FileSpreadsheet className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">
                    {isDownloading ? 'Generating Report...' : 'Download Excel Report'}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Key Metrics Cards */}
        {comprehensiveReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Candidates</h3>
                <p className="text-3xl font-bold text-gray-900">{comprehensiveReport.summary.totalCandidates}</p>
                <p className="text-xs text-gray-500 mt-2">Registered participants</p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Squads</h3>
                <p className="text-3xl font-bold text-gray-900">{comprehensiveReport.summary.totalSquads}</p>
                <p className="text-xs text-gray-500 mt-2">Active teams</p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Attendance Days</h3>
                <p className="text-3xl font-bold text-gray-900">{comprehensiveReport.summary.totalAttendanceDays}</p>
                <p className="text-xs text-gray-500 mt-2">Total check-ins</p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {comprehensiveReport.summary.totalCandidates > 0 
                    ? Math.round((comprehensiveReport.summary.averageAttendancePerDay / comprehensiveReport.summary.totalCandidates) * 100)
                    : 0
                  }%
                </p>
                <p className="text-xs text-gray-500 mt-2">Average daily</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trends */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Attendance Trends</h2>
                  <p className="text-indigo-100">Last 7 days performance</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-200" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {attendanceTrends.map((trend, index) => (
                  <div key={index} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-gray-200 hover:border-indigo-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-300">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <p className="text-xs text-gray-500">Attendance day</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                          {trend.attendance_count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">present</p>
                    </div>
                  </div>
                ))}
                {attendanceTrends.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No attendance trends data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Squad Performance */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Squad Performance</h2>
                  <p className="text-purple-100">{squadPerformance.length} active squads</p>
                </div>
                <Users2 className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="p-6">
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {squadPerformance.map((squad, index) => (
                  <div key={index} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border border-gray-200 hover:border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                          <Users2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{squad.squad_name}</h3>
                          <p className="text-xs text-gray-500">Squad #{squad.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {squad.member_count} members
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-gray-600">{squad.total_attendance} attendance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Code className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">{squad.skills?.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {squadPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <Users2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No squad data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Skills Distribution */}
        {comprehensiveReport?.skillsDistribution && comprehensiveReport.skillsDistribution.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Skills Distribution</h2>
                  <p className="text-blue-100">{comprehensiveReport.skillsDistribution.length} unique skills</p>
                </div>
                <Code className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {comprehensiveReport.skillsDistribution.map((skill, index) => (
                  <div key={index} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 border border-gray-200 hover:border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                        <Code className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-lg font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        {skill.count}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{skill.skills}</h3>
                    <p className="text-xs text-gray-500">candidates</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Candidates Details */}
          {candidatesData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Candidates Details</h2>
                    <p className="text-green-100">{candidatesData.length} registered candidates</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </div>
              <div className="p-6">
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {candidatesData.slice(0, 10).map((candidate, index) => (
                    <div key={index} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border border-gray-200 hover:border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{candidate.name}</h3>
                            <p className="text-xs text-gray-500">#{candidate.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {candidate.skills?.split(',')[0] || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{candidate.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{candidate.university}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {candidatesData.length > 10 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        ... and {candidatesData.length - 10} more candidates
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Squads Details */}
          {squadsData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Squads Details</h2>
                    <p className="text-pink-100">{squadsData.length} active squads</p>
                  </div>
                  <Users2 className="h-8 w-8 text-pink-200" />
                </div>
              </div>
              <div className="p-6">
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {squadsData.slice(0, 8).map((squad, index) => (
                    <div key={index} className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-pink-50 hover:to-rose-50 transition-all duration-300 border border-gray-200 hover:border-pink-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors duration-300">
                            <Users2 className="h-4 w-4 text-pink-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{squad.squad_name}</h3>
                            <p className="text-xs text-gray-500">#{squad.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                            {squad.member_count || 0} members
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">Created: {new Date(squad.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Code className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">
                            Skills: {squad.skills ? [...new Set(squad.skills)].slice(0, 2).join(', ') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {squadsData.length > 8 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        ... and {squadsData.length - 8} more squads
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Report Generated</h3>
                <p className="text-indigo-100 text-sm">
                  {comprehensiveReport?.generatedAt ? 
                    new Date(comprehensiveReport.generatedAt).toLocaleString() : 
                    'Real-time data available'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100">HCLTech Hackathon Manager</p>
              <p className="text-xs text-indigo-200">Professional Analytics Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 