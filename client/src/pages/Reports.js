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
  Building,
  Code,
  FileText,
  Eye
} from 'lucide-react';

const Reports = () => {
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [squadPerformance, setSquadPerformance] = useState([]);
  const [universityPerformance, setUniversityPerformance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [comprehensiveRes, attendanceRes, squadRes, universityRes] = await Promise.all([
        reportsAPI.getComprehensive(),
        reportsAPI.getAttendance(),
        reportsAPI.getSquadPerformance(),
        reportsAPI.getUniversityPerformance()
      ]);
      
      setComprehensiveReport(comprehensiveRes.data);
      setAttendanceReport(attendanceRes.data);
      setSquadPerformance(squadRes.data);
      setUniversityPerformance(universityRes.data);
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
      const response = await reportsAPI.downloadExcel();
      const filename = `hackathon_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(response.data, filename);
      toast.success('Excel report downloaded successfully');
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
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {comprehensiveReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.summary.totalCandidates}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users2 className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Squads</p>
                <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.summary.totalSquads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.summary.totalAttendanceDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Attendance/Day</p>
                <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.summary.averageAttendancePerDay}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Report */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Trends</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {attendanceReport.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.total_attendance} present, {record.checked_out} checked out
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    {record.currently_present} currently present
                  </p>
                </div>
              </div>
            ))}
            {attendanceReport.length === 0 && (
              <p className="text-gray-500 text-sm">No attendance data available</p>
            )}
          </div>
        </div>

        {/* Squad Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Squad Performance</h2>
            <Users2 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {squadPerformance.slice(0, 5).map((squad, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{squad.squad_name}</p>
                  <p className="text-xs text-gray-500">
                    {squad.member_count} members • {squad.total_attendance} attendance
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">
                    {squad.skills?.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            ))}
            {squadPerformance.length === 0 && (
              <p className="text-gray-500 text-sm">No squad data available</p>
            )}
          </div>
        </div>
      </div>

      {/* University Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">University Performance</h2>
          <Building className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Attendance/Candidate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {universityPerformance.map((uni, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{uni.university}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {uni.total_candidates}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {uni.total_attendance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {uni.avg_attendance_per_candidate ? uni.avg_attendance_per_candidate.toFixed(2) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {universityPerformance.length === 0 && (
          <div className="text-center py-8">
            <Building className="mx-auto h-8 w-8 text-gray-400" />
            <p className="text-gray-500 text-sm mt-2">No university data available</p>
          </div>
        )}
      </div>

      {/* Skills Distribution */}
      {comprehensiveReport?.skillsDistribution && comprehensiveReport.skillsDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Skills Distribution</h2>
            <Code className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comprehensiveReport.skillsDistribution.slice(0, 9).map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900">{skill.skills}</span>
                <span className="text-sm font-medium text-blue-600">{skill.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Generation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">Report Generated</p>
            <p className="text-xs text-blue-700">
              {comprehensiveReport?.generatedAt ? 
                new Date(comprehensiveReport.generatedAt).toLocaleString() : 
                'Report data available'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 