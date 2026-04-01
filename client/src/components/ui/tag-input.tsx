import React, { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ placeholder, tags, setTags, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      setTags([...tags, suggestion]);
    }
    setInputValue("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm bg-blue-100 text-primary border-none flex items-center gap-1 transition-transform hover:scale-105">
            {tag}
            <X className="h-3 w-3 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
        <Input
          type="text"
          placeholder={tags.length === 0 ? (placeholder || "Type and press Enter or comma...") : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-none shadow-none focus-visible:ring-0 w-full p-0 h-8 font-normal"
        />
      </div>
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter(s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()))
              .slice(0, 10)
              .map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="px-2 py-0.5 text-xs cursor-pointer hover:bg-slate-100 hover:border-primary/50 text-slate-600 transition-colors"
                onClick={() => addSuggestion(suggestion)}
              >
                + {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
