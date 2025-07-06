import React, { useState } from "react";
import { Eye, Copy } from "lucide-react";

const ExpandableTable = ({
    data,
    handleSelectAll,
    isProcessingJob,
    filteredRecords,
    filteredHistory,
    selectedRecords
}: {
    data: any[];
    handleSelectAll: any;
    isProcessingJob: any;
    filteredRecords: any;
    filteredHistory: any;
    selectedRecords: any;
}) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [viewJson, setViewJson] = useState<any | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const renderValue = (value: any) => {
        if (Array.isArray(value)) {
            Ì;
            if (value.length === 0) return "[]";
            if (typeof value[0] === "object") {
                return <NestedTable data={value} />;
            } else {
                return value.join(", ");
            }
        } else if (typeof value === "object" && value !== null) {
            return <NestedTable data={[value]} />;
        } else {
            return String(value);
        }
    };

    const handleCopy = (row: any) => {
        navigator.clipboard.writeText(JSON.stringify(row, null, 2));
        alert("Copied to clipboard!");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Modal */}
            {viewJson && (
                <div className="fixed inset-0 bg-gray-50 bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl relative">
                        <button
                            onClick={() => setViewJson(null)}
                            className="absolute top-2 right-2 text-white hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg text-white font-semibold mb-4">
                            JSON View
                        </h2>
                        <pre className="text-sm bg-white dark:bg-white p-4 rounded whitespace-pre-wrap">
                            {JSON.stringify(viewJson, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2">
                            <input
                                type="checkbox"
                                onChange={handleSelectAll}
                                checked={
                                    selectedRecords.length ===
                                    (isProcessingJob ? filteredRecords : filteredHistory)
                                        .length &&
                                    (isProcessingJob ? filteredRecords : filteredHistory)
                                        .length > 0
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                        </th>
                        {data.length > 0 &&
                            Object.keys(data[0]).map((key) => (
                                <th
                                    key={key}
                                    className="px-4 py-2 text-left font-semibold text-gray-600"
                                >
                                    {formatHeading(key)}
                                </th>
                            ))}
                        <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {data.map((row, index) => (
                        <React.Fragment key={row.id || index}>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={
                                            selectedRecords.length ===
                                            (isProcessingJob ? filteredRecords : filteredHistory)
                                                .length &&
                                            (isProcessingJob ? filteredRecords : filteredHistory)
                                                .length > 0
                                        }
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </td>
                                {Object.entries(row).map(([key, value]) => (
                                    <td key={key} className="px-4 py-2 align-top">
                                        {typeof value === "object" ? (
                                            <button
                                                onClick={() => toggleRow(`${row.id}_${key}`)}
                                                className="text-blue-600 underline hover:text-blue-800"
                                            >
                                                {expandedRows[`${row.id}_${key}`] ? "Hide" : "Show"}{" "}
                                                {key}
                                            </button>
                                        ) : (
                                            String(value)
                                        )}
                                    </td>
                                ))}
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => setViewJson(row)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(row)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>

                            {/* Expandable nested rows */}
                            {Object.entries(row).map(
                                ([key, value]) =>
                                    expandedRows[`${row.id}_${key}`] &&
                                    typeof value === "object" && (
                                        <tr key={`${row.id}_${key}_nested`}>
                                            <td
                                                colSpan={Object.keys(row).length + 2}
                                                className="bg-gray-50 px-6 py-4"
                                            >
                                                {renderValue(value)}
                                            </td>
                                        </tr>
                                    )
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
const formatHeading = (key: string) => {
    return key
        .replace(/_/g, " ") // snake_case → space
        .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → space before capital
        .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
};
const NestedTable = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return <div>No nested data</div>;
    const headers = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border mt-2 text-xs">
                <thead className="bg-gray-100">
                    <tr>
                        {headers.map((key) => (
                            <th
                                key={key}
                                className="px-3 py-2 text-left font-medium text-gray-700 border-b"
                            >
                                {formatHeading(key)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            {headers.map((key) => (
                                <td key={key} className="px-3 py-2 border-b">
                                    {typeof row[key] === "object"
                                        ? JSON.stringify(row[key])
                                        : String(row[key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExpandableTable;
