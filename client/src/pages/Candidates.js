import React, { useState, useEffect } from 'react';
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
  Mail,
  Phone,
  Building,
  Code,
  X,
  QrCode,
  Trash
} from 'lucide-react';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm]);

  const loadCandidates = async () => {
    try {
      const response = await candidatesAPI.getAll();
      setCandidates(response.data);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCandidates = () => {
    const filtered = candidates.filter(candidate =>
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.degree?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
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
      loadCandidates();
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
      loadCandidates();
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
      setCandidates([]);
      setFilteredCandidates([]);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600">Manage hackathon participants</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="h-4 w-4 inline mr-2" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleClearAllData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            title="Clear all data (candidates, attendance, squads)"
          >
            <Trash className="h-4 w-4 mr-2" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                <p className="text-xs text-blue-700">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredCandidates.length} of {candidates.length} candidates
            </span>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  University
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Contact
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {candidate.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={candidate.photo_url}
                            alt={candidate.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : candidate.selfie_path ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={`http://localhost:5001/uploads/${candidate.selfie_path}`}
                            alt={candidate.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: candidate.photo_url || candidate.selfie_path ? 'none' : 'flex' }}>
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.degree} • {candidate.batch}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 truncate">{candidate.university}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 truncate">
                        {candidate.skills}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="truncate">{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] transition-colors">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => viewCandidate(candidate)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => viewQRCode(candidate)}
                        className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by importing candidates from Excel or CSV.'}
            </p>
          </div>
        )}
      </div>

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