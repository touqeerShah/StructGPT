import React from 'react';

interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
  pattern?: string | null;
}

interface Props {
  classStructure: {
    class_name: string;
    class_struture: string;
  };
}

const parsePydanticClass = (code: string): ParsedField[] => {
  const lines = code
    .split('\n')
    .filter(line => line.includes(':') && !line.trim().startsWith('class'));

  return lines.map((line) => {
    const [rawName, rawType] = line.split(':');
    const name = rawName.trim();

    const isOptional = rawType.includes('Optional');
    const typeMatch = rawType.match(/Optional\[(\w+)\]|(\w+)/);
    const type = typeMatch ? (typeMatch[1] || typeMatch[2]) : 'unknown';

    const patternMatch = line.match(/pattern\s*=\s*r?[\'"](.+?)[\'"]/);
    const pattern = patternMatch ? patternMatch[1] : null;

    return { name, type, optional: isOptional, pattern };
  });
};

const toLabel = (snake: string) =>
  snake
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

const PydanticSchemaViewer: React.FC<Props> = ({ classStructure }) => {
  const fields = parsePydanticClass(classStructure.class_struture);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {classStructure.class_name}
      </h2>
      {fields.map((field) => (
        <div
          key={field.name}
          className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm hover:bg-gray-50"
        >
          <h3 className="font-semibold text-gray-800">{toLabel(field.name)}</h3>
          <p className="text-sm text-gray-600">Type: <strong>{field.type}</strong></p>
          {field.optional && (
            <p className="text-sm text-gray-400">This field is optional.</p>
          )}
          {field.pattern && (
            <p className="text-sm text-blue-600">Regex: <code>{field.pattern}</code></p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PydanticSchemaViewer;
