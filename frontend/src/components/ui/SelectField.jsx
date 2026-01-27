import React from "react";

/**
 * SelectField
 * Props:
 *  - icon: Icon component (lucide-react or similar)
 *  - label: string (rendered as label)
 *  - name: string (id/name)
 *  - options: array of strings or { value, label } objects
 *  - placeholder: optional string shown as disabled first option
 *  - value, onChange, ...props passed to <select>
 */
const SelectField = ({ icon: Icon, label, name, options = [], placeholder, value, onChange, ...props }) => {
  const id = name || props.id || undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Icon className="w-4 h-4 text-gray-400" aria-hidden />
          </div>
        )}

        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          {...props}
          className={`w-full h-11 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all appearance-none ${Icon ? "pl-10" : ""} pr-10`}
          aria-label={label || name}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {options.map((option) => {
            const optValue = option && typeof option === "object" ? option.value : option;
            const optLabel = option && typeof option === "object" ? option.label : option;
            return (
              <option key={String(optValue)} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SelectField;
