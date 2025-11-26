"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, KeyboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({ 
  value, 
  onChange, 
  length = 6, 
  disabled = false,
  className 
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digits = inputValue.replace(/\D/g, '');
    
    if (digits.length > 1) {
      // Handle multiple digits (like paste or auto-fill)
      const newValue = Array(length).fill('');
      
      // Keep existing values before the current index
      for (let i = 0; i < index; i++) {
        newValue[i] = value[i] || '';
      }
      
      // Fill from current index with new digits
      for (let i = 0; i < digits.length && (index + i) < length; i++) {
        newValue[index + i] = digits[i];
      }
      
      // Keep remaining values after the filled portion
      for (let i = index + digits.length; i < length; i++) {
        newValue[i] = value[i] || '';
      }
      
      onChange(newValue.join(''));
      
      // Focus on the next empty input or last filled input
      const nextIndex = Math.min(index + digits.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
      return;
    }

    // Single digit input
    const newValue = value.split('');
    newValue[index] = digits;
    onChange(newValue.join(''));

    // Auto-advance to next input
    if (digits && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focusing
    inputRefs.current[index]?.select();
  };

  const handleSelect = (index: number) => {
    // When user selects text, prepare for replacement
    const input = inputRefs.current[index];
    if (input && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
      // Full selection - next input will replace
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits.length > 0) {
      // Create new value array
      const newValue = Array(length).fill('');
      
      // Fill from the current index
      for (let i = 0; i < digits.length && (index + i) < length; i++) {
        newValue[index + i] = digits[i];
      }
      
      // Keep existing values before the paste position
      for (let i = 0; i < index; i++) {
        newValue[i] = value[i] || '';
      }
      
      onChange(newValue.join(''));
      
      // Focus on the last filled input or next empty one
      const nextIndex = Math.min(index + digits.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
    }
  };

  return (
    <div className={cn("flex gap-2 sm:gap-3 justify-center px-2", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onSelect={() => handleSelect(index)}
          onPaste={(e) => handlePaste(index, e)}
          disabled={disabled}
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold",
            "border-2 rounded-lg sm:rounded-xl",
            "transition-all duration-300 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "hover:border-gray-400 hover:shadow-md",
            "touch-manipulation", // Improve touch responsiveness
            value[index] 
              ? "border-blue-500 bg-blue-50 shadow-sm" 
              : "border-gray-300 bg-white",
            disabled && "opacity-50 cursor-not-allowed bg-gray-100",
            "placeholder:text-gray-400",
            "transform-gpu" // Enable hardware acceleration
          )}
          placeholder="•"
        />
      ))}
    </div>
  );
}