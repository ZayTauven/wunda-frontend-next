"use client";

import Icon from "./Icon";

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface SegmentedProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

export default function Segmented({ options, value, onChange }: SegmentedProps) {
  return (
    <div className="wd-seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={`wd-seg-btn${value === o.value ? " on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={14} stroke={2.2} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
