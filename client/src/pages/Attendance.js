import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Filter,
  Download,
  Eye,
  User,
  Building,
  Mail,
  X
} from 'lucide-react';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        attendanceAPI.getAll({ date: selectedDate }),
        attendanceAPI.getStats({ date: selectedDate })
      ]);
      setAttendance(attendanceRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const viewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'checked_out':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Track participant attendance and check-ins</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_attendance || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Currently Present</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.currently_present || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Checked Out</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.checked_out || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Date:</label>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {attendance.length} records for {new Date(selectedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {record.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={record.photo_url}
                            alt={record.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : record.selfie_path ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={`http://localhost:5001/uploads/${record.selfie_path}`}
                            alt={record.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: record.photo_url || record.selfie_path ? 'none' : 'flex' }}>
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{record.university}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleDateString() : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleDateString() : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1 capitalize">{record.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewRecord(record)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendance.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">
              No attendance records found for {new Date(selectedDate).toLocaleDateString()}.
            </p>
          </div>
        )}
      </div>

      {/* Attendance Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Attendance Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {selectedRecord.photo_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedRecord.photo_url}
                      alt={selectedRecord.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : selectedRecord.selfie_path ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={`http://localhost:5001/uploads/${selectedRecord.selfie_path}`}
                      alt={selectedRecord.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: selectedRecord.photo_url || selectedRecord.selfie_path ? 'none' : 'flex' }}>
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedRecord.name}</h4>
                    <p className="text-gray-600">{selectedRecord.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">University</label>
                    <p className="text-sm text-gray-900">{selectedRecord.university}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Degree</label>
                    <p className="text-sm text-gray-900">{selectedRecord.degree}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Skills</label>
                    <p className="text-sm text-gray-900">{selectedRecord.skills}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check In Time</label>
                    <p className="text-sm text-gray-900">
                      {selectedRecord.check_in_time ? new Date(selectedRecord.check_in_time).toLocaleString() : 'Not checked in'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check Out Time</label>
                    <p className="text-sm text-gray-900">
                      {selectedRecord.check_out_time ? new Date(selectedRecord.check_out_time).toLocaleString() : 'Not checked out'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                      {getStatusIcon(selectedRecord.status)}
                      <span className="ml-1 capitalize">{selectedRecord.status}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance; 