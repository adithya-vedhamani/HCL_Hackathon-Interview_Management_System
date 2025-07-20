import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  Filter,
  Eye,
  User,
  Building,
  X,
  Search,
  ChevronDown,
  ChevronUp
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setIsDropdownOpen(false);
  };

  const sortOptions = [
    { value: 'check_in_time', label: 'Check In Time', icon: '🕐' },
    { value: 'name', label: 'Name', icon: '👤' },
    { value: 'university', label: 'University', icon: '🏫' },
    { value: 'status', label: 'Status', icon: '📊' },
    { value: 'check_out_time', label: 'Check Out Time', icon: '🕕' },
    { value: 'email', label: 'Email', icon: '📧' }
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? `${option.icon} ${option.label}` : '🕐 Check In Time';
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="text-purple-100">Track participant attendance and check-ins</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_attendance || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Currently Present</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.currently_present || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Checked Out</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.checked_out || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Date Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 rounded-xl border border-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
                <label className="text-sm font-semibold text-gray-700">Date:</label>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium transition-all duration-300"
              />
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attendance..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
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
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-700">Sort by:</span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between px-6 py-3 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium transition-all duration-300 bg-white hover:border-purple-300 cursor-pointer shadow-sm min-w-[200px]"
                  >
                    <span>{getCurrentSortLabel()}</span>
                    {isDropdownOpen ? (
                      <ChevronUp className="h-5 w-5 text-purple-600 ml-2" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-purple-600 ml-2" />
                    )}
                  </button>
                  
                  {/* Custom Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSort(option.value)}
                          className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 ${
                            sortBy === option.value 
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-l-4 border-purple-500' 
                              : 'text-gray-700 hover:text-purple-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{option.icon}</span>
                            <span>{option.label}</span>
                            {sortBy === option.value && (
                              <div className="ml-auto">
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSort(sortBy)}
                  className="p-3 text-gray-400 hover:text-purple-600 transition-all duration-300 bg-gray-50 hover:bg-purple-50 rounded-xl border border-gray-200 hover:border-purple-200 shadow-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 rounded-xl border border-purple-100">
                <Filter className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {total} records for {new Date(selectedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>👤 Participant</span>
                    {sortBy === 'name' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('university')}
                >
                  <div className="flex items-center space-x-2">
                    <span>🏫 University</span>
                    {sortBy === 'university' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('check_in_time')}
                >
                  <div className="flex items-center space-x-2">
                    <span>🕐 Check In</span>
                    {sortBy === 'check_in_time' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>🕕 Check Out</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-2">
                    <span>📊 Status</span>
                    {sortBy === 'status' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-2">
                    <span>⚡ Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300">
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {record.photo_url ? (
                          <img
                            className="h-12 w-12 rounded-xl object-cover border-2 border-purple-100"
                            src={record.photo_url}
                            alt={record.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : record.selfie_path ? (
                          <img
                            className="h-12 w-12 rounded-xl object-cover border-2 border-purple-100"
                            src={`http://localhost:5001/uploads/${record.selfie_path}`}
                            alt={record.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center border-2 border-purple-200" style={{ display: record.photo_url || record.selfie_path ? 'none' : 'flex' }}>
                          <User className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {record.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {record.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{record.university}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleDateString() : ''}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleDateString() : ''}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)} border border-current`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-2 capitalize">{record.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewRecord(record)}
                      className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-xl transition-all duration-300"
                    >
                      <Eye className="h-5 w-5" />
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Page Info */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-gray-700">Rows per page:</span>
                  <select 
                    value={pageSize} 
                    onChange={handlePageSizeChange} 
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium transition-all duration-300"
                  >
                    {[5, 10, 20, 50].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm font-medium text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-xl border border-purple-100">
                  Showing {startItem} to {endItem} of {total} results
                </div>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handlePrevPage} 
                  disabled={page === 1} 
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-2">
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
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                          pageNum === page 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
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
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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