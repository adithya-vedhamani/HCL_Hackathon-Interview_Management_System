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
  X,
  Search
} from 'lucide-react';

const Attendance = () => {
  const [allAttendance, setAllAttendance] = useState([]); // All attendance records
  const [attendance, setAttendance] = useState([]); // Paginated attendance to display
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('check_in_time');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  // Client-side search, sort, and pagination
  useEffect(() => {
    filterAndPaginateAttendance();
  }, [allAttendance, searchTerm, page, pageSize, sortBy, sortOrder]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const loadAttendanceData = async () => {
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        attendanceAPI.getAll({ date: selectedDate, limit: 1000 }), // Get all records for client-side filtering
        attendanceAPI.getStats({ date: selectedDate })
      ]);
      
      // Handle paginated response structure
      const attendanceData = attendanceRes.data.data || attendanceRes.data || [];
      setAllAttendance(attendanceData);
      setTotal(attendanceRes.data.total || attendanceData.length);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndPaginateAttendance = () => {
    // Client-side search filtering
    let filtered = allAttendance;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allAttendance.filter(record => 
        record.name?.toLowerCase().includes(term) ||
        record.email?.toLowerCase().includes(term) ||
        record.university?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // Update total for pagination
    setTotal(filtered.length);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setAttendance(paginated);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageChange = (newPage) => setPage(newPage);

  // Pagination controls
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

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

      {/* Date Filter and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Date Filter */}
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
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attendance..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="check_in_time">Check In Time</option>
                  <option value="name">Name</option>
                  <option value="university">University</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => handleSort(sortBy)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {total} records for {new Date(selectedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Participant</span>
                    {sortBy === 'name' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('university')}
                >
                  <div className="flex items-center space-x-1">
                    <span>University</span>
                    {sortBy === 'university' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('check_in_time')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Check In</span>
                    {sortBy === 'check_in_time' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
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

      {/* Modern Pagination Controls */}
      {!isLoading && total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Page Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <select 
                    value={pageSize} 
                    onChange={handlePageSizeChange} 
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {[5, 10, 20, 50].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {startItem} to {endItem} of {total} results
                </div>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrevPage} 
                  disabled={page === 1} 
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          pageNum === page 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={handleNextPage} 
                  disabled={page === totalPages} 
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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