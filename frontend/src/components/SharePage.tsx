import { useLocation } from "react-router-dom";

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Mail,
  Link,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  QrCode,
  Globe,
  Lock,
  Clock,
  Trash2,
  Edit3,
  Plus,
  ArrowLeft,
  Settings,
  UserPlus,
  FileText,
  BarChart3
} from 'lucide-react';

import TopNav from "./TopNav";


interface SharedLink {
  id: string;
  name: string;
  url: string;
  accessLevel: 'view' | 'edit' | 'admin';
  expiresAt?: string;
  createdAt: string;
  views: number;
  isActive: boolean;
  password?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  avatar?: string;
  lastAccess?: string;
  status: 'active' | 'pending' | 'inactive';
}
interface SharePageProps {
  onLogout: () => void;
}
const SharePage: React.FC<SharePageProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'links' | 'team' | 'public'>('links');
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Form states
  const [linkName, setLinkName] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'admin'>('view');
  const [expirationDate, setExpirationDate] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const location = useLocation();

  const {
    jobType,
    fileName,
    fileId,
    user,
    isAuthenticated,
    pageTitle,
    subTitle,
    page,
    onBack,
  } = location.state;
  console.log("onBack= > ", onBack)
  // Mock data
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([
    {
      id: '1',
      name: 'Client Review Link',
      url: 'https://datamind.app/share/abc123def456',
      accessLevel: 'view',
      expiresAt: '2024-02-15T23:59:59Z',
      createdAt: '2024-01-15T10:30:00Z',
      views: 24,
      isActive: true,
      password: true
    },
    {
      id: '2',
      name: 'Team Collaboration',
      url: 'https://datamind.app/share/xyz789uvw012',
      accessLevel: 'edit',
      createdAt: '2024-01-10T14:20:00Z',
      views: 156,
      isActive: true,
      password: false
    },
    {
      id: '3',
      name: 'Public Demo',
      url: 'https://datamind.app/share/demo345pub678',
      accessLevel: 'view',
      expiresAt: '2024-01-20T23:59:59Z',
      createdAt: '2024-01-05T09:15:00Z',
      views: 892,
      isActive: false,
      password: false
    }
  ]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'admin',
      lastAccess: '2024-01-15T16:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      role: 'editor',
      lastAccess: '2024-01-15T14:20:00Z',
      status: 'active'
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily@company.com',
      role: 'viewer',
      status: 'pending'
    }
  ]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createShareLink = () => {
    const newLink: SharedLink = {
      id: Date.now().toString(),
      name: linkName || 'Untitled Link',
      url: `https://datamind.app/share/${Math.random().toString(36).substr(2, 12)}`,
      accessLevel,
      expiresAt: expirationDate ? new Date(expirationDate).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      views: 0,
      isActive: true,
      password: requirePassword
    };

    setSharedLinks(prev => [newLink, ...prev]);
    setShowCreateLink(false);
    setLinkName('');
    setExpirationDate('');
    setRequirePassword(false);
    setPassword('');
  };

  const inviteTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending'
    };

    setTeamMembers(prev => [newMember, ...prev]);
    setShowInviteUser(false);
    setInviteEmail('');
    setInviteRole('viewer');
  };

  const toggleLinkStatus = (id: string) => {
    setSharedLinks(prev => prev.map(link =>
      link.id === id ? { ...link, isActive: !link.isActive } : link
    ));
  };

  const deleteLink = (id: string) => {
    setSharedLinks(prev => prev.filter(link => link.id !== id));
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'edit': return 'bg-yellow-100 text-yellow-800';
      case 'view': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopNav
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        pageTitle={pageTitle}
        subTitle={subTitle}
        page={"share"}
        onBack={onBack}
        resultShare={{ "jobType": jobType, "fileName": pageTitle, "fileId": fileId }}
      />


      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Link className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quick Share</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Generate a shareable link instantly</p>
            <button
              onClick={() => setShowCreateLink(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Link
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Invite Team</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Add team members to collaborate</p>
            <button
              onClick={() => setShowInviteUser(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Invite User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Public Access</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Make publicly discoverable</p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              Go Public
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'links', label: 'Shared Links', count: sharedLinks.length },
                { key: 'team', label: 'Team Members', count: teamMembers.length },
                { key: 'public', label: 'Public Settings', count: 0 }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'links' && (
              <div className="space-y-6">
                {/* Create Link Modal */}
                {showCreateLink && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Create Share Link</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link Name</label>
                        <input
                          type="text"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          placeholder="Enter link name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                        <select
                          value={accessLevel}
                          onChange={(e) => setAccessLevel(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="view">View Only</option>
                          <option value="edit">Can Edit</option>
                          <option value="admin">Full Access</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                        <input
                          type="datetime-local"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={requirePassword}
                            onChange={(e) => setRequirePassword(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Require Password</span>
                        </label>
                      </div>
                    </div>
                    {requirePassword && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        onClick={createShareLink}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Create Link
                      </button>
                      <button
                        onClick={() => setShowCreateLink(false)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Shared Links List */}
                <div className="space-y-4">
                  {sharedLinks.map(link => (
                    <div key={link.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{link.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(link.accessLevel)}`}>
                              {link.accessLevel}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {link.password && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Protected
                              </span>
                            )}
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <code className="text-sm text-gray-700 font-mono">{link.url}</code>
                              <button
                                onClick={() => copyToClipboard(link.url, link.id)}
                                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 transition-colors"
                              >
                                {copied === link.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="text-sm">{copied === link.id ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Views:</span> {link.views.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(link.createdAt).toLocaleDateString()}
                            </div>
                            {link.expiresAt && (
                              <div>
                                <span className="font-medium">Expires:</span> {new Date(link.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Status:</span> {link.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleLinkStatus(link.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {link.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Invite User Modal */}
                {showInviteUser && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Invite Team Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Enter email address..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={inviteTeamMember}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Send Invitation
                      </button>
                      <button
                        onClick={() => setShowInviteUser(false)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Team Members List */}
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-indigo-100 rounded-full p-3">
                            <Users className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-gray-600">{member.email}</p>
                            {member.lastAccess && (
                              <p className="text-sm text-gray-500">
                                Last access: {new Date(member.lastAccess).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(member.role)}`}>
                            {member.role}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'public' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Public Sharing</h3>
                  <p className="text-gray-600 mb-6">Make your processed data publicly discoverable and searchable</p>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto">
                    <Globe className="h-4 w-4" />
                    <span>Enable Public Access</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;