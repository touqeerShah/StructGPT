import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  FileText,
  Database,
  Settings,
  Activity,
  TrendingUp,
  Eye,
  Download,
  MoreVertical,
  ArrowRight,
  Timer,
  Cpu,
  HardDrive,
  Network, Edit3, Trash2
} from 'lucide-react';
import TopNav from './TopNav';
import { useNavigate } from "react-router-dom";

interface ProcessingJob {
  id: string;
  fileName: string;
  fileSize: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  startedAt: string;
  completedAt?: string;
  estimatedTime?: number;
  remainingTime?: number;
  priority: 'low' | 'medium' | 'high';
  processingType: 'full' | 'keywords' | 'sections';
  userId: string;
  retryCount: number;
  errorMessage?: string;
  extractedFields?: number;
  confidence?: number;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  status: 'active' | 'paused' | 'error';
  description: string;
  jobType: 'cleanup' | 'batch_process' | 'backup' | 'maintenance';
  runCount: number;
  successRate: number;
}

interface SystemMetrics {
  activeJobs: number;
  queuedJobs: number;
  completedToday: number;
  failedToday: number;
  avgProcessingTime: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}
interface ProcessingDashboardProps {
  user?: { email: string, name: string } | null;
  isAuthenticated: boolean;
  onLogout: () => void;
  pageTitle: string;
  subTitle: string;
  page?: string;
  onBack?: string;
}


