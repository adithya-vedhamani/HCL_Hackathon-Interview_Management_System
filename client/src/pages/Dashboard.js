import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../services/api';
import { 
  Users, 
  Calendar, 
  Users2, 
  TrendingUp, 
  Activity,
  Building,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [universityStats, setUniversityStats] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes, universityRes, trendsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getRecentActivity(),
        adminAPI.getUniversityStats(),
        adminAPI.getAttendanceTrends({ days: 7 })
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setUniversityStats(universityRes.data);
      setAttendanceTrends(trendsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'candidates':
        navigate('/candidates');
        break;
      case 'squads':
        navigate('/squads');
        break;
      case 'reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Candidates',
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: Calendar,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Total Squads',
      value: stats?.totalSquads || 0,
      icon: Users2,
      color: 'bg-gradient-to-r from-purple-600 to-blue-600',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Attendance Rate',
      value: stats?.totalCandidates > 0 
        ? `${Math.round((stats.presentToday / stats.totalCandidates) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          HCLTech Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Supercharging your hackathon management experience</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.type === 'attendance' ? (
                      <span>
                        <strong>{activity.candidate_name}</strong> checked in
                      </span>
                    ) : (
                      <span>
                        Squad <strong>{activity.squad_name}</strong> was created
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* University Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">University Distribution</h2>
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {universityStats.map((uni, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-sm text-gray-900 truncate flex-1">{uni.university}</span>
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {uni.count}
                </span>
              </div>
            ))}
            {universityStats.length === 0 && (
              <p className="text-gray-500 text-sm">No university data available</p>
            )}
          </div>
          {universityStats.length > 5 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Scroll to see all {universityStats.length} universities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Distribution */}
      {stats?.skillsDistribution && stats.skillsDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.skillsDistribution.slice(0, 6).map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900">{skill.skills}</span>
                <span className="text-sm font-medium text-blue-600">{skill.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Trends */}
      {attendanceTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends (Last 7 Days)</h2>
          <div className="space-y-3">
            {attendanceTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {trend.attendance_count} present
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('candidates')}
            className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-200 group"
          >
            <Users className="h-5 w-5 text-purple-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">View Candidates</span>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleQuickAction('squads')}
            className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-200 group"
          >
            <Users2 className="h-5 w-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Manage Squads</span>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleQuickAction('reports')}
            className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-200 group"
          >
            <TrendingUp className="h-5 w-5 text-green-600 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Generate Reports</span>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 