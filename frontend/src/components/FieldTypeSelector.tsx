import { Listbox } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { useState, Fragment } from 'react'

const types = [
  { name: 'Text', value: 'text', color: 'text-blue-600' },
  { name: 'Number', value: 'number', color: 'text-green-600' },
  { name: 'Date', value: 'date', color: 'text-purple-600' },
  { name: 'Boolean', value: 'boolean', color: 'text-yellow-600' },
  { name: 'Array', value: 'array', color: 'text-red-600' },
]

export default function FieldTypeSelector() {
  const [selected, setSelected] = useState(types[0])

  return (
    <div className="w-50">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <span className={`block truncate ${selected.color}`}>{selected.name}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </span>
          </Listbox.Button>
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
            {types.map((type) => (
              <Listbox.Option
                key={type.value}
                value={type}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${type.color}`}>{type.name}</span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  )
}
