import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

function ManagerTeam() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('team'); // 'team', 'cameras', 'locations'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
    fetchCameras();
    fetchLocations();
  }, []);

  useEffect(() => {
    filterTeamMembers();
  }, [teamMembers, searchTerm, filterStatus]);

  const fetchTeamMembers = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/manager/team/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Transform API data to match component format
          const members = result.data.team_members.map(member => ({
            id: member.id,
            employee_id: member.employee_id, // Keep original ID for updates
            name: member.name,
            email: member.email,
            phone: member.phone || 'N/A',
            designation: member.position || 'N/A',
            department: member.department || 'N/A',
            status: member.status,
            joinDate: member.hire_date ? new Date(member.hire_date).toLocaleDateString() : 'N/A',
            lastSeen: member.last_seen ? new Date(member.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            attendanceToday: member.attendance_status,
            avatar: member.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3b82f6&color=fff`,
            emergencyContact: member.emergency_contact
          }));

          setTeamMembers(members);
        }
      } else {
        // Use empty array if no API data available
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCameras = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setCameras([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/manager/cameras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setCameras(result.data.cameras || []);
        }
      } else {
        setCameras([]);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
      setCameras([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setLocations([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/manager/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setLocations(result.data.locations || []);
        }
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const filterTeamMembers = () => {
    let filtered = teamMembers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    setFilteredMembers(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'on_leave':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAttendanceStatus = (attendance) => {
    switch (attendance) {
      case 'present':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Present
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Absent
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            On Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members, cameras, and locations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-teal-50/95 rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Users className="inline-block w-5 h-5 mr-2" />
                Team Members ({teamMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('cameras')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cameras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📹 Cameras ({cameras.length})
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <MapPin className="inline-block w-5 h-5 mr-2" />
                Locations ({locations.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Team Tab */}
            {activeTab === 'team' && (
              <>
                {/* Search and Filters for Team */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="sm:w-48">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
                    <div className="text-sm text-blue-600">Total Members</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {teamMembers.filter(m => m.attendanceToday === 'present').length}
                    </div>
                    <div className="text-sm text-green-600">Present Today</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {teamMembers.filter(m => m.status === 'on_leave').length}
                    </div>
                    <div className="text-sm text-yellow-600">On Leave</div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">
                      {teamMembers.filter(m => m.status === 'active').length}
                    </div>
                    <div className="text-sm text-teal-600">Active</div>
                  </div>
                </div>
              </>
            )}

            {/* Cameras Tab */}
            {activeTab === 'cameras' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Camera Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cameras.length > 0 ? cameras.map((camera) => (
                      <div key={camera.id} className="bg-teal-50/95 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{camera.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camera.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {camera.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <MapPin className="inline-block w-4 h-4 mr-1" />
                          {camera.location}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Type: {camera.camera_type}
                        </p>
                        {camera.ip_address && (
                          <p className="text-sm text-gray-500 mt-1">
                            IP: {camera.ip_address}
                          </p>
                        )}
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No cameras found for your organization.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Location Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.length > 0 ? locations.map((location) => (
                      <div key={location.id} className="bg-teal-50/95 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{location.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${location.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {location.status}
                          </span>
                        </div>
                        {location.description && (
                          <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>📹 {location.camera_count} cameras</span>
                          {location.floor_number && (
                            <span>Floor: {location.floor_number}</span>
                          )}
                        </div>
                        {location.building && (
                          <p className="text-sm text-gray-500 mt-1">
                            Building: {location.building}
                          </p>
                        )}
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No locations found for your organization.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team Members Grid - Only show when team tab is active */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.length > 0 ? filteredMembers.map((member) => (
              <div key={member.id} className="bg-teal-50/95 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {member.avatar.startsWith('http') ? (
                          <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                        ) : (
                          <span className="text-xl font-semibold text-blue-600">
                            {member.name.charAt(0)}
                          </span>
                        )}

                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.designation}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(member.status)}
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {member.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {member.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      Joined: {member.joinDate}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      Last Seen: {member.lastSeen || 'N/A'}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Today:</span>
                      {getAttendanceStatus(member.attendanceToday)}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No team members available.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit/View Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Employee Details
                    </h3>
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 gap-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMember.name}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Designation</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMember.designation}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Department</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMember.department}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Contact Info</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMember.email}</p>
                          <p className="text-sm text-gray-900">{selectedMember.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Emergency Contact</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedMember.emergencyContact}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <div className="mt-1 flex items-center">
                            {getStatusIcon(selectedMember.status)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">{selectedMember.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerTeam;
