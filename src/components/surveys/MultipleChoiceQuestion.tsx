'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyQuestion {
  id: string;
  type: 'multiple_choice';
  question: string;
  required: boolean;
  options?: string[];
}

interface MultipleChoiceQuestionProps {
  question: SurveyQuestion;
  value: string | null;
  onChange: (value: string) => void;
}

export function MultipleChoiceQuestion({ question, value, onChange }: MultipleChoiceQuestionProps) {
  const options = question.options || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = value === option;

          return (
            <Button
              key={index}
              type="button"
              variant="outline"
              className={cn(
                "w-full text-left justify-start p-4 h-auto transition-all",
                isSelected
                  ? "bg-blue-50 border-blue-300 text-blue-900"
                  : "hover:bg-gray-50 hover:border-gray-300"
              )}
              onClick={() => onChange(option)}
            >
              <div className="flex items-center space-x-3">
                {isSelected ? (
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{option}</span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Current Selection Indicator */}
      {value && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Selected: {value}</span>
          </div>
        </div>
      )}
    </div>
  );
}