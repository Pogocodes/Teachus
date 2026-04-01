import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SkillInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions: string[];
}

export function SkillInput({ placeholder, tags, setTags, suggestions }: SkillInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter suggestions when user types (case insensitive)
    if (inputValue.trim().length > 0) {
      const lowercasedInput = inputValue.toLowerCase();
      const filtered = suggestions.filter(
        (s) => 
          s.toLowerCase().includes(lowercasedInput) && 
          !tags.some((t) => t.toLowerCase() === s.toLowerCase()) // don't show already selected tags
      );
      setFilteredSuggestions(filtered);
      setIsDropdownOpen(true);
      setHighlightedIndex(-1); // reset selection
    } else {
      setFilteredSuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [inputValue, suggestions, tags]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isDropdownOpen && filteredSuggestions.length > 0) {
        setHighlightedIndex((prev) => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isDropdownOpen && filteredSuggestions.length > 0) {
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      
      if (isDropdownOpen && highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        // User selected a suggestion using keyboard
        addTag(filteredSuggestions[highlightedIndex]);
      } else {
        // User is adding custom skill
        const newTag = inputValue.trim();
        if (newTag) {
          addTag(newTag);
        }
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // remove last tag on backspace if input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const normalized = tag.trim();
    if (normalized && !tags.some(t => t.toLowerCase() === normalized.toLowerCase())) {
      setTags([...tags, normalized]);
    }
    setInputValue("");
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      <div className="flex flex-wrap gap-2 min-h-[46px] p-2 border rounded-md shadow-sm bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-3 py-1.5 text-sm bg-primary/10 text-primary border-none flex items-center gap-1.5 transition-transform hover:scale-105">
            {tag}
            <X 
              className="h-3.5 w-3.5 cursor-pointer text-slate-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors" 
              onClick={() => removeTag(tag)} 
            />
          </Badge>
        ))}
        <Input
          type="text"
          placeholder={tags.length === 0 ? (placeholder || "Type a skill...") : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim().length > 0) setIsDropdownOpen(true);
          }}
          className="border-none shadow-none focus-visible:ring-0 w-full p-0 h-8 font-normal bg-transparent flex-1 min-w-[120px]"
        />
      </div>

      {isDropdownOpen && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg outline-none">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center ${
                index === highlightedIndex ? "bg-primary/10 text-primary font-medium" : "hover:bg-slate-50 text-slate-700"
              }`}
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      
      {isDropdownOpen && filteredSuggestions.length === 0 && inputValue.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 p-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-md shadow-lg">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border text-slate-600 text-xs mx-1">Enter</kbd> to add "{inputValue.trim()}" as a custom skill
        </div>
      )}
    </div>
  );
}
