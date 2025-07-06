// pages/EditJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";

import FieldTypeSelector from '../components/FieldTypeSelector';
import PriorityDropdown from '../components/PriorityDropdown';
import { Plus, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
interface EditJobPageProps {
    onLogout: () => void;
}

const EditJobPage: React.FC<EditJobPageProps> = ({ onLogout }) => {

    const jobData = {
        id: 'job123',
        priority: 'high',
        processingType: 'keywords',
        keywords: ['invoice', 'amount', 'date'],
        description: 'Extract invoice-related fields for reconciliation.',
        fields: [
            { id: 'f1', name: 'Invoice Number', description: 'Unique invoice number', type: 'text' },
            { id: 'f2', name: 'Amount', description: 'Total amount on invoice', type: 'number' },
            { id: 'f3', name: 'Due Date', description: 'Invoice due date', type: 'date' },
        ]
    };
    const location = useLocation();

    const {
        user,
        isAuthenticated,
        pageTitle,
        subTitle,        
        onBack,
    } = location.state;
    const [priority, setPriority] = useState(jobData.priority || 'default');
    const [keywords, setKeywords] = useState(jobData.keywords || []);
    const [description, setDescription] = useState(jobData.description || '');
    const [processingMode, setProcessingMode] = useState(jobData.processingType || 'full');
    const [extractFields, setExtractFields] = useState(jobData.fields || []);
    const [newKeyword, setNewKeyword] = useState('');
    const [newField, setNewField] = useState({ name: '', description: '', type: 'text' });
    const { id } = useParams();

    // Example usage
    React.useEffect(() => {
        if (id) {
            // fetch job details by ID here
            console.log("Editing job with ID:", id);
        }
    }, [id]);

    const handleUpdateJob = (updatedData: any) => {
        console.log('Updated job config:', updatedData);

        // Example: send to API
        // await fetch(`/api/jobs/${sampleJobData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(updatedData),
        // });

        // Optionally, show confirmation or redirect
    };
    const addKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            setKeywords(prev => [...prev, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const removeKeyword = (k: string) => {
        setKeywords(prev => prev.filter(x => x !== k));
    };

    const addField = () => {
        if (newField.name.trim()) {
            setExtractFields(prev => [
                ...prev,
                { id: Math.random().toString(36).substr(2, 9), ...newField }
            ]);
            setNewField({ name: '', description: '', type: 'text' });
        }
    };

    const removeField = (id: string) => {
        setExtractFields(prev => prev.filter(f => f.id !== id));
    };

    const handleUpdate = () => {
        handleUpdateJob({
            priority,
            keywords,
            description,
            processingType: processingMode,
            fields: extractFields,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">

            <TopNav
                user={user}
                isAuthenticated={isAuthenticated}
                onLogout={onLogout}
                pageTitle={pageTitle}
                subTitle={subTitle}
                page={"edit"}
                onBack={onBack}
            />
<div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-white rounded-lg shadow border">

                <h2 className="text-xl font-bold text-gray-800">Edit Job Configuration</h2>

                <PriorityDropdown value={priority} onChange={setPriority} />

                <div>
                    <label className="block mb-2 font-medium text-gray-700">Processing Type</label>
                    <select
                        value={processingMode}
                        onChange={e => setProcessingMode(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="full">Full Document</option>
                        <option value="keywords">Keyword-based</option>
                        <option value="sections">Specific Sections</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">Keywords</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {keywords.map(k => (
                            <span key={k} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center">
                                {k}
                                <button onClick={() => removeKeyword(k)} className="ml-2">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            placeholder="Add keyword..."
                            className="flex-1 border px-3 py-2 rounded"
                        />
                        <button onClick={addKeyword} className="px-3 py-2 bg-indigo-600 text-white rounded">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">Output Fields</label>
                    {extractFields.length > 0 && (
                        <table className="w-full mb-3 border">
                            <thead className="bg-gray-100 text-sm">
                                <tr>
                                    <th className="text-left px-3 py-2">Field Name</th>
                                    <th className="text-left px-3 py-2">Type</th>
                                    <th className="text-left px-3 py-2">Description</th>
                                    <th className="text-left px-3 py-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractFields.map(f => (
                                    <tr key={f.id}>
                                        <td className="px-3 py-2">{f.name}</td>
                                        <td className="px-3 py-2">{f.type}</td>
                                        <td className="px-3 py-2">{f.description}</td>
                                        <td className="text-right px-3 py-2">
                                            <button onClick={() => removeField(f.id)} className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            value={newField.name}
                            onChange={e => setNewField(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Field name"
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            value={newField.description}
                            onChange={e => setNewField(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description"
                            className="border px-3 py-2 rounded"
                        />
                        <FieldTypeSelector value={newField.type} onChange={t => setNewField(prev => ({ ...prev, type: t }))} />
                        <button onClick={addField} className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        className="w-full border px-4 py-2 rounded"
                    />
                </div>

                <div className="text-center">
                    <button
                        onClick={handleUpdate}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditJobPage;
