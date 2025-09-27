'use client';

import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyQuestion {
  id: string;
  type: 'rating';
  question: string;
  required: boolean;
  scale?: { min: number; max: number; labels?: string[] };
}

interface RatingQuestionProps {
  question: SurveyQuestion;
  value: number | null;
  onChange: (value: number) => void;
}

export function RatingQuestion({ question, value, onChange }: RatingQuestionProps) {
  const scale = question.scale || { min: 1, max: 5 };
  const range = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Rating Scale */}
        <div className="flex items-center justify-center space-x-2">
          {range.map((rating) => (
            <Button
              key={rating}
              type="button"
              variant={value === rating ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-12 h-12 rounded-full text-lg font-medium transition-all",
                value === rating
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "hover:bg-blue-50 hover:border-blue-300"
              )}
              onClick={() => onChange(rating)}
            >
              {rating}
            </Button>
          ))}
        </div>

        {/* Scale Labels */}
        {scale.labels && (
          <div className="flex justify-between text-sm text-gray-600 px-6">
            <span>{scale.labels[0]}</span>
            {scale.labels.length > 2 && (
              <span className="text-center">{scale.labels[Math.floor(scale.labels.length / 2)]}</span>
            )}
            <span>{scale.labels[scale.labels.length - 1]}</span>
          </div>
        )}

        {/* Current Selection */}
        {value !== null && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              <Star className="h-4 w-4 fill-current" />
              <span>You rated: {value} out of {scale.max}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}