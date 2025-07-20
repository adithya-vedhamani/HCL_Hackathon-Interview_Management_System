import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { squadsAPI } from '../services/api';
import { 
  Users2, 
  Plus, 
  Brain, 
  Settings, 
  Trash2,
  User,
  Code,
  Building,
  Mail,
  Phone,
  Eye,
  Edit,
  X,
  Check
} from 'lucide-react';

const Squads = () => {
  const [squads, setSquads] = useState([]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [squadsRes, candidatesRes] = await Promise.all([
        squadsAPI.getAll(),
        squadsAPI.getAvailableCandidates()
      ]);
      setSquads(squadsRes.data);
      setAvailableCandidates(candidatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartCreation = async () => {
    try {
      const response = await squadsAPI.createWithAI(aiSettings);
      toast.success(`Successfully created ${response.data.squads.length} squads`);
      setShowAIModal(false);
      loadData();
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
      loadData();
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
      loadData();
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
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squads</h1>
          <p className="text-gray-600">Manage hackathon teams</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Brain className="h-4 w-4 mr-2" />
            Smart Formation
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Squad
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users2 className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Squads</p>
              <p className="text-2xl font-bold text-gray-900">{squads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{availableCandidates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Formation</p>
              <p className="text-2xl font-bold text-gray-900">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Squads List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Squads</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {squads.map((squad) => (
            <div key={squad.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{squad.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {squad.member_count || 0} members
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Members: {squad.member_names?.join(', ') || 'No members'}
                    </p>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(squad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewSquad(squad)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(squad.id)}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {squads.length === 0 && (
            <div className="text-center py-12">
              <Users2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No squads yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first squad using AI or manual formation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Formation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Smart Squad Formation</h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Squad Size
                  </label>
                  <select
                    value={aiSettings.squadSize}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, squadSize: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 members</option>
                    <option value={4}>4 members</option>
                    <option value={5}>5 members</option>
                    <option value={6}>6 members</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formation Type
                  </label>
                  <select
                    value={aiSettings.formationType}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, formationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="diverse">Diverse Skills</option>
                    <option value="similar">Similar Skills</option>
                  </select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      Smart algorithm will create {Math.ceil(availableCandidates.length / aiSettings.squadSize)} squads with {aiSettings.formationType} skills.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSmartCreation}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                >
                  Create Squads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Squad Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Manual Squad</h3>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Squad Name
                  </label>
                  <input
                    type="text"
                    value={manualSquad.name}
                    onChange={(e) => setManualSquad(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter squad name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Members ({manualSquad.memberIds.length} selected)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {availableCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={() => toggleMemberSelection(candidate.id)}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                          manualSquad.memberIds.includes(candidate.id) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-8 w-8">
                              {candidate.photo_url ? (
                                <img
                                  className="h-8 w-8 rounded-full object-cover"
                                  src={candidate.photo_url}
                                  alt={candidate.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : candidate.selfie_path ? (
                                <img
                                  className="h-8 w-8 rounded-full object-cover"
                                  src={`http://localhost:5001/uploads/${candidate.selfie_path}`}
                                  alt={candidate.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: candidate.photo_url || candidate.selfie_path ? 'none' : 'flex' }}>
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                              <p className="text-xs text-gray-500">{candidate.university} • {candidate.degree}</p>
                              <p className="text-xs text-gray-500">{candidate.skills}</p>
                            </div>
                          </div>
                          {manualSquad.memberIds.includes(candidate.id) && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualCreation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Create Squad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Squad Detail Modal */}
      {showSquadModal && selectedSquad && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedSquad.name}</h3>
                <button
                  onClick={() => setShowSquadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSquad.members?.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-12 w-12">
                          {member.photo_url ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={member.photo_url}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : member.selfie_path ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={`http://localhost:5001/uploads/${member.selfie_path}`}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center" style={{ display: member.photo_url || member.selfie_path ? 'none' : 'flex' }}>
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                          <p className="text-xs text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-500">{member.university}</p>
                          <p className="text-xs text-gray-500">{member.degree}</p>
                          <p className="text-xs text-gray-500">{member.skills}</p>
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