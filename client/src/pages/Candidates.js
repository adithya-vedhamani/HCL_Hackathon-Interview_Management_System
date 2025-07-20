import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { candidatesAPI } from '../services/api';
import { 
  Users, 
  Upload, 
  Search, 
  Filter,
  Eye,
  Trash2,
  User,
  X,
  QrCode,
  Trash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Candidates = () => {
  const [allCandidates, setAllCandidates] = useState([]); // All candidates for client-side search
  const [candidates, setCandidates] = useState([]); // Filtered candidates to display
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, email, university, degree
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load all candidates once for client-side search
  useEffect(() => {
    loadAllCandidates();
  }, []);

  // Client-side search and pagination
  useEffect(() => {
    filterAndPaginateCandidates();
  }, [allCandidates, searchTerm, page, pageSize, sortBy, sortOrder]);

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

  const loadAllCandidates = async () => {
    setIsLoading(true);
    try {
      // Load all candidates without pagination for client-side search
      const response = await candidatesAPI.getAll({ limit: 1000 }); // Get all candidates
      console.log('All candidates loaded:', response.data);
      setAllCandidates(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndPaginateCandidates = () => {
    // Client-side search filtering
    let filtered = allCandidates;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allCandidates.filter(candidate => 
        candidate.name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        candidate.university?.toLowerCase().includes(term) ||
        candidate.degree?.toLowerCase().includes(term) ||
        candidate.skills?.toLowerCase().includes(term)
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
    
    setCandidates(paginated);
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Please select an Excel file (.xlsx or .xls) or CSV file (.csv)');
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const response = await candidatesAPI.importExcel(selectedFile);
      console.log('Import response:', response.data);
      
      if (response.data.importedCount > 0) {
        toast.success(`Successfully imported ${response.data.importedCount} candidates!`);
      } else {
        toast.success('File processed successfully. No new candidates were imported (they may already exist).');
      }
      
      setSelectedFile(null);
      setPage(1); // Reset to first page to see newly imported candidates
      // Force reload after a short delay to ensure backend has processed the import
      setTimeout(() => {
        loadAllCandidates(); // Reload all candidates to include newly imported ones
      }, 500);
    } catch (error) {
      console.error('Error importing candidates:', error);
      toast.error(error.response?.data?.error || 'Failed to import candidates');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) {
      return;
    }

    try {
      await candidatesAPI.delete(id);
      toast.success('Candidate deleted successfully');
      loadAllCandidates(); // Reload all candidates to update the list
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Failed to delete candidate');
    }
  };

  const viewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const viewQRCode = async (candidate) => {
    try {
      const response = await candidatesAPI.getQRImage(candidate.id);
      setQrCodeData(response.data.qrCode);
      setQrCodeImage(response.data.qrCodeImage);
      setSelectedCandidate(candidate);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error('QR code not found. Generating new one...');
      await generateQRCode(candidate);
    }
  };

  const generateQRCode = async (candidate) => {
    setIsGeneratingQR(true);
    try {
      const response = await candidatesAPI.generateQRCode(candidate.id);
      setQrCodeData(response.data.qrCode);
      setSelectedCandidate(candidate);
      setShowQRModal(true);
      
      // Get QR code image
      try {
        const imageResponse = await candidatesAPI.getQRImage(candidate.id);
        setQrCodeImage(imageResponse.data.qrCodeImage);
      } catch (imageError) {
        console.error('Error fetching QR image:', imageError);
      }
      
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL data including:\n\n' +
      '• All candidates\n' +
      '• All attendance records\n' +
      '• All squads\n' +
      '• All QR codes\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    );

    if (!confirmed) return;

    try {
      await candidatesAPI.clearAll();
      toast.success('All data cleared successfully');
      setAllCandidates([]); // Clear all candidates
      setTotal(0);
      setPage(1);
      setPageSize(10);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  };

  // Pagination controls
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const handleSearchClear = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
    { value: 'name', label: 'Name', icon: '👤' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'university', label: 'University', icon: '🏫' },
    { value: 'degree', label: 'Degree', icon: '🎓' },
    { value: 'skills', label: 'Skills', icon: '💻' },
    { value: 'created_at', label: 'Date Added', icon: '📅' }
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? `${option.icon} ${option.label}` : '👤 Name';
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageChange = (newPage) => setPage(newPage);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Candidates</h1>
              <p className="text-purple-100">Manage hackathon participants</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <label className="cursor-pointer bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg">
              <Upload className="h-4 w-4 inline mr-2" />
              Import Data
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClearAllData}
              className="bg-red-500/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-300/30 shadow-lg flex items-center"
              title="Clear all data (candidates, attendance, squads)"
            >
              <Trash className="h-4 w-4 mr-2" />
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {selectedFile && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 shadow-lg"
              >
                {isUploading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
                />
                {searchTerm && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
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
                    className="flex items-center justify-between px-6 py-3 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium transition-all duration-300 bg-white hover:border-purple-300 cursor-pointer shadow-sm min-w-[180px]"
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
                  {total} candidates
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4 cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>👤 Candidate</span>
                    {sortBy === 'name' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/6 cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('university')}
                >
                  <div className="flex items-center space-x-2">
                    <span>🏫 University</span>
                    {sortBy === 'university' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                  <div className="flex items-center space-x-2">
                    <span>💻 Skills</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4 cursor-pointer hover:bg-purple-100 transition-all duration-300"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <span>📧 Contact</span>
                    {sortBy === 'email' && (
                      <span className="text-purple-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24 sticky right-0 bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="flex items-center justify-end space-x-2">
                    <span>⚡ Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {candidates && candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 group transition-all duration-300">
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {candidate.photo_url ? (
                          <img
                            className="h-12 w-12 rounded-xl object-cover border-2 border-purple-100"
                            src={candidate.photo_url}
                            alt={candidate.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : candidate.selfie_path ? (
                          <img
                            className="h-12 w-12 rounded-xl object-cover border-2 border-purple-100"
                            src={`http://localhost:5001/uploads/${candidate.selfie_path}`}
                            alt={candidate.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center border-2 border-purple-200" style={{ display: candidate.photo_url || candidate.selfie_path ? 'none' : 'flex' }}>
                          <User className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {candidate.degree} • {candidate.batch}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{candidate.university}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-medium text-gray-900">
                      {candidate.skills}
                    </span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-900">
                        <span className="truncate font-medium">{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="text-sm text-gray-600">
                          <span className="truncate">{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-gradient-to-r group-hover:from-purple-50 group-hover:to-blue-50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => viewCandidate(candidate)}
                        className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-xl transition-all duration-300"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => viewQRCode(candidate)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-xl transition-all duration-300"
                        title="View QR Code"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-300"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!candidates || candidates.length === 0) && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by importing candidates from Excel or CSV.'}
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

      {/* Candidate Detail Modal */}
      {showModal && selectedCandidate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Candidate Details</h3>
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
                  {selectedCandidate.photo_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedCandidate.photo_url}
                      alt={selectedCandidate.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : selectedCandidate.selfie_path ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={`http://localhost:5001/uploads/${selectedCandidate.selfie_path}`}
                      alt={selectedCandidate.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: selectedCandidate.photo_url || selectedCandidate.selfie_path ? 'none' : 'flex' }}>
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h4>
                    <p className="text-gray-600">{selectedCandidate.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">University</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.university}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Degree & Batch</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.degree} • {selectedCandidate.batch}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Skills</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.skills}</p>
                  </div>
                  {selectedCandidate.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{selectedCandidate.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedCandidate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedCandidate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedCandidate.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{selectedCandidate.email}</p>
                  
                  {isGeneratingQR ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="spinner h-8 w-8"></div>
                      <span className="ml-2 text-sm text-gray-600">Generating QR Code...</span>
                    </div>
                  ) : qrCodeData ? (
                    <div className="space-y-4">

                      
                      {/* QR Code Image */}
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-center">
                          {qrCodeImage ? (
                            <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
                              <img 
                                src={qrCodeImage} 
                                alt="QR Code" 
                                className="w-48 h-48 mx-auto"
                              />
                            </div>
                          ) : (
                            <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
                              <div className="text-xs font-mono text-gray-600 break-all">
                                {qrCodeData}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* QR Code Text */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Manual Entry Code:</p>
                        <div className="text-xs font-mono text-blue-800 break-all bg-white p-2 rounded border">
                          {qrCodeData}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">
                          Scan this QR code to mark attendance
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600">No QR code available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates; 