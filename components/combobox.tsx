'use client';

import { useMemo, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string | null;
  onChange: (opt: Option | null) => void;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  badgeFor?: (opt: Option) => string | undefined;
};

export default function ComboBox({
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  clearable = true,
  className = '',
  badgeFor,
}: Props) {
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  const filteredOptions = useMemo(
    () =>
      query === ''
        ? options
        : options.filter((opt) =>
            opt.label
              .toLowerCase()
              .replace(/\s+/g, '')
              .includes(query.toLowerCase().replace(/\s+/g, '')),
          ),
    [options, query],
  );

  return (
    <div className={`relative ${className}`}>
      <Combobox value={selectedOption} onChange={onChange}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-xl border bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-neutral-900 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-900 focus:ring-0 rounded-xl"
              displayValue={(opt: Option) => opt?.label || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-neutral-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {clearable && (
              <Combobox.Option value={null}>
                {({ active }) => (
                  <div
                    className={`relative cursor-default select-none py-2 pl-10 pr-4 text-sm ${
                      active ? 'bg-blue-600 text-white' : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    Clear
                  </div>
                )}
              </Combobox.Option>
            )}
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-neutral-700">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <Combobox.Option
                  key={opt.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-600 text-white' : 'text-neutral-900 dark:text-neutral-100'
                    }`
                  }
                  value={opt}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {opt.label}
                        {badgeFor && badgeFor(opt) && (
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              active
                                ? 'bg-white text-blue-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {badgeFor(opt)}
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-blue-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}