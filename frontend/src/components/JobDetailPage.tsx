import React, { useState } from "react";
import {
    ArrowLeft,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Eye,
    RefreshCw,
    Play,
    Pause,
    Trash2,
    Filter,
    Search,
    Calendar,
    BarChart3,
    Activity,
    Database,
    Settings,
    ExternalLink,
    Copy,
    Share2,
    Edit3,
    MoreVertical,
    Target,
    Zap,
    Users,
    Globe,
    Lock,
    Cpu,
    HardDrive,
    Network,
    Timer,
    Building,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import ExpandableTable from "./ExpandableTable";
import PydanticSchemaViewer from "./PydanticSchemaViewer";
import { Description } from "@headlessui/react";


interface JobDetailPageProps {
    onLogout: () => void;
}

// import React, { useState } from 'react';

// export default ExpandableTable;

interface ExtractionRecord {
    id: string;
    fieldName: string;
    extractedValue: any;
    confidence: number;
    dataType: "text" | "number" | "date" | "boolean" | "array" | "object";
    sourceLocation: string;
    timestamp: string;
    status: "success" | "partial" | "failed";
    validationStatus: "valid" | "warning" | "error";
    notes?: string;
}

interface ProcessingJobDetail {
    id: string;
    fileName: string;
    fileSize: string;
    status: "pending" | "processing" | "completed" | "failed" | "paused";
    progress: number;
    startedAt: string;
    completedAt?: string;
    processingTime?: number;
    priority: "low" | "medium" | "high";
    processingType: "full" | "keywords" | "sections";
    userId: string;
    retryCount: number;
    errorMessage?: string;
    extractedFields: number;
    confidence: number;
    totalPages: number;
    processedPages: number;
    extractionRecords: ExtractionRecord[];
    metadata: {
        originalFormat: string;
        fileHash: string;
        uploadedBy: string;
        processingNode: string;
        memoryUsed: string;
        cpuTime: string;
    };
}

interface CronJobDetail {
    id: string;
    name: string;
    description: string;
    schedule: string;
    nextRun: string;
    lastRun?: string;
    status: "active" | "paused" | "error";
    jobType: "cleanup" | "batch_process" | "backup" | "maintenance";
    runCount: number;
    successRate: number;
    averageRunTime: number;
    lastRunDuration?: number;
    executionHistory: Array<{
        id: string;
        startTime: string;
        endTime: string;
        status: "success" | "failed" | "timeout";
        duration: number;
        output?: string;
        errorMessage?: string;
    }>;
    configuration: {
        timeout: number;
        retryAttempts: number;
        notifyOnFailure: boolean;
        environment: string;
    };
}

const JobDetailPage: React.FC<JobDetailPageProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<
        "overview" | "records" | "raw" | "structured" | "preview"
    >("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [showExportModal, setShowExportModal] = useState(false);
    const location = useLocation();
    console.log("location", location);
    const {
        jobType,
        jobId,
        user,
        isAuthenticated,
        pageTitle,
        subTitle,
        page,
        onBack,
    } = location.state;
    const class_structure = {
        "class_name": "AbstractReport",
        "class_struture": "from pydantic import BaseModel, Field\nfrom typing import Optional\n\nclass AbstractReport(BaseModel):\n    abstract_number: str = Field(pattern=r'^[A-Za-z]{2}-[A-Za-z0-9]{4}$')\n    background: Optional[str] = None\n    method: Optional[str] = None\n    results: Optional[str] = None\n    funding: Optional[str] = None\n    conclusions: Optional[str] = None",
    }
    // Mock data based on job type
    const data = [
        {
            id: "1",
            fileName: "invoice_2024_001.pdf",
            extractedAt: "2024-01-15T10:30:00Z",
            processingTime: 2.3,
            confidence: 94,
            totalFields: 12,
            successfulExtractions: 11,
            data: {
                invoiceNumber: "INV-2024-001",
                date: "2024-01-15",
                customerName: "Acme Corporation",
                customerEmail: "billing@acme.com",
                totalAmount: 2450.0,
                currency: "USD",
                items: [
                    {
                        description: "Web Development Services",
                        quantity: 40,
                        rate: 50,
                        amount: 2000,
                    },
                    {
                        description: "Domain Registration",
                        quantity: 1,
                        rate: 15,
                        amount: 15,
                    },
                    {
                        description: "Hosting Services",
                        quantity: 1,
                        rate: 435,
                        amount: 435,
                    },
                ],
                paymentTerms: "Net 30",
                dueDate: "2024-02-14",
                status: "Pending",
                notes: "Thank you for your business",
            },
            metadata: {
                pages: 2,
                fileSize: "1.2 MB",
                keywords: ["invoice", "payment", "total"],
                sections: ["header", "items", "footer"],
            },
        },
    ];
    const mockProcessingJob: ProcessingJobDetail = {
        id: jobId,
        fileName: "financial_report_q4_2024.pdf",
        fileSize: "2.4 MB",
        status: "completed",
        progress: 100,
        startedAt: "2024-01-15T10:30:00Z",
        completedAt: "2024-01-15T10:32:30Z",
        processingTime: 150,
        priority: "high",
        processingType: "full",
        userId: "user_123",
        retryCount: 0,
        extractedFields: 24,
        confidence: 94,
        totalPages: 12,
        processedPages: 12,
        extractionRecords: [
            {
                id: "1",
                fieldName: "Invoice Number",
                extractedValue: "INV-2024-001",
                confidence: 98,
                dataType: "text",
                sourceLocation: "Page 1, Header",
                timestamp: "2024-01-15T10:30:15Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "2",
                fieldName: "Total Amount",
                extractedValue: 2450.0,
                confidence: 96,
                dataType: "number",
                sourceLocation: "Page 1, Footer",
                timestamp: "2024-01-15T10:30:22Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "3",
                fieldName: "Due Date",
                extractedValue: "2024-02-15",
                confidence: 92,
                dataType: "date",
                sourceLocation: "Page 1, Body",
                timestamp: "2024-01-15T10:30:28Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "4",
                fieldName: "Customer Email",
                extractedValue: "billing@acme.com",
                confidence: 89,
                dataType: "text",
                sourceLocation: "Page 1, Header",
                timestamp: "2024-01-15T10:30:35Z",
                status: "success",
                validationStatus: "warning",
                notes: "Email format validation passed but domain verification pending",
            },
            {
                id: "5",
                fieldName: "Line Items",
                extractedValue: [
                    {
                        description: "Web Development",
                        quantity: 40,
                        rate: 50,
                        amount: 2000,
                    },
                    {
                        description: "Domain Registration",
                        quantity: 1,
                        rate: 15,
                        amount: 15,
                    },
                    {
                        description: "Hosting Services",
                        quantity: 1,
                        rate: 435,
                        amount: 435,
                    },
                ],
                confidence: 87,
                dataType: "array",
                sourceLocation: "Page 2-3, Table",
                timestamp: "2024-01-15T10:31:45Z",
                status: "partial",
                validationStatus: "warning",
                notes: "Some table cells had low OCR confidence",
            },
            {
                id: "6",
                fieldName: "Customer Name",
                extractedValue: "Acme Corporation",
                confidence: 95,
                dataType: "text",
                sourceLocation: "Page 1, Header",
                timestamp: "2024-01-15T10:30:18Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "7",
                fieldName: "Payment Terms",
                extractedValue: "Net 30",
                confidence: 91,
                dataType: "text",
                sourceLocation: "Page 1, Body",
                timestamp: "2024-01-15T10:30:42Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "8",
                fieldName: "Tax Rate",
                extractedValue: 8.25,
                confidence: 88,
                dataType: "number",
                sourceLocation: "Page 1, Footer",
                timestamp: "2024-01-15T10:31:12Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "9",
                fieldName: "Billing Address",
                extractedValue: "123 Main St, New York, NY 10001",
                confidence: 93,
                dataType: "text",
                sourceLocation: "Page 1, Header",
                timestamp: "2024-01-15T10:30:25Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "10",
                fieldName: "Currency",
                extractedValue: "USD",
                confidence: 99,
                dataType: "text",
                sourceLocation: "Page 1, Footer",
                timestamp: "2024-01-15T10:30:30Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "11",
                fieldName: "Subtotal",
                extractedValue: 2450.0,
                confidence: 97,
                dataType: "number",
                sourceLocation: "Page 1, Footer",
                timestamp: "2024-01-15T10:31:05Z",
                status: "success",
                validationStatus: "valid",
            },
            {
                id: "12",
                fieldName: "Tax Amount",
                extractedValue: 202.13,
                confidence: 94,
                dataType: "number",
                sourceLocation: "Page 1, Footer",
                timestamp: "2024-01-15T10:31:18Z",
                status: "success",
                validationStatus: "valid",
            },
        ],
        metadata: {
            originalFormat: "PDF",
            fileHash: "sha256:abc123def456...",
            uploadedBy: "john.doe@company.com",
            processingNode: "node-us-east-1",
            memoryUsed: "512 MB",
            cpuTime: "2.3 seconds",
        },
    };

    const parameters = {
        priority: "High",
        processingType: "full_document", // or "key_based"
        keywords: ["car", "engine", "1998"],
        description: "Find data about the car with model and other important details.",
        fields: [
            {
                fieldName: "name",
                description: "Name of the car",
                type: "text",
            },
            {
                fieldName: "year",
                description: "Manufacturing year",
                type: "number",
            },
            {
                fieldName: "engine_type",
                description: "Engine specification",
                type: "text",
            },
        ],
    };


    const mockCronJob: CronJobDetail = {
        id: jobId,
        name: "Daily Cleanup Process",
        description: "Removes temporary files and optimizes database performance",
        schedule: "0 2 * * *",
        nextRun: "2024-01-16T02:00:00Z",
        lastRun: "2024-01-15T02:00:00Z",
        status: "active",
        jobType: "cleanup",
        runCount: 365,
        successRate: 99.7,
        averageRunTime: 45,
        lastRunDuration: 42,
        executionHistory: [
            {
                id: "1",
                startTime: "2024-01-15T02:00:00Z",
                endTime: "2024-01-15T02:00:42Z",
                status: "success",
                duration: 42,
                output: "Cleaned 1,247 temporary files, optimized 3 database tables",
            },
            {
                id: "2",
                startTime: "2024-01-14T02:00:00Z",
                endTime: "2024-01-14T02:00:38Z",
                status: "success",
                duration: 38,
                output: "Cleaned 892 temporary files, optimized 2 database tables",
            },
            {
                id: "3",
                startTime: "2024-01-13T02:00:00Z",
                endTime: "2024-01-13T02:02:15Z",
                status: "failed",
                duration: 135,
                errorMessage: "Database connection timeout during optimization",
            },
            {
                id: "4",
                startTime: "2024-01-12T02:00:00Z",
                endTime: "2024-01-12T02:00:35Z",
                status: "success",
                duration: 35,
                output: "Cleaned 756 temporary files, optimized 1 database table",
            },
            {
                id: "5",
                startTime: "2024-01-11T02:00:00Z",
                endTime: "2024-01-11T02:00:41Z",
                status: "success",
                duration: 41,
                output: "Cleaned 1,103 temporary files, optimized 2 database tables",
            },
            {
                id: "6",
                startTime: "2024-01-10T02:00:00Z",
                endTime: "2024-01-10T02:00:39Z",
                status: "success",
                duration: 39,
                output: "Cleaned 934 temporary files, optimized 2 database tables",
            },
            {
                id: "7",
                startTime: "2024-01-09T02:00:00Z",
                endTime: "2024-01-09T02:00:44Z",
                status: "success",
                duration: 44,
                output: "Cleaned 1,567 temporary files, optimized 4 database tables",
            },
            {
                id: "8",
                startTime: "2024-01-08T02:00:00Z",
                endTime: "2024-01-08T02:01:23Z",
                status: "timeout",
                duration: 83,
                errorMessage: "Operation timed out during database optimization",
            },
        ],
        configuration: {
            timeout: 300,
            retryAttempts: 3,
            notifyOnFailure: true,
            environment: "production",
        },
    };

    const currentJob = jobType === "processing" ? mockProcessingJob : mockCronJob;
    const isProcessingJob = jobType === "processing";

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case "processing":
                return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
            case "completed":
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "failed":
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "paused":
                return <Pause className="h-4 w-4 text-gray-500" />;
            case "active":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "timeout":
                return <Clock className="h-4 w-4 text-orange-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "completed":
            case "success":
                return "bg-green-100 text-green-800";
            case "failed":
            case "error":
                return "bg-red-100 text-red-800";
            case "paused":
                return "bg-gray-100 text-gray-800";
            case "active":
                return "bg-green-100 text-green-800";
            case "partial":
                return "bg-yellow-100 text-yellow-800";
            case "valid":
                return "bg-green-100 text-green-800";
            case "warning":
                return "bg-yellow-100 text-yellow-800";
            case "timeout":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 95) return "text-green-600";
        if (confidence >= 85) return "text-yellow-600";
        return "text-red-600";
    };

    const filteredRecords = isProcessingJob
        ? (currentJob as ProcessingJobDetail).extractionRecords.filter((record) => {
            const matchesSearch =
                record.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(record.extractedValue)
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" || record.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        : [];

    const filteredHistory = !isProcessingJob
        ? (currentJob as CronJobDetail).executionHistory.filter((execution) => {
            const matchesSearch =
                execution.output?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                execution.errorMessage
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" || execution.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        : [];

    const handleSelectRecord = (recordId: string) => {
        setSelectedRecords((prev) =>
            prev.includes(recordId)
                ? prev.filter((id) => id !== recordId)
                : [...prev, recordId]
        );
    };

    const handleSelectAll = () => {
        const records = isProcessingJob ? filteredRecords : filteredHistory;
        if (selectedRecords.length === records.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(records.map((record) => record.id));
        }
    };

    const exportRecords = (format: "json" | "csv" | "xml") => {
        let dataToExport;
        let fileName;

        if (isProcessingJob) {
            const recordsToExport =
                selectedRecords.length > 0
                    ? filteredRecords.filter((record) =>
                        selectedRecords.includes(record.id)
                    )
                    : filteredRecords;
            dataToExport = recordsToExport;
            fileName = `extraction_records_${jobId}`;
        } else {
            const historyToExport =
                selectedRecords.length > 0
                    ? filteredHistory.filter((execution) =>
                        selectedRecords.includes(execution.id)
                    )
                    : filteredHistory;
            dataToExport = historyToExport;
            fileName = `execution_history_${jobId}`;
        }

        let content = "";
        let mimeType = "";
        let extension = "";

        switch (format) {
            case "json":
                content = JSON.stringify(dataToExport, null, 2);
                mimeType = "application/json";
                extension = "json";
                break;
            case "csv":
                if (isProcessingJob) {
                    const headers = [
                        "Field Name",
                        "Extracted Value",
                        "Confidence",
                        "Data Type",
                        "Source Location",
                        "Status",
                        "Validation",
                    ];
                    const rows = (dataToExport as ExtractionRecord[]).map((record) => [
                        record.fieldName,
                        typeof record.extractedValue === "object"
                            ? JSON.stringify(record.extractedValue)
                            : record.extractedValue,
                        record.confidence,
                        record.dataType,
                        record.sourceLocation,
                        record.status,
                        record.validationStatus,
                    ]);
                    content = [headers, ...rows].map((row) => row.join(",")).join("\n");
                } else {
                    const headers = [
                        "Start Time",
                        "End Time",
                        "Status",
                        "Duration",
                        "Output",
                        "Error Message",
                    ];
                    const rows = (dataToExport as any[]).map((execution) => [
                        execution.startTime,
                        execution.endTime,
                        execution.status,
                        execution.duration,
                        execution.output || "",
                        execution.errorMessage || "",
                    ]);
                    content = [headers, ...rows].map((row) => row.join(",")).join("\n");
                }
                mimeType = "text/csv";
                extension = "csv";
                break;
            case "xml":
                if (isProcessingJob) {
                    content = `<?xml version="1.0" encoding="UTF-8"?>\n<records>\n${(
                        dataToExport as ExtractionRecord[]
                    )
                        .map(
                            (record) =>
                                `  <record id="${record.id}">\n    <fieldName>${record.fieldName}</fieldName>\n    <extractedValue>${record.extractedValue}</extractedValue>\n    <confidence>${record.confidence}</confidence>\n    <dataType>${record.dataType}</dataType>\n    <sourceLocation>${record.sourceLocation}</sourceLocation>\n    <status>${record.status}</status>\n    <validationStatus>${record.validationStatus}</validationStatus>\n  </record>`
                        )
                        .join("\n")}\n</records>`;
                } else {
                    content = `<?xml version="1.0" encoding="UTF-8"?>\n<executions>\n${(
                        dataToExport as any[]
                    )
                        .map(
                            (execution) =>
                                `  <execution id="${execution.id}">\n    <startTime>${execution.startTime
                                }</startTime>\n    <endTime>${execution.endTime
                                }</endTime>\n    <status>${execution.status
                                }</status>\n    <duration>${execution.duration
                                }</duration>\n    <output>${execution.output || ""
                                }</output>\n    <errorMessage>${execution.errorMessage || ""
                                }</errorMessage>\n  </execution>`
                        )
                        .join("\n")}\n</executions>`;
                }
                mimeType = "application/xml";
                extension = "xml";
                break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportModal(false);
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
                setShowMetadata={setShowExportModal}
                showMetadata={showExportModal}
                onBack={onBack}
                resultShare={{ "jobType": jobType, "fileName": pageTitle, "fileId": jobId }}
            />


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Job Status Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="bg-indigo-100 p-3 rounded-xl">
                                    {isProcessingJob ? (
                                        <FileText className="h-8 w-8 text-indigo-600" />
                                    ) : (
                                        <Timer className="h-8 w-8 text-indigo-600" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {isProcessingJob
                                            ? (currentJob as ProcessingJobDetail).fileName
                                            : (currentJob as CronJobDetail).name}
                                    </h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            {getStatusIcon(currentJob.status)}
                                            <span className="capitalize">{currentJob.status}</span>
                                        </div>
                                        {isProcessingJob && (
                                            <>
                                                <div className="flex items-center space-x-1">
                                                    <Target className="h-4 w-4" />
                                                    <span>
                                                        {
                                                            (currentJob as ProcessingJobDetail)
                                                                .extractedFields
                                                        }{" "}
                                                        fields extracted
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Zap className="h-4 w-4" />
                                                    <span>
                                                        {(currentJob as ProcessingJobDetail).confidence}%
                                                        confidence
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {!isProcessingJob && (
                                            <>
                                                <div className="flex items-center space-x-1">
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span>
                                                        {(currentJob as CronJobDetail).successRate}% success
                                                        rate
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                        {(currentJob as CronJobDetail).runCount} total runs
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                    currentJob.status
                                )}`}
                            >
                                {getStatusIcon(currentJob.status)}
                                <span className="ml-1 capitalize">{currentJob.status}</span>
                            </span>
                        </div>

                        {/* Progress Bar for Processing Jobs */}
                        {isProcessingJob &&
                            (currentJob as ProcessingJobDetail).status === "processing" && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>
                                            Progress: {(currentJob as ProcessingJobDetail).progress}%
                                        </span>
                                        <span>
                                            Page {(currentJob as ProcessingJobDetail).processedPages}{" "}
                                            of {(currentJob as ProcessingJobDetail).totalPages}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(currentJob as ProcessingJobDetail).progress
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { key: "overview", label: "Overview" },
                                {
                                    key: "records",
                                    label: isProcessingJob
                                        ? "Extraction Records"
                                        : "Execution History",
                                },
                                { key: "raw", label: "Raw Data" },
                                { key: "structured", label: "Data Structure" },
                                { key: "preview", label: "Preview File" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                        ? "border-indigo-500 text-indigo-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {isProcessingJob ? (
                                        <>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <FileText className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        File Size
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as ProcessingJobDetail).fileSize}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {(currentJob as ProcessingJobDetail).totalPages} pages
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Clock className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Processing Time
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as ProcessingJobDetail).processingTime}s
                                                </p>
                                                <p className="text-sm text-gray-600">Completed</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Target className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Fields Extracted
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as ProcessingJobDetail).extractedFields}
                                                </p>
                                                <p className="text-sm text-gray-600">Total fields</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Zap className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Confidence
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as ProcessingJobDetail).confidence}%
                                                </p>
                                                <p className="text-sm text-gray-600">Average</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <BarChart3 className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Success Rate
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as CronJobDetail).successRate}%
                                                </p>
                                                <p className="text-sm text-gray-600">Overall</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Clock className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Avg Runtime
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as CronJobDetail).averageRunTime}s
                                                </p>
                                                <p className="text-sm text-gray-600">Average</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Activity className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Total Runs
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(currentJob as CronJobDetail).runCount}
                                                </p>
                                                <p className="text-sm text-gray-600">Executions</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Timer className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">
                                                        Next Run
                                                    </span>
                                                </div>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {new Date(
                                                        (currentJob as CronJobDetail).nextRun
                                                    ).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(
                                                        (currentJob as CronJobDetail).nextRun
                                                    ).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Metadata */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {isProcessingJob
                                            ? "Processing Details"
                                            : "Job Configuration"}
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {isProcessingJob ? (
                                                <>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Uploaded By:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as ProcessingJobDetail).metadata
                                                                    .uploadedBy
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Processing Node:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as ProcessingJobDetail).metadata
                                                                    .processingNode
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Memory Used:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as ProcessingJobDetail).metadata
                                                                    .memoryUsed
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            CPU Time:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as ProcessingJobDetail).metadata
                                                                    .cpuTime
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            File Hash:
                                                        </span>
                                                        <p className="text-gray-900 font-mono text-sm">
                                                            {
                                                                (currentJob as ProcessingJobDetail).metadata
                                                                    .fileHash
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Processing Type:
                                                        </span>
                                                        <p className="text-gray-900 capitalize">
                                                            {
                                                                (currentJob as ProcessingJobDetail)
                                                                    .processingType
                                                            }
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Schedule:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {(currentJob as CronJobDetail).schedule}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Environment:
                                                        </span>
                                                        <p className="text-gray-900 capitalize">
                                                            {
                                                                (currentJob as CronJobDetail).configuration
                                                                    .environment
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Timeout:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as CronJobDetail).configuration
                                                                    .timeout
                                                            }
                                                            s
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Retry Attempts:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {
                                                                (currentJob as CronJobDetail).configuration
                                                                    .retryAttempts
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Notify on Failure:
                                                        </span>
                                                        <p className="text-gray-900">
                                                            {(currentJob as CronJobDetail).configuration
                                                                .notifyOnFailure
                                                                ? "Yes"
                                                                : "No"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Job Type:
                                                        </span>
                                                        <p className="text-gray-900 capitalize">
                                                            {(currentJob as CronJobDetail).jobType.replace(
                                                                "_",
                                                                " "
                                                            )}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Parameters Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                                    <div className="overflow-x-auto mb-6">
                                        <table className="min-w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
                                            <thead className="bg-gray-100 text-gray-700 text-sm">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Field</th>
                                                    <th className="px-4 py-2 text-left">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-gray-900">
                                                <tr className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="px-4 py-3 font-medium">Priority</td>
                                                    <td className="px-4 py-3">{parameters.priority}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="px-4 py-3 font-medium">Processing Type</td>
                                                    <td className="px-4 py-3 capitalize">{parameters.processingType.replace("_", " ")}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="px-4 py-3 font-medium">Keywords</td>
                                                    <td className="px-4 py-3">{parameters.keywords?.join(", ") || "None"}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="px-4 py-3 font-medium">Description</td>
                                                    <td className="px-4 py-3">{parameters.description || "N/A"}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="px-4 py-3 font-medium">Fields</td>
                                                    <td className="px-4 py-3">
                                                        {parameters.fields.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {parameters.fields.map((field, index) => (
                                                                    <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded">
                                                                        <div className="font-semibold">{field.fieldName}</div>
                                                                        <div className="text-sm text-gray-600">{field.description}</div>
                                                                        <div className="text-xs text-gray-500 italic">{field.type}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            "No fields"
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === "records" && (
                            <div className="space-y-6">
                                {/* Filters and Search */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder={
                                                    isProcessingJob
                                                        ? "Search fields..."
                                                        : "Search executions..."
                                                }
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
                                            {isProcessingJob ? (
                                                <>
                                                    <option value="success">Success</option>
                                                    <option value="partial">Partial</option>
                                                    <option value="failed">Failed</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="success">Success</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="timeout">Timeout</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleSelectAll}
                                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            {selectedRecords.length ===
                                                (isProcessingJob ? filteredRecords : filteredHistory)
                                                    .length
                                                ? "Deselect All"
                                                : "Select All"}
                                        </button>
                                        <button
                                            onClick={() => setShowExportModal(true)}
                                            disabled={selectedRecords.length === 0}
                                            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span>Export Selected ({selectedRecords.length})</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Records Table */}

                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <ExpandableTable
                                        data={data}
                                        handleSelectAll={handleSelectAll}
                                        isProcessingJob={isProcessingJob}
                                        filteredRecords={filteredRecords}
                                        filteredHistory={filteredHistory}
                                        selectedRecords={selectedRecords}
                                    />
                                </div>
                            </div>
                        )}


                        {activeTab === "raw" && (
                            <div className="space-y-4">
                                <pre className="bg-gray-100 p-4 rounded-lg text-sm max-h-96 overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                        )}

                        {activeTab === "structured" && (
                            <PydanticSchemaViewer classStructure={class_structure} />
                        )}

                        {activeTab === "preview" && (
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
                            </div>)}


                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Export Data
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Choose the format to export{" "}
                            {selectedRecords.length > 0
                                ? `${selectedRecords.length} selected`
                                : "all"}{" "}
                            {isProcessingJob ? "records" : "executions"}.
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <button
                                onClick={() => exportRecords("json")}
                                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Database className="h-8 w-8 text-blue-600 mb-2" />
                                <span className="font-medium">JSON</span>
                            </button>
                            <button
                                onClick={() => exportRecords("csv")}
                                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FileText className="h-8 w-8 text-green-600 mb-2" />
                                <span className="font-medium">CSV</span>
                            </button>
                            <button
                                onClick={() => exportRecords("xml")}
                                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Building className="h-8 w-8 text-purple-600 mb-2" />
                                <span className="font-medium">XML</span>
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetailPage;
