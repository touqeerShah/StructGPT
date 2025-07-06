import { Listbox } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const priorities = [
  { name: 'Default', value: 'default', bg: 'bg-gray-100', text: 'text-gray-800' },
  { name: 'High', value: 'high', bg: 'bg-red-100', text: 'text-red-800' },
  { name: 'Medium', value: 'medium', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { name: 'Low', value: 'low', bg: 'bg-green-100', text: 'text-green-800' }
];

export default function PriorityDropdown() {
  const [selected, setSelected] = useState(priorities[0]);

  return (
    <div className="w-64">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className={`w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${selected.bg} ${selected.text}`}>
            {selected.name}
            <ChevronDown className="inline-block ml-2 h-4 w-4" />
          </Listbox.Button>
          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {priorities.map((priority) => (
              <Listbox.Option
                key={priority.value}
                value={priority}
                className={({ active }) =>
                  `cursor-pointer px-4 py-2  ${priority.text} ${active ? 'ring-1 ring-indigo-500' : ''}`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    <span>{priority.name}</span>
                    {selected && <Check className="h-4 w-4 text-indigo-600" />}
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}
