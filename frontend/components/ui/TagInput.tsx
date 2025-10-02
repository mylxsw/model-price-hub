"use client";

import { useState } from "react";

import { Button } from "./Button";
import { Input } from "./Input";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {tag}
            <button className="text-slate-500 transition hover:text-primary dark:text-slate-400" onClick={() => removeTag(index)} type="button">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className="flex-1" />
        <Button type="button" onClick={addTag} variant="secondary">
          Add
        </Button>
      </div>
    </div>
  );
}