const ProcessingDashboard: React.FC<ProcessingDashboardProps> = ({
  user,
  isAuthenticated,
  onLogout,
  pageTitle,
  subTitle,
  page,
  onBack }) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeJobs: 0,
    queuedJobs: 0,
    completedToday: 0,
    failedToday: 0,
    avgProcessingTime: 0,
    systemLoad: 0,
    memoryUsage: 0,
    diskUsage: 0
  });
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'cron' | 'history'>('jobs');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<{
    type: 'processing' | 'cron' | 'history';
    id: string;
  } | null>(null);
  const navigate = useNavigate();
  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
  //       setOpen(false);
  //     }
  //   }
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);
  // Mock data generation
  useEffect(() => {
    const generateMockJobs = (): ProcessingJob[] => [
      {
        id: '1',
        fileName: 'financial_report_q4.pdf',
        fileSize: '2.4 MB',
        status: 'processing',
        progress: 65,
        startedAt: new Date(Date.now() - 120000).toISOString(),
        estimatedTime: 180,
        remainingTime: 63,
        priority: 'high',
        processingType: 'full',
        userId: 'user_123',
        retryCount: 0,
        extractedFields: 12
      },
      {
        id: '2',
        fileName: 'contract_agreement.pdf',
        fileSize: '1.8 MB',
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString(),
        priority: 'medium',
        processingType: 'keywords',
        userId: 'user_456',
        retryCount: 0
      },
      {
        id: '3',
        fileName: 'invoice_batch_jan.pdf',
        fileSize: '5.2 MB',
        status: 'completed',
        progress: 100,
        startedAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: new Date(Date.now() - 60000).toISOString(),
        priority: 'low',
        processingType: 'sections',
        userId: 'user_789',
        retryCount: 0,
        extractedFields: 24,
        confidence: 94
      },
      {
        id: '4',
        fileName: 'research_paper.pdf',
        fileSize: '3.1 MB',
        status: 'failed',
        progress: 45,
        startedAt: new Date(Date.now() - 180000).toISOString(),
        priority: 'medium',
        processingType: 'full',
        userId: 'user_321',
        retryCount: 2,
        errorMessage: 'OCR processing failed - corrupted text layer'
      },
      {
        id: '5',
        fileName: 'medical_records.pdf',
        fileSize: '4.7 MB',
        status: 'paused',
        progress: 30,
        startedAt: new Date(Date.now() - 240000).toISOString(),
        priority: 'high',
        processingType: 'keywords',
        userId: 'user_654',
        retryCount: 1
      }
    ];

    const generateMockCronJobs = (): CronJob[] => [
      {
        id: 'cron_1',
        name: 'Daily Cleanup',
        schedule: '0 2 * * *',
        nextRun: new Date(Date.now() + 86400000).toISOString(),
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        status: 'active',
        description: 'Clean up temporary files and old processing logs',
        jobType: 'cleanup',
        runCount: 365,
        successRate: 99.7
      },
      {
        id: 'cron_2',
        name: 'Batch Processing Queue',
        schedule: '*/15 * * * *',
        nextRun: new Date(Date.now() + 900000).toISOString(),
        lastRun: new Date(Date.now() - 900000).toISOString(),
        status: 'active',
        description: 'Process queued documents in batches',
        jobType: 'batch_process',
        runCount: 2880,
        successRate: 98.2
      },
      {
        id: 'cron_3',
        name: 'Database Backup',
        schedule: '0 0 * * 0',
        nextRun: new Date(Date.now() + 604800000).toISOString(),
        lastRun: new Date(Date.now() - 604800000).toISOString(),
        status: 'active',
        description: 'Weekly database backup to cloud storage',
        jobType: 'backup',
        runCount: 52,
        successRate: 100
      },
      {
        id: 'cron_4',
        name: 'System Health Check',
        schedule: '*/5 * * * *',
        nextRun: new Date(Date.now() + 300000).toISOString(),
        status: 'error',
        description: 'Monitor system resources and performance',
        jobType: 'maintenance',
        runCount: 17280,
        successRate: 95.8
      }
    ];

    const generateMockMetrics = (): SystemMetrics => ({
      activeJobs: 2,
      queuedJobs: 8,
      completedToday: 47,
      failedToday: 3,
      avgProcessingTime: 142,
      systemLoad: 68,
      memoryUsage: 72,
      diskUsage: 45
    });

    setJobs(generateMockJobs());
    setCronJobs(generateMockCronJobs());
    setMetrics(generateMockMetrics());
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setJobs(prevJobs =>
        prevJobs.map(job => {
          if (job.status === 'processing' && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 5, 100);
            const newRemainingTime = job.remainingTime ? Math.max(job.remainingTime - 5, 0) : 0;

            if (newProgress >= 100) {
              return {
                ...job,
                status: 'completed' as const,
                progress: 100,
                completedAt: new Date().toISOString(),
                remainingTime: 0,
                confidence: Math.floor(Math.random() * 20) + 80
              };
            }

            return {
              ...job,
              progress: newProgress,
              remainingTime: newRemainingTime
            };
          }
          return job;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Show job detail page if selected


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-gray-500" />;
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch = job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSchedule = (schedule: string) => {
    const scheduleMap: Record<string, string> = {
      '0 2 * * *': 'Daily at 2:00 AM',
      '*/15 * * * *': 'Every 15 minutes',
      '0 0 * * 0': 'Weekly on Sunday',
      '*/5 * * * *': 'Every 5 minutes'
    };
    return scheduleMap[schedule] || schedule;
  };

  const handleJobClick = (jobId: string, type: 'processing' | 'cron' | 'history') => {
    setSelectedJobDetail({ type, id: jobId });
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
        page={page}
        showMetadata={autoRefresh}
        setShowMetadata={setAutoRefresh}
        onBack={onBack}

      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.activeJobs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queue Length</p>
                <p className="text-3xl font-bold text-yellow-600">{metrics.queuedJobs}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">Avg wait time: 3.2 min</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{metrics.completedToday}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600">{metrics.failedToday} failed</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Load</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.systemLoad}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Cpu className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.systemLoad}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Memory Usage</h3>
              <Cpu className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.memoryUsage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Disk Usage</h3>
              <HardDrive className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{metrics.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.diskUsage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Network I/O</h3>
              <Network className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Throughput</span>
                <span>2.4 MB/s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-300 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'jobs', label: 'Processing Jobs', count: jobs.length },
                { key: 'cron', label: 'Cron Jobs', count: cronJobs.length },
                { key: 'history', label: 'History', count: 156 }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedTab === 'jobs' && (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  // onClick={() => handleJobClick(job.id, 'processing')}
                  // onClick={() => navigate(`/dashboard/details/${job.id}`, {
                  //   state: {
                  //     jobType: 'processing',
                  //     jobId: job.id,
                  //     user: user,
                  //     isAuthenticated: isAuthenticated,
                  //     pageTitle: job.fileName,
                  //     subTitle: "Processing Job • ID: " + job.id,
                  //     page: "results",
                  //     onBack: "/dashboard",
                  //   }
                  // })}

                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <FileText className="h-8 w-8 text-red-500 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{job.fileName}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              <span className="ml-1 capitalize">{job.status}</span>
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                              {job.priority} priority
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Size:</span> {job.fileSize}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {job.processingType}
                            </div>
                            <div>
                              <span className="font-medium">User:</span> {job.userId}
                            </div>
                            <div>
                              <span className="font-medium">Started:</span> {new Date(job.startedAt).toLocaleTimeString()}
                            </div>
                          </div>

                          {job.status === 'processing' && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress: {job.progress}%</span>
                                {job.remainingTime && (
                                  <span>Remaining: {formatTime(job.remainingTime)}</span>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {job.status === 'completed' && job.confidence && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Confidence: {job.confidence}%</span>
                              <span>Fields: {job.extractedFields}</span>
                              <span>Completed: {new Date(job.completedAt!).toLocaleTimeString()}</span>
                            </div>
                          )}

                          {job.status === 'failed' && job.errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Processing Failed</p>
                                  <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                                  <p className="text-xs text-red-500 mt-1">Retry attempts: {job.retryCount}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {job.status === 'processing' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {job.status === 'paused' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {(job.status === 'failed' || job.status === 'completed') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {/* {job.status === 'completed' && ( */}
                        <button
                          onClick={() => navigate(`/dashboard/details/${job.id}`, {
                            state: {
                              jobType: 'processing',
                              jobId: job.id,
                              user: user,
                              isAuthenticated: isAuthenticated,
                              pageTitle: job.fileName,
                              subTitle: "Processing Job • ID: " + job.id,
                              page: "results",
                              onBack: "/dashboard",
                            }
                          })} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* )} */}
                        <div className="relative inline-block text-left" ref={menuRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === job.id ? null : job.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === job.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/uploads/${job.id}/edit`, {
                                    state: {
                                      user: user,
                                      isAuthenticated: isAuthenticated,
                                      pageTitle: "Edit Job :" + job.fileName,
                                      subTitle: `Edit Job • ID: ` + job.id,
                                      page: "edit",
                                      onBack: "/dashboard",
                                    }
                                  });
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit3 className="inline-block mr-2 h-4 w-4" />
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  // handleDelete(cronJob)
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="inline-block mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'cron' && (
              <div className="space-y-4">
                {cronJobs.map(cronJob => (
                  <div
                    key={cronJob.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleJobClick(cronJob.id, 'cron')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Timer className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{cronJob.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cronJob.status === 'active' ? 'bg-green-100 text-green-800' :
                              cronJob.status === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {cronJob.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {cronJob.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                              {cronJob.status === 'paused' && <Pause className="h-3 w-3 mr-1" />}
                              <span className="capitalize">{cronJob.status}</span>
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {cronJob.jobType.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-gray-600 mb-3">{cronJob.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Schedule:</span> {formatSchedule(cronJob.schedule)}
                            </div>
                            <div>
                              <span className="font-medium">Next Run:</span> {new Date(cronJob.nextRun).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Success Rate:</span> {cronJob.successRate}%
                            </div>
                            <div>
                              <span className="font-medium">Total Runs:</span> {cronJob.runCount.toLocaleString()}
                            </div>
                          </div>

                          {cronJob.lastRun && (
                            <div className="mt-2 text-sm text-gray-500">
                              Last run: {new Date(cronJob.lastRun).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {cronJob.status === 'active' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {cronJob.status === 'paused' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <div className="relative inline-block text-left" ref={menuRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === cronJob.id ? null : cronJob.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === cronJob.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/uploads/${cronJob.id}/edit`);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit3 className="inline-block mr-2 h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  // handleDelete(cronJob)
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="inline-block mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'history' && (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing History</h3>
                <p className="text-gray-600 mb-6">View detailed logs and analytics of past processing jobs</p>
                <button
                  onClick={() => handleJobClick('history_1', 'history')}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>View Full History</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingDashboard;