"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions?: string[];
  className?: string;
}

export function TagInput({
  tags,
  setTags,
  suggestions = [],
  className,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(suggestion)
    )
    .slice(0, 5);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        addTag(filteredSuggestions[activeIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1.5"
          >
            {tag}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            />
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking them
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-[200px] w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-sm",
                activeIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 