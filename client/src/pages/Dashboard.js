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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">HCLTech Dashboard</h1>
            <p className="text-purple-100 text-lg mt-2">Supercharging your hackathon management experience</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">from last week</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === 'attendance' ? (
                      <span>
                        <strong className="text-purple-600">{activity.candidate_name}</strong> checked in
                      </span>
                    ) : (
                      <span>
                        Squad <strong className="text-blue-600">{activity.squad_name}</strong> was created
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* University Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">University Distribution</h2>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {universityStats.map((uni, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-300 border border-transparent hover:border-green-200">
                <span className="text-sm font-medium text-gray-900 truncate flex-1">{uni.university}</span>
                <span className="text-sm font-semibold text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full border border-green-200">
                  {uni.count}
                </span>
              </div>
            ))}
            {universityStats.length === 0 && (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No university data available</p>
              </div>
            )}
          </div>
          {universityStats.length > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Scroll to see all {universityStats.length} universities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Distribution */}
      {stats?.skillsDistribution && stats.skillsDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Top Skills</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.skillsDistribution.slice(0, 6).map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-medium text-gray-900">{skill.skills}</span>
                <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                  {skill.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Trends */}
      {attendanceTrends.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Attendance Trends (Last 7 Days)</h2>
          </div>
          <div className="space-y-4">
            {attendanceTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-200">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                    {trend.attendance_count} present
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => handleQuickAction('candidates')}
            className="flex items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-300 group shadow-sm hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-gray-700 block">View Candidates</span>
              <span className="text-xs text-gray-500">Manage participants</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleQuickAction('squads')}
            className="flex items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300 group shadow-sm hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Users2 className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-gray-700 block">Manage Squads</span>
              <span className="text-xs text-gray-500">Create teams</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => handleQuickAction('reports')}
            className="flex items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300 transition-all duration-300 group shadow-sm hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-gray-700 block">Generate Reports</span>
              <span className="text-xs text-gray-500">View analytics</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 