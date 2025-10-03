"use client";

import { useState } from "react";

import { Button } from "./Button";
import { Input } from "./Input";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  suggestionLabel?: string;
  maxSuggestions?: number;
}

export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
  suggestionLabel = "Suggestions",
  maxSuggestions = 12
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  };

  const addFromSuggestion = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-200">{label}</span>
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
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" onClick={addTag} variant="secondary">
          Add
        </Button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{suggestionLabel}</span>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((value) => value && !values.includes(value))
              .slice(0, maxSuggestions)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addFromSuggestion(suggestion)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
