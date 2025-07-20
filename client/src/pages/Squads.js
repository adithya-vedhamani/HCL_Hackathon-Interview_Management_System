import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { squadsAPI } from '../services/api';
import { 
  Users2, 
  Plus, 
  Brain, 
  Trash2,
  User,
  Code,
  Building,
  Eye,
  X,
  Check,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Squads = () => {
  const [allSquads, setAllSquads] = useState([]); // All squads for client-side filtering
  const [squads, setSquads] = useState([]); // Paginated squads to display
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // AI Formation settings
  const [aiSettings, setAiSettings] = useState({
    squadSize: 4,
    formationType: 'diverse'
  });
  
  // Manual formation
  const [manualSquad, setManualSquad] = useState({
    name: '',
    memberIds: []
  });

  // Dropdown states for modals
  const [aiSquadSizeDropdownOpen, setAiSquadSizeDropdownOpen] = useState(false);
  const [aiFormationTypeDropdownOpen, setAiFormationTypeDropdownOpen] = useState(false);
  const aiSquadSizeDropdownRef = useRef(null);
  const aiFormationTypeDropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Client-side search, sort, and pagination
  useEffect(() => {
    filterAndPaginateSquads();
  }, [allSquads, searchTerm, page, pageSize, sortBy, sortOrder]);

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
      if (aiSquadSizeDropdownRef.current && !aiSquadSizeDropdownRef.current.contains(event.target)) {
        setAiSquadSizeDropdownOpen(false);
      }
      if (aiFormationTypeDropdownRef.current && !aiFormationTypeDropdownRef.current.contains(event.target)) {
        setAiFormationTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    try {
      const [squadsRes, candidatesRes] = await Promise.all([
        squadsAPI.getAll({ limit: 1000 }), // Get all squads for client-side filtering
        squadsAPI.getAvailableCandidates()
      ]);
      
      // Handle paginated response structure
      const squadsData = squadsRes.data.data || squadsRes.data || [];
      setAllSquads(squadsData);
      setTotal(squadsRes.data.total || squadsData.length);
      setAvailableCandidates(candidatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndPaginateSquads = () => {
    // Client-side search filtering
    let filtered = allSquads;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allSquads.filter(squad => 
        squad.name?.toLowerCase().includes(term) ||
        squad.id?.toString().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'name') {
        // Special handling for squad names with numbers
        const aMatch = aValue.match(/^Squad\s*(\d+)$/i);
        const bMatch = bValue.match(/^Squad\s*(\d+)$/i);
        
        if (aMatch && bMatch) {
          // Both are "Squad X" format - sort by number
          const aNum = parseInt(aMatch[1]);
          const bNum = parseInt(bMatch[1]);
          return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        } else if (aMatch) {
          // Only a is "Squad X" format - put it first
          return sortOrder === 'asc' ? -1 : 1;
        } else if (bMatch) {
          // Only b is "Squad X" format - put it first
          return sortOrder === 'asc' ? 1 : -1;
        }
      }
      
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
    
    setSquads(paginated);
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
    { value: 'created_at', label: 'Date Created', icon: '📅' },
    { value: 'name', label: 'Squad Name', icon: '👥' },
    { value: 'member_count', label: 'Member Count', icon: '👤' },
    { value: 'id', label: 'Squad ID', icon: '🆔' }
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? `${option.icon} ${option.label}` : '📅 Date Created';
  };

  // AI Modal dropdown options
  const squadSizeOptions = [
    { value: 3, label: '3 members', icon: '👥' },
    { value: 4, label: '4 members', icon: '👥' },
    { value: 5, label: '5 members', icon: '👥' },
    { value: 6, label: '6 members', icon: '👥' }
  ];

  const formationTypeOptions = [
    { value: 'diverse', label: 'Diverse Skills', icon: '🎯' },
    { value: 'similar', label: 'Similar Skills', icon: '🎯' }
  ];

  const getCurrentSquadSizeLabel = () => {
    const option = squadSizeOptions.find(opt => opt.value === aiSettings.squadSize);
    return option ? `${option.icon} ${option.label}` : '👥 4 members';
  };

  const getCurrentFormationTypeLabel = () => {
    const option = formationTypeOptions.find(opt => opt.value === aiSettings.formationType);
    return option ? `${option.icon} ${option.label}` : '🎯 Diverse Skills';
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

  const handleSmartCreation = async () => {
    try {
      const response = await squadsAPI.createWithAI(aiSettings);
      toast.success(`Successfully created ${response.data.squads.length} squads`);
      setShowAIModal(false);
      loadData(); // Reload all data to include newly created squads
    } catch (error) {
      console.error('Error creating squads with smart algorithm:', error);
      toast.error(error.response?.data?.error || 'Failed to create squads');
    }
  };

  const handleManualCreation = async () => {
    if (!manualSquad.name || manualSquad.memberIds.length === 0) {
      toast.error('Please provide squad name and select members');
      return;
    }

    try {
      await squadsAPI.create(manualSquad);
      toast.success('Squad created successfully');
      setShowManualModal(false);
      setManualSquad({ name: '', memberIds: [] });
      loadData(); // Reload all data to include newly created squad
    } catch (error) {
      console.error('Error creating squad:', error);
      toast.error('Failed to create squad');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this squad?')) {
      return;
    }

    try {
      await squadsAPI.delete(id);
      toast.success('Squad deleted successfully');
      loadData(); // Reload all data to update the list
    } catch (error) {
      console.error('Error deleting squad:', error);
      toast.error('Failed to delete squad');
    }
  };

  const viewSquad = async (squad) => {
    try {
      const response = await squadsAPI.getById(squad.id);
      setSelectedSquad(response.data);
      setShowSquadModal(true);
    } catch (error) {
      console.error('Error loading squad details:', error);
      toast.error('Failed to load squad details');
    }
  };

  const toggleMemberSelection = (candidateId) => {
    setManualSquad(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(candidateId)
        ? prev.memberIds.filter(id => id !== candidateId)
        : [...prev.memberIds, candidateId]
    }));
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Users2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Squads</h1>
              <p className="text-purple-100">Manage hackathon teams</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg flex items-center"
            >
              <Brain className="h-4 w-4 mr-2" />
              Smart Squad Formation
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manual Squad Formation
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Users2 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Squads</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Available Candidates</p>
              <p className="text-3xl font-bold text-gray-900">{availableCandidates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">AI Formation</p>
              <p className="text-3xl font-bold text-gray-900">Ready</p>
            </div>
          </div>
        </div>
      </div>

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
                  placeholder="Search by squad name..."
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
                <Users2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {total} squads
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Squads List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-lg font-semibold text-gray-900">All Squads</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {squads.map((squad) => (
            <div key={squad.id} className="p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Users2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{squad.name}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200">
                        {squad.member_count || 0} members
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 ml-14">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Members:</span> {squad.member_names?.join(', ') || 'No members'}
                    </p>
                  </div>
                  <div className="mt-2 ml-14">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(squad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => viewSquad(squad)}
                    className="p-3 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-xl transition-all duration-300"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(squad.id)}
                    className="p-3 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-300"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {squads.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users2 className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No squads yet</h3>
              <p className="text-gray-600">
                Create your first squad using AI or manual formation.
              </p>
            </div>
          )}
        </div>
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

      {/* AI Formation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border-0 w-full max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Smart Squad Formation</h3>
                    <p className="text-sm text-gray-600">AI-powered team creation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🎯 Squad Size
                  </label>
                  <div className="relative" ref={aiSquadSizeDropdownRef}>
                    <button
                      onClick={() => setAiSquadSizeDropdownOpen(!aiSquadSizeDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg bg-white hover:border-purple-300 cursor-pointer shadow-sm"
                    >
                      <span>{getCurrentSquadSizeLabel()}</span>
                      {aiSquadSizeDropdownOpen ? (
                        <ChevronUp className="h-5 w-5 text-purple-600 ml-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-purple-600 ml-2" />
                      )}
                    </button>
                    
                    {/* Custom Dropdown Menu */}
                    {aiSquadSizeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {squadSizeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setAiSettings(prev => ({ ...prev, squadSize: option.value }));
                              setAiSquadSizeDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 ${
                              aiSettings.squadSize === option.value 
                                ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-l-4 border-purple-500' 
                                : 'text-gray-700 hover:text-purple-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{option.icon}</span>
                              <span>{option.label}</span>
                              {aiSettings.squadSize === option.value && (
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
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🧠 Formation Type
                  </label>
                  <div className="relative" ref={aiFormationTypeDropdownRef}>
                    <button
                      onClick={() => setAiFormationTypeDropdownOpen(!aiFormationTypeDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg bg-white hover:border-purple-300 cursor-pointer shadow-sm"
                    >
                      <span>{getCurrentFormationTypeLabel()}</span>
                      {aiFormationTypeDropdownOpen ? (
                        <ChevronUp className="h-5 w-5 text-purple-600 ml-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-purple-600 ml-2" />
                      )}
                    </button>
                    
                    {/* Custom Dropdown Menu */}
                    {aiFormationTypeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {formationTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setAiSettings(prev => ({ ...prev, formationType: option.value }));
                              setAiFormationTypeDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 ${
                              aiSettings.formationType === option.value 
                                ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-l-4 border-purple-500' 
                                : 'text-gray-700 hover:text-purple-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{option.icon}</span>
                              <span>{option.label}</span>
                              {aiSettings.formationType === option.value && (
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
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-3">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">
                        Smart algorithm will create <span className="text-purple-600 font-bold">{Math.ceil(availableCandidates.length / aiSettings.squadSize)}</span> squads
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        with {aiSettings.formationType} skills distribution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSmartCreation}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
                >
                  🚀 Create Squads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Squad Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-8 border-0 w-full max-w-3xl shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Create Manual Squad</h3>
                    <p className="text-sm text-gray-600">Hand-pick your dream team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🏷️ Squad Name
                  </label>
                  <input
                    type="text"
                    value={manualSquad.name}
                    onChange={(e) => setManualSquad(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg"
                    placeholder="Enter squad name"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      👥 Select Members
                    </label>
                    <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {manualSquad.memberIds.length} selected
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50">
                    {availableCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={() => toggleMemberSelection(candidate.id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-sm ${
                          manualSquad.memberIds.includes(candidate.id) 
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500' 
                            : 'hover:border-l-4 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 h-12 w-12">
                              {candidate.photo_url ? (
                                <img
                                  className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm"
                                  src={candidate.photo_url}
                                  alt={candidate.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : candidate.selfie_path ? (
                                <img
                                  className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm"
                                  src={`http://localhost:5001/uploads/${candidate.selfie_path}`}
                                  alt={candidate.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-sm" style={{ display: candidate.photo_url || candidate.selfie_path ? 'none' : 'flex' }}>
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-gray-900">{candidate.name}</p>
                              <p className="text-sm text-gray-600">{candidate.university} • {candidate.degree}</p>
                              <p className="text-sm text-purple-600 font-medium">{candidate.skills}</p>
                            </div>
                          </div>
                          {manualSquad.memberIds.includes(candidate.id) && (
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualCreation}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  ✨ Create Squad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Squad Detail Modal */}
      {showSquadModal && selectedSquad && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border-0 w-full max-w-4xl shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedSquad.name}</h3>
                    <p className="text-sm text-gray-600">{selectedSquad.members?.length || 0} team members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSquadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedSquad.members?.map((member) => (
                    <div key={member.id} className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16">
                          {member.photo_url ? (
                            <img
                              className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg"
                              src={member.photo_url}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : member.selfie_path ? (
                            <img
                              className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg"
                              src={`http://localhost:5001/uploads/${member.selfie_path}`}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-lg" style={{ display: member.photo_url || member.selfie_path ? 'none' : 'flex' }}>
                            <User className="h-8 w-8 text-gray-500" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h4>
                          <p className="text-sm text-purple-600 font-medium mb-2">{member.email}</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center">
                              <Building className="h-4 w-4 mr-2 text-gray-400" />
                              {member.university}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Code className="h-4 w-4 mr-2 text-gray-400" />
                              {member.degree}
                            </p>
                            <p className="text-sm text-purple-600 font-medium flex items-center">
                              <Brain className="h-4 w-4 mr-2 text-purple-500" />
                              {member.skills}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Squads; 