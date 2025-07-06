import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Database,
  Zap,
  Mail,
  Phone,
  Camera,
  AlertTriangle,
  Trash2,
  Download,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Palette,
  HardDrive,
  Wifi,
  FileText,
  Users,
  Building,
  Copy
} from 'lucide-react';
import TopNav from './TopNav';
import { useLocation } from 'react-router-dom';

interface SettingsPageProps {
  user?: { email: string; name: string } | null;
  isAuthenticated: boolean;
  pageTitle: string;
  subTitle: string;
  page?: string;
  onLogout: () => void;
  onSave?: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar?: string;
  timezone: string;
  language: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  processing: boolean;
  sharing: boolean;
  security: boolean;
  marketing: boolean;
}

interface SecuritySettings {
  twoFactor: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'blue' | 'purple' | 'green' | 'orange';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  isAuthenticated,
  pageTitle = "Settings",
  subTitle = "",
  page,
  onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'billing' | 'appearance' | 'data' | 'api'>('profile');
  const [saved, setSaved] = useState(false);
  const location = useLocation();
  const from = location.state?.from || 'unknown';
  console.log("from : ", from)
  // Profile settings
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    role: 'Data Analyst',
    timezone: 'America/New_York',
    language: 'en'
  });

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    processing: true,
    sharing: true,
    security: true,
    marketing: false
  });

  // Security settings
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactor: true,
    sessionTimeout: 30,
    loginAlerts: true,
    deviceTracking: true
  });

  // Appearance settings
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    colorScheme: 'blue',
    fontSize: 'medium',
    animations: true
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecurityToggle = (field: keyof SecuritySettings) => {
    setSecurity(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAppearanceChange = (field: keyof AppearanceSettings, value: any) => {
    setAppearance(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'billing', label: 'Billing', icon: CreditCard },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'data', label: 'Data & Privacy', icon: Database },
    { key: 'api', label: 'API & Integrations', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopNav
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        pageTitle={pageTitle}
        subTitle={subTitle}
        page={page}
        showMetadata={saved}
        onBack={"/"}
        onSave={handleSave}
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Settings</h2>
              </div>
              <nav className="p-2">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                    <p className="text-gray-600">Manage your personal information and preferences</p>
                  </div>

                  {/* Avatar Section */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                    <div className="flex items-center space-x-6">
                      <div className="bg-indigo-100 rounded-full p-6">
                        <User className="h-12 w-12 text-indigo-600" />
                      </div>
                      <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          <Camera className="h-4 w-4" />
                          <span>Upload Photo</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleProfileUpdate('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileUpdate('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => handleProfileUpdate('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={profile.role}
                        onChange={(e) => handleProfileUpdate('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
                    <p className="text-gray-600">Choose how you want to be notified about important events</p>
                  </div>

                  <div className="space-y-6">
                    {/* Notification Channels */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'email', label: 'Email Notifications', icon: Mail, description: 'Receive notifications via email' },
                          { key: 'push', label: 'Push Notifications', icon: Bell, description: 'Browser and mobile push notifications' },
                          { key: 'sms', label: 'SMS Notifications', icon: Phone, description: 'Text message notifications for critical alerts' }
                        ].map(channel => (
                          <div key={channel.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <channel.icon className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">{channel.label}</p>
                                <p className="text-sm text-gray-600">{channel.description}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notifications[channel.key as keyof NotificationSettings]}
                                onChange={() => handleNotificationToggle(channel.key as keyof NotificationSettings)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'processing', label: 'Processing Updates', description: 'Document processing status and completion' },
                          { key: 'sharing', label: 'Sharing Activity', description: 'When files are shared or accessed' },
                          { key: 'security', label: 'Security Alerts', description: 'Login attempts and security events' },
                          { key: 'marketing', label: 'Marketing Updates', description: 'Product updates and promotional content' }
                        ].map(type => (
                          <div key={type.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{type.label}</p>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notifications[type.key as keyof NotificationSettings]}
                                onChange={() => handleNotificationToggle(type.key as keyof NotificationSettings)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                    <p className="text-gray-600">Manage your account security and privacy settings</p>
                  </div>

                  <div className="space-y-6">
                    {/* Two-Factor Authentication */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-6 w-6 text-green-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 mb-2">Two-Factor Authentication</h3>
                          <p className="text-green-700 mb-4">Add an extra layer of security to your account</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600">
                              {security.twoFactor ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                              onClick={() => handleSecurityToggle('twoFactor')}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${security.twoFactor
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                              {security.twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Options */}
                    <div className="space-y-4">
                      {[
                        {
                          key: 'loginAlerts',
                          label: 'Login Alerts',
                          description: 'Get notified of new login attempts',
                          icon: Bell
                        },
                        {
                          key: 'deviceTracking',
                          label: 'Device Tracking',
                          description: 'Track and manage logged-in devices',
                          icon: Smartphone
                        }
                      ].map(option => (
                        <div key={option.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <option.icon className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">{option.label}</p>
                              <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={security[option.key as keyof SecuritySettings]}
                              onChange={() => handleSecurityToggle(option.key as keyof SecuritySettings)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Session Timeout */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Settings</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <select
                          value={security.sessionTimeout}
                          onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        {[
                          { device: 'MacBook Pro', location: 'New York, NY', current: true, lastActive: '2 minutes ago' },
                          { device: 'iPhone 14', location: 'New York, NY', current: false, lastActive: '1 hour ago' },
                          { device: 'Chrome Browser', location: 'San Francisco, CA', current: false, lastActive: '2 days ago' }
                        ].map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Monitor className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {session.device}
                                  {session.current && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Current</span>}
                                </p>
                                <p className="text-sm text-gray-600">{session.location} • {session.lastActive}</p>
                              </div>
                            </div>
                            {!session.current && (
                              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Settings */}
              {activeTab === 'billing' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h2>
                    <p className="text-gray-600">Manage your subscription and billing information</p>
                  </div>

                  {/* Current Plan */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900">Professional Plan</h3>
                        <p className="text-indigo-700">$49/month • Billed monthly</p>
                        <p className="text-sm text-indigo-600 mt-1">Next billing date: February 15, 2024</p>
                      </div>
                      <div className="text-right">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors mb-2">
                          Upgrade Plan
                        </button>
                        <p className="text-sm text-indigo-600">Cancel anytime</p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Documents</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">1,247</p>
                      <p className="text-sm text-gray-600">of 5,000 this month</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <HardDrive className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Storage</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">12.4 GB</p>
                      <p className="text-sm text-gray-600">of 100 GB used</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Team Members</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-sm text-gray-600">of 25 seats used</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-600">Expires 12/25</p>
                          </div>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
                    <div className="space-y-3">
                      {[
                        { date: '2024-01-15', amount: '$49.00', status: 'Paid', invoice: 'INV-001' },
                        { date: '2023-12-15', amount: '$49.00', status: 'Paid', invoice: 'INV-002' },
                        { date: '2023-11-15', amount: '$49.00', status: 'Paid', invoice: 'INV-003' }
                      ].map((bill, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900">{bill.date}</p>
                              <p className="text-sm text-gray-600">{bill.invoice}</p>
                            </div>
                            <span className="text-lg font-semibold text-gray-900">{bill.amount}</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {bill.status}
                            </span>
                          </div>
                          <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700">
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Appearance Settings</h2>
                    <p className="text-gray-600">Customize the look and feel of your DataMind experience</p>
                  </div>

                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { key: 'light', label: 'Light', icon: Sun },
                          { key: 'dark', label: 'Dark', icon: Moon },
                          { key: 'auto', label: 'Auto', icon: Monitor }
                        ].map(theme => (
                          <button
                            key={theme.key}
                            onClick={() => handleAppearanceChange('theme', theme.key)}
                            className={`p-4 border-2 rounded-lg transition-colors ${appearance.theme === theme.key
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <theme.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                            <p className="font-medium text-gray-900">{theme.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Scheme */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { key: 'blue', label: 'Blue', color: 'bg-blue-500' },
                          { key: 'purple', label: 'Purple', color: 'bg-purple-500' },
                          { key: 'green', label: 'Green', color: 'bg-green-500' },
                          { key: 'orange', label: 'Orange', color: 'bg-orange-500' }
                        ].map(color => (
                          <button
                            key={color.key}
                            onClick={() => handleAppearanceChange('colorScheme', color.key)}
                            className={`p-4 border-2 rounded-lg transition-colors ${appearance.colorScheme === color.key
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className={`w-8 h-8 ${color.color} rounded-full mx-auto mb-2`} />
                            <p className="font-medium text-gray-900">{color.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Size</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { key: 'small', label: 'Small' },
                          { key: 'medium', label: 'Medium' },
                          { key: 'large', label: 'Large' }
                        ].map(size => (
                          <button
                            key={size.key}
                            onClick={() => handleAppearanceChange('fontSize', size.key)}
                            className={`p-4 border-2 rounded-lg transition-colors ${appearance.fontSize === size.key
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <p className={`font-medium text-gray-900 ${size.key === 'small' ? 'text-sm' :
                              size.key === 'large' ? 'text-lg' : 'text-base'
                              }`}>
                              {size.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Animations */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Enable Animations</p>
                        <p className="text-sm text-gray-600">Smooth transitions and micro-interactions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appearance.animations}
                          onChange={(e) => handleAppearanceChange('animations', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy */}
              {activeTab === 'data' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Data & Privacy</h2>
                    <p className="text-gray-600">Control your data and privacy settings</p>
                  </div>

                  <div className="space-y-6">
                    {/* Data Export */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <Download className="h-6 w-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-2">Export Your Data</h3>
                          <p className="text-blue-700 mb-4">Download all your processed documents and data</p>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Request Data Export
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Automatically delete processed files after
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="never">Never</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Analytics & Performance', description: 'Help improve DataMind with usage analytics' },
                          { label: 'Marketing Communications', description: 'Receive product updates and tips' },
                          { label: 'Third-party Integrations', description: 'Allow data sharing with connected services' }
                        ].map((setting, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{setting.label}</p>
                              <p className="text-sm text-gray-600">{setting.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
                          <p className="text-red-700 mb-4">Permanently delete your account and all associated data</p>
                          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API & Integrations */}
              {activeTab === 'api' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">API & Integrations</h2>
                    <p className="text-gray-600">Manage API keys and third-party integrations</p>
                  </div>

                  <div className="space-y-6">
                    {/* API Keys */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
                      <div className="space-y-4">
                        {[
                          { name: 'Production API Key', key: 'dm_prod_abc123...', created: '2024-01-15', lastUsed: '2 hours ago' },
                          { name: 'Development API Key', key: 'dm_dev_xyz789...', created: '2024-01-10', lastUsed: '1 day ago' }
                        ].map((apiKey, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                                <code className="text-sm text-gray-600 font-mono">{apiKey.key}</code>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          <Key className="h-4 w-4" />
                          <span>Generate New API Key</span>
                        </button>
                      </div>
                    </div>

                    {/* Webhooks */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhooks</h3>
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 mb-2">No Webhooks Configured</h4>
                        <p className="text-gray-600 mb-4">Set up webhooks to receive real-time notifications</p>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                          Add Webhook
                        </button>
                      </div>
                    </div>

                    {/* Connected Apps */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Applications</h3>
                      <div className="space-y-4">
                        {[
                          { name: 'Slack', description: 'Get notifications in your Slack workspace', connected: true },
                          { name: 'Google Drive', description: 'Save processed files to Google Drive', connected: false },
                          { name: 'Zapier', description: 'Automate workflows with Zapier', connected: true }
                        ].map((app, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white p-2 rounded-lg">
                                <Building className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{app.name}</p>
                                <p className="text-sm text-gray-600">{app.description}</p>
                              </div>
                            </div>
                            <button
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${app.connected
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                              {app.connected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;