import React, { useState } from 'react';
import {
  Download,
  Eye,
  Copy,
  CheckCircle,

  FileText,
  Database,
  Search,
  
  RefreshCw,
  
  Edit3,
  ExternalLink,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import TopNav from './TopNav';

interface ExtractedData {
  id: string;
  fileName: string;
  extractedAt: string;
  processingTime: number;
  confidence: number;
  totalFields: number;
  successfulExtractions: number;
  data: Record<string, any>;
  rawText?: string;
  metadata: {
    pages: number;
    fileSize: string;
    keywords?: string[];
    sections?: string[];
  };
}

interface ResultsPageProps {
  results: ExtractedData[];
  onReprocess: (id: string) => void;
  user?: { email: string, name: string } | null;
  isAuthenticated: boolean;
  onBackToHome: () => void;
  onDashboard: () => void;
  onShare: () => void;
  onSettings: () => void;
  onLogout: () => void;
  pageTitle: string;
  subTitle: string;
  isResultPage: boolean
}

const ResultsPage: React.FC<ResultsPageProps> = ({ results, 
  user,
    isAuthenticated,
    onBackToHome,
    onDashboard,
    onShare,
    onSettings,
    onLogout,
    pageTitle ,
    subTitle ,
    isResultPage ,
    onReprocess }) => {
  const [selectedResult, setSelectedResult] = useState<ExtractedData | null>(results[0] || null);
  const [viewMode, setViewMode] = useState<'structured' | 'raw' | 'preview'|'table'>('structured');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadData = (format: 'json' | 'csv' | 'xml') => {
    if (!selectedResult) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(selectedResult.data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        const headers = Object.keys(selectedResult.data);
        const values = Object.values(selectedResult.data);
        content = `${headers.join(',')}\n${values.join(',')}`;
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'xml':
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${Object.entries(selectedResult.data).map(([key, value]) => `  <${key}>${value}</${key}>`).join('\n')}\n</data>`;
        mimeType = 'application/xml';
        extension = 'xml';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedResult.fileName.replace('.pdf', '')}_extracted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredData = selectedResult ? Object.entries(selectedResult.data).filter(([key, value]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Mock data for demonstration
  const mockResults: ExtractedData[] = [
    {
      id: '1',
      fileName: 'invoice_2024_001.pdf',
      extractedAt: '2024-01-15T10:30:00Z',
      processingTime: 2.3,
      confidence: 94,
      totalFields: 12,
      successfulExtractions: 11,
      data: {
        invoiceNumber: 'INV-2024-001',
        date: '2024-01-15',
        customerName: 'Acme Corporation',
        customerEmail: 'billing@acme.com',
        totalAmount: 2450.00,
        currency: 'USD',
        items: [
          { description: 'Web Development Services', quantity: 40, rate: 50, amount: 2000 },
          { description: 'Domain Registration', quantity: 1, rate: 15, amount: 15 },
          { description: 'Hosting Services', quantity: 1, rate: 435, amount: 435 }
        ],
        paymentTerms: 'Net 30',
        dueDate: '2024-02-14',
        status: 'Pending',
        notes: 'Thank you for your business'
      },
      metadata: {
        pages: 2,
        fileSize: '1.2 MB',
        keywords: ['invoice', 'payment', 'total'],
        sections: ['header', 'items', 'footer']
      }
    }
  ];

  const currentResults = results.length > 0 ? results : mockResults;
  const currentSelected = selectedResult || currentResults[0];
  const allData = Object.entries(currentSelected.data || {});
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  const paginatedData = allData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopNav
        user={user}
        isAuthenticated={isAuthenticated}
        onBackToHome={onBackToHome}
        onDashboard={onDashboard}
        onShare={onShare}
        onSettings={onSettings}
        onLogout={onLogout}
        pageTitle={pageTitle}
        subTitle={subTitle}
        isResultPage={isResultPage}
        setShowMetadata={setShowMetadata}
        showMetadata={showMetadata}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - File List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Processed Files</h2>
                <p className="text-sm text-gray-600">{currentResults.length} files processed</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {currentResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${currentSelected?.id === result.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                      }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.fileName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                            {result.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.successfulExtractions}/{result.totalFields} fields extracted
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            {showMetadata && currentSelected && (
              <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">File Metadata</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pages</span>
                    <span className="text-sm font-medium text-gray-900">{currentSelected.metadata.pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Size</span>
                    <span className="text-sm font-medium text-gray-900">{currentSelected.metadata.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing Time</span>
                    <span className="text-sm font-medium text-gray-900">{currentSelected.processingTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Extracted At</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(currentSelected.extractedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentSelected && (
              <>
                {/* Results Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSelected.fileName}</h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Processed {new Date(currentSelected.extractedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4" />
                            <span>{currentSelected.processingTime}s processing time</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{currentSelected.successfulExtractions}/{currentSelected.totalFields} fields</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(currentSelected.confidence)}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {currentSelected.confidence}% Confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Controls */}
                  <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                          {[
                            { key: 'structured', label: 'Structured', icon: Database },
                            { key: 'raw', label: 'Raw Text', icon: FileText },
                            { key: 'preview', label: 'Preview', icon: Eye },
                            { key: 'table', label: 'Table View', icon: Search } // or use Table icon

                          ].map(({ key, label, icon: Icon }) => (
                            <button
                              key={key}
                              onClick={() => setViewMode(key as any)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === key
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentSelected.data)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {viewMode === 'structured' && (
                    <div className="p-6">
                      <div className="space-y-4">
                        {filteredData.map(([key, value]) => (
                          <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-2">{key}</h3>
                                <div className="text-gray-700">
                                  {Array.isArray(value) ? (
                                    <div className="space-y-2">
                                      {value.map((item, index) => (
                                        <div key={index} className="bg-gray-100 p-3 rounded-lg">
                                          {typeof item === 'object' ? (
                                            <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
                                          ) : (
                                            <span>{String(item)}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : typeof value === 'object' ? (
                                    <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                                      {JSON.stringify(value, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="text-lg">{String(value)}</span>
                                  )}
                                </div>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 ml-4">
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              {viewMode === 'table' && (
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedData.map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-4 py-2 font-medium text-gray-900">{key}</td>
                          <td className="px-4 py-2 text-gray-700">
                            {Array.isArray(value) || typeof value === 'object' ? (
                              <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap break-all">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <span>{String(value)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="flex justify-end items-center space-x-2 mt-4 text-sm">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <span>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}


                  {viewMode === 'raw' && (
                    <div className="p-6">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(currentSelected.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {viewMode === 'preview' && (
                    <div className="p-6">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-600 text-center">
                          PDF preview would be displayed here in a production environment
                        </p>
                        <div className="mt-4 flex justify-center">
                          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                            <span>Open Original PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadData('json')}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON</span>
                  </button>
                  <button
                    onClick={() => downloadData('csv')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => downloadData('xml')}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download XML</span>
                  </button>
                  <button
                    onClick={() => onReprocess(currentSelected.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reprocess</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;