'use client';

import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  type: 'text';
  question: string;
  required: boolean;
}

interface TextQuestionProps {
  question: SurveyQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function TextQuestion({ question, value, onChange }: TextQuestionProps) {
  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>

      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your response here..."
          className="min-h-[120px] resize-none"
          required={question.required}
        />

        {/* Character/Word Count */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>
              {wordCount} word{wordCount !== 1 ? 's' : ''}, {charCount} character{charCount !== 1 ? 's' : ''}
            </span>
          </div>

          {value.length > 0 && (
            <span className="text-green-600">
              ✓ Response provided
            </span>
          )}
        </div>

        {/* Helpful hint for optional questions */}
        {!question.required && value.length === 0 && (
          <div className="text-xs text-gray-400 italic">
            This question is optional - you can skip it if you prefer
          </div>
        )}
      </div>
    </div>
  );
}