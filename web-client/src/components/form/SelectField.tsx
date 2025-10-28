import React from "react";
import Select from "react-select";

interface SelectFieldProps {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
}: SelectFieldProps) {
  // Transform options for react-select
  const selectOptions = [
    { value: "", label: "Wybierz opcję..." },
    ...options.map(option => ({ value: option, label: option }))
  ];

  const selectedOption = selectOptions.find(option => option.value === value) || null;

  // Custom styles to match your existing design
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '42px',
      border: state.isFocused ? '2px solid #f97316' : '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 1px #f97316' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '&:hover': {
        border: state.isFocused ? '2px solid #f97316' : '1px solid #d1d5db'
      },
      padding: '0 4px',
      backgroundColor: 'white',
      touchAction: 'pan-y',  // Only allow vertical scrolling
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#6b7280'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#fed7aa' 
        : state.isFocused 
        ? '#ffedd5' 
        : 'white',
      color: state.isSelected ? '#ea580c' : '#111827',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#ffedd5'
      }
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999
    })
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Hidden input for form compatibility */}
      <input type="hidden" name={name} value={value} />
      
      <Select
        options={selectOptions}
        value={selectedOption}
        onChange={(option) => onChange(option?.value || "")}
        placeholder="Wybierz opcję..."
        isSearchable={false}
        styles={customStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        classNamePrefix="react-select"
      />
    </div>
  );
}
