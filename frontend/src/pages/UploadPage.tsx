import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Plus,
  Trash2,
  Settings,
  Download,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import TopNav from '../components/TopNav';
import PriorityDropdown from '../components/PriorityDropdown';
import FieldTypeSelector from '../components/FieldTypeSelector';
import { requireAuth } from "./../lib/auth"

export async function loader({ request }: any) {
  const idToken = localStorage.getItem("token") || "";
  const tokenType = localStorage.getItem("tokenType") || "";
  const pathname = new URL(request.url).pathname;

  await requireAuth(idToken, tokenType, pathname)

}

interface ExtractField {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array';
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'ready' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface FileUploadProps {
  onProcessComplete: (results: any[]) => void;
  user?: { email: string, name: string } | null;
  isAuthenticated: boolean;
  onLogout: () => void;
  pageTitle: string;
  subTitle: string;
  page?: string;
  onBack?: string;

}

const UploadPage: React.FC<FileUploadProps> = ({ onProcessComplete, user,
  isAuthenticated,
  onLogout,
  pageTitle,
  subTitle,
  onBack,

  page }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [extractFields, setExtractFields] = useState<ExtractField[]>([]);
  const [newField, setNewField] = useState({ name: '', description: '', type: 'text' as const });
  const [processingMode, setProcessingMode] = useState<'full' | 'keywords' | 'sections'>('full');
  const [outputFormat, setOutputFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf') {
        const newFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'uploading',
          progress: 0
        };

        setUploadedFiles(prev => [...prev, newFile]);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadedFiles(prev => prev.map(f =>
            f.id === newFile.id
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          ));
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          setUploadedFiles(prev => prev.map(f =>
            f.id === newFile.id
              ? { ...f, status: 'ready', progress: 100 }
              : f
          ));
        }, 2000);
      }
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const addField = () => {
    if (newField.name.trim()) {
      const field: ExtractField = {
        id: Math.random().toString(36).substr(2, 9),
        name: newField.name.trim(),
        description: newField.description.trim(),
        type: newField.type
      };
      setExtractFields(prev => [...prev, field]);
      setNewField({ name: '', description: '', type: 'text' });
    }
  };

  const removeField = (id: string) => {
    setExtractFields(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = () => {
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) return;

    readyFiles.forEach(file => {
      setUploadedFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, status: 'processing', progress: 0 }
          : f
      ));

      // Simulate processing
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f =>
          f.id === file.id
            ? { ...f, progress: Math.min(f.progress + 5, 100) }
            : f
        ));
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev => prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        // Generate mock results and navigate to results page
        const mockResults = readyFiles.map(file => ({
          id: file.id,
          fileName: file.file.name,
          extractedAt: new Date().toISOString(),
          processingTime: Math.random() * 3 + 1,
          confidence: Math.floor(Math.random() * 20) + 80,
          totalFields: extractFields.length || 8,
          successfulExtractions: extractFields.length || 7,
          data: generateMockData(extractFields, keywords, processingMode),
          metadata: {
            pages: Math.floor(Math.random() * 10) + 1,
            fileSize: `${(file.file.size / 1024 / 1024).toFixed(1)} MB`,
            keywords: keywords.length > 0 ? keywords : undefined,
            sections: processingMode === 'sections' ? ['header', 'body', 'footer'] : undefined
          }
        }));

        onProcessComplete(mockResults);
      }, 6000);
    });
  };

  const generateMockData = (fields: ExtractField[], keywords: string[], mode: string) => {
    const mockData: Record<string, any> = {};

    if (fields.length > 0) {
      fields.forEach(field => {
        switch (field.type) {
          case 'text':
            mockData[field.name] = `Sample ${field.name} data`;
            break;
          case 'number':
            mockData[field.name] = Math.floor(Math.random() * 1000);
            break;
          case 'date':
            mockData[field.name] = new Date().toISOString().split('T')[0];
            break;
          case 'boolean':
            mockData[field.name] = Math.random() > 0.5;
            break;
          case 'array':
            mockData[field.name] = [`Item 1`, `Item 2`, `Item 3`];
            break;
        }
      });
    } else {
      // Default mock data
      mockData.documentTitle = 'Sample Document';
      mockData.author = 'John Doe';
      mockData.date = '2024-01-15';
      mockData.totalAmount = 2450.00;
      mockData.currency = 'USD';
      mockData.status = 'Active';
      mockData.description = 'This is a sample extracted document with various data fields.';
    }

    return mockData;
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
        onBack={onBack}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Documents</h2>
            <p className="text-gray-600">Upload your PDF files and configure extraction parameters</p>
          </div>

          <div className="p-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop PDF files here</h3>
              <p className="text-gray-600 mb-4">or click to browse your computer</p>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Uploaded Files</h3>
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {file.status === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{file.progress}%</span>
                        </div>
                      )}
                      {file.status === 'ready' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {file.status === 'processing' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">Processing...</span>
                        </div>
                      )}
                      {file.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600">Completed</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Processing Configuration */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Extraction Configuration</h2>
            <p className="text-gray-600">Configure how you want to extract and format your data</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Processing Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Processing Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'full', label: 'Full Document', desc: 'Extract all data from the entire document' },
                  { value: 'keywords', label: 'Keyword-based', desc: 'Extract data around specific keywords' },
                  { value: 'sections', label: 'Specific Sections', desc: 'Target particular document sections' }
                ].map(mode => (
                  <div
                    key={mode.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${processingMode === mode.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setProcessingMode(mode.value as any)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{mode.label}</h3>
                    <p className="text-sm text-gray-600">{mode.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <PriorityDropdown />

            {/* Keywords Section */}
            {processingMode === 'keywords' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Keywords</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 text-indigo-500 hover:text-indigo-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Enter keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Output Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Output Fields</label>
              {extractFields.length > 0 && <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr>
                      <th className="px-4 py-2 text-left">Field Name</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-900">
                    {extractFields.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-50 border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">{field.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            {field.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {field.description || <span className="italic text-gray-400">No description</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeField(field.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}


              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Field name..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newField.description}
                  onChange={(e) => setNewField(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <FieldTypeSelector />
                <button
                  onClick={addField}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Field</span>
                </button>
              </div>

            </div>
            <textarea
              // value={newField.description}
              // onChange={(e) => setNewField(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optional)..."
              rows={4}
              className="mt-4 w-full p-4 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />


            {/* Output Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Output Format</label>
              <div className="flex space-x-4">
                {['json', 'csv', 'xml'].map(format => (
                  <label key={format} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value={format}
                      checked={outputFormat === format}
                      onChange={(e) => setOutputFormat(e.target.value as any)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 uppercase">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            {/* <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidence Threshold
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="80"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">Include page numbers</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        </div>

        {/* Process Button */}
        <div className="flex justify-center">
          <button
            onClick={processFiles}
            disabled={uploadedFiles.filter(f => f.status === 'ready').length === 0}
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Eye className="h-5 w-5" />
            <span>Process Documents</span>
          </button>
        </div>
      </div>
    </div>

  );
};

export default UploadPage;