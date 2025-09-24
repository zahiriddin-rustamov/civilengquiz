'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileQuestion, CheckCircle, Edit3, Calculator, Shuffle } from 'lucide-react';
import { ImageUrlInput } from '@/components/ui/image-url-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SettingsSection } from '@/components/admin/SettingsSection';
import { ISubject, ITopic } from '@/models/database';
import { v4 as uuidv4 } from 'uuid';

interface QuestionData {
  topicId: string;
  sectionId: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  text: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  data: any;
  explanation?: string;
}

const questionTypes = [
  {
    id: 'multiple-choice',
    label: 'Multiple Choice',
    icon: CheckCircle,
    description: '4+ options with one correct answer'
  },
  {
    id: 'true-false',
    label: 'True/False',
    icon: CheckCircle,
    description: 'Simple true or false question'
  },
  {
    id: 'fill-in-blank',
    label: 'Fill in Blank',
    icon: Edit3,
    description: 'Students fill in missing words'
  },
  {
    id: 'numerical',
    label: 'Numerical',
    icon: Calculator,
    description: 'Answer with a number or calculation'
  },
  {
    id: 'matching',
    label: 'Matching',
    icon: Shuffle,
    description: 'Match terms with definitions'
  }
];

export default function NewQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuestionData>({
    topicId: '',
    sectionId: '',
    type: 'multiple-choice',
    text: '',
    imageUrl: '',
    difficulty: 'Beginner',
    xpReward: 5,
    estimatedMinutes: 1,
    data: {},
    explanation: ''
  });

  // Type-specific data states
  const [multipleChoiceData, setMultipleChoiceData] = useState({
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const [trueFalseData, setTrueFalseData] = useState({
    correctAnswer: true
  });

  const [fillInBlankData, setFillInBlankData] = useState({
    blanks: [{
      id: uuidv4(),
      correctAnswers: [''],
      caseSensitive: false
    }]
  });

  const [numericalData, setNumericalData] = useState({
    correctAnswer: 0,
    tolerance: 0.01,
    unit: '',
    formula: ''
  });

  const [matchingData, setMatchingData] = useState({
    pairs: [
      { id: uuidv4(), left: '', right: '' },
      { id: uuidv4(), left: '', right: '' }
    ]
  });

  useEffect(() => {
    fetchSubjects();

    // Pre-select topic if provided in URL
    const topicId = searchParams?.get('topicId');
    const sectionId = searchParams?.get('sectionId');

    if (topicId) {
      // Don't set formData.topicId here - let fetchTopicAndSubject do it after topics are loaded
      fetchTopicAndSubject(topicId);
    }

    if (sectionId) {
      setFormData(prev => ({ ...prev, sectionId }));
    }
  }, [searchParams]);

  // Fetch sections when topic changes
  useEffect(() => {
    if (formData.topicId) {
      fetchSectionsForTopic(formData.topicId);
    } else {
      setSections([]);
      setFormData(prev => ({ ...prev, sectionId: '' }));
    }
  }, [formData.topicId]);

  // Update XP and time estimates when difficulty or type changes
  useEffect(() => {
    const newXpReward = getDefaultXpReward(formData.difficulty, formData.type);
    const newEstimatedMinutes = getDefaultEstimatedMinutes(formData.type);

    setFormData(prev => ({
      ...prev,
      xpReward: newXpReward,
      estimatedMinutes: newEstimatedMinutes
    }));
  }, [formData.difficulty, formData.type]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchTopicsForSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
        setFormData(prev => ({ ...prev, topicId: '' }));
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchTopicAndSubject = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}`);
      if (response.ok) {
        const topic = await response.json();
        setSelectedSubject(topic.subjectId.toString());
        const subjectResponse = await fetch(`/api/subjects/${topic.subjectId}/topics`);
        if (subjectResponse.ok) {
          const topicsData = await subjectResponse.json();
          setTopics(topicsData);

          // Re-set the topic selection AFTER topics are loaded to ensure it appears in dropdown
          setFormData(prev => ({ ...prev, topicId }));
        }
      }
    } catch (err) {
      console.error('Error fetching topic and subject:', err);
    }
  };

  const fetchSectionsForTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/sections?topicId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    fetchTopicsForSubject(subjectId);
  };

  const handleQuestionTypeChange = (newType: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching') => {
    setFormData(prev => ({ ...prev, type: newType }));

    // Reset type-specific data
    switch (newType) {
      case 'multiple-choice':
        setMultipleChoiceData({ options: ['', '', '', ''], correctAnswer: 0 });
        break;
      case 'true-false':
        setTrueFalseData({ correctAnswer: true });
        break;
      case 'fill-in-blank':
        setFillInBlankData({
          blanks: [{ id: uuidv4(), correctAnswers: [''], caseSensitive: false }]
        });
        break;
      case 'numerical':
        setNumericalData({ correctAnswer: 0, tolerance: 0.01, unit: '', formula: '' });
        break;
      case 'matching':
        setMatchingData({
          pairs: [
            { id: uuidv4(), left: '', right: '' },
            { id: uuidv4(), left: '', right: '' }
          ]
        });
        break;
    }
  };

  const getDefaultXpReward = (difficulty: string, type: string): number => {
    const basePoints = {
      'multiple-choice': 5,
      'true-false': 3,
      'fill-in-blank': 7,
      'numerical': 8,
      'matching': 6
    };

    const difficultyMultiplier = {
      'Beginner': 1,
      'Intermediate': 1.5,
      'Advanced': 2
    };

    const base = basePoints[type as keyof typeof basePoints] || 5;
    const multiplier = difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1;

    return Math.round(base * multiplier);
  };

  const getDefaultEstimatedMinutes = (type: string): number => {
    const timeEstimates = {
      'multiple-choice': 1,
      'true-false': 0.5,
      'fill-in-blank': 2,
      'numerical': 3,
      'matching': 2
    };

    return timeEstimates[type as keyof typeof timeEstimates] || 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topicId || !formData.sectionId || !formData.text.trim()) {
      setError('Please fill in all required fields including topic and section');
      return;
    }

    // Prepare question data based on type
    let questionData = { ...formData };
    switch (formData.type) {
      case 'multiple-choice':
        if (multipleChoiceData.options.some(opt => !opt.trim())) {
          setError('All options must be filled');
          return;
        }
        questionData.data = multipleChoiceData;
        break;
      case 'true-false':
        questionData.data = trueFalseData;
        break;
      case 'fill-in-blank':
        if (fillInBlankData.blanks.some(blank => !blank.correctAnswers[0]?.trim())) {
          setError('All blanks must have at least one correct answer');
          return;
        }
        // Validate that question text contains blank markers
        const blankMarkers = /___+|\{blank\}/gi;
        const markersInText = formData.text.match(blankMarkers);
        const markerCount = markersInText ? markersInText.length : 0;

        if (markerCount === 0) {
          setError('Fill-in-blank questions must contain blank markers (_____ or {blank}) in the question text');
          return;
        }

        if (markerCount !== fillInBlankData.blanks.length) {
          setError(`Number of blank markers in question text (${markerCount}) must match number of configured blanks (${fillInBlankData.blanks.length})`);
          return;
        }

        questionData.data = fillInBlankData;
        break;
      case 'numerical':
        if (isNaN(numericalData.correctAnswer)) {
          setError('Correct answer must be a valid number');
          return;
        }
        questionData.data = numericalData;
        break;
      case 'matching':
        if (matchingData.pairs.some(pair => !pair.left.trim() || !pair.right.trim())) {
          setError('All matching pairs must be filled');
          return;
        }
        questionData.data = matchingData;
        break;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create question');
      }

      router.push('/admin/questions');
    } catch (err) {
      console.error('Error creating question:', err);
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestionTypeConfig = () => {
    switch (formData.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <Label>Answer Options</Label>
            {multipleChoiceData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={multipleChoiceData.correctAnswer === index}
                  onChange={() => setMultipleChoiceData(prev => ({ ...prev, correctAnswer: index }))}
                  className="w-4 h-4 text-indigo-600"
                />
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...multipleChoiceData.options];
                    newOptions[index] = e.target.value;
                    setMultipleChoiceData(prev => ({ ...prev, options: newOptions }));
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                {multipleChoiceData.correctAnswer === index && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Correct</Badge>
                )}
                {multipleChoiceData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = multipleChoiceData.options.filter((_, i) => i !== index);
                      const newCorrectAnswer = multipleChoiceData.correctAnswer >= index
                        ? Math.max(0, multipleChoiceData.correctAnswer - 1)
                        : multipleChoiceData.correctAnswer;
                      setMultipleChoiceData({ options: newOptions, correctAnswer: newCorrectAnswer });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (multipleChoiceData.options.length < 6) {
                  setMultipleChoiceData(prev => ({
                    ...prev,
                    options: [...prev.options, '']
                  }));
                }
              }}
              disabled={multipleChoiceData.options.length >= 6}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <Label>Correct Answer</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTrueFalseData({ correctAnswer: true })}
                className={`
                  flex items-center justify-center px-4 py-2 rounded-md border transition-all text-sm
                  ${trueFalseData.correctAnswer === true
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                True
              </button>
              <button
                type="button"
                onClick={() => setTrueFalseData({ correctAnswer: false })}
                className={`
                  flex items-center justify-center px-4 py-2 rounded-md border transition-all text-sm
                  ${trueFalseData.correctAnswer === false
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                False
              </button>
            </div>
          </div>
        );

      case 'fill-in-blank':
        return (
          <div className="space-y-4">
            <div>
              <Label>Blanks Configuration</Label>
              <p className="text-sm text-gray-600 mt-1">
                Use _____ or {'{blank}'} in your question text to mark where blanks should appear.
              </p>
            </div>
            {fillInBlankData.blanks.map((blank, blankIndex) => (
              <Card key={blank.id}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Blank {blankIndex + 1}</Label>
                      {fillInBlankData.blanks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFillInBlankData(prev => ({
                              blanks: prev.blanks.filter(b => b.id !== blank.id)
                            }));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {blank.correctAnswers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex space-x-2">
                        <Input
                          value={answer}
                          onChange={(e) => {
                            const newBlanks = [...fillInBlankData.blanks];
                            newBlanks[blankIndex].correctAnswers[answerIndex] = e.target.value;
                            setFillInBlankData({ blanks: newBlanks });
                          }}
                          placeholder="Correct answer"
                          className="flex-1"
                        />
                        {blank.correctAnswers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newBlanks = [...fillInBlankData.blanks];
                              newBlanks[blankIndex].correctAnswers.splice(answerIndex, 1);
                              setFillInBlankData({ blanks: newBlanks });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newBlanks = [...fillInBlankData.blanks];
                          newBlanks[blankIndex].correctAnswers.push('');
                          setFillInBlankData({ blanks: newBlanks });
                        }}
                      >
                        Add Alternative Answer
                      </Button>
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          checked={blank.caseSensitive}
                          onCheckedChange={(checked) => {
                            const newBlanks = [...fillInBlankData.blanks];
                            newBlanks[blankIndex].caseSensitive = !!checked;
                            setFillInBlankData({ blanks: newBlanks });
                          }}
                        />
                        <span className="text-sm">Case sensitive</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFillInBlankData(prev => ({
                  blanks: [...prev.blanks, {
                    id: uuidv4(),
                    correctAnswers: [''],
                    caseSensitive: false
                  }]
                }));
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Blank
            </Button>
          </div>
        );

      case 'numerical':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Input
                  id="correctAnswer"
                  type="number"
                  step="any"
                  value={numericalData.correctAnswer}
                  onChange={(e) => setNumericalData(prev => ({
                    ...prev,
                    correctAnswer: parseFloat(e.target.value) || 0
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tolerance">Tolerance (0.01 = 1%)</Label>
                <Input
                  id="tolerance"
                  type="number"
                  step="0.001"
                  min="0"
                  value={numericalData.tolerance}
                  onChange={(e) => setNumericalData(prev => ({
                    ...prev,
                    tolerance: parseFloat(e.target.value) || 0.01
                  }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input
                id="unit"
                value={numericalData.unit}
                onChange={(e) => setNumericalData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., kg, m/s, MPa"
              />
            </div>
            <div>
              <Label htmlFor="formula">Formula Hint (optional)</Label>
              <Input
                id="formula"
                value={numericalData.formula}
                onChange={(e) => setNumericalData(prev => ({ ...prev, formula: e.target.value }))}
                placeholder="e.g., F = ma, V = πr²h"
              />
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <Label>Matching Pairs</Label>
            {matchingData.pairs.map((pair, index) => (
              <Card key={pair.id}>
                <CardContent className="pt-4">
                  <div className="flex space-x-3 items-center">
                    <div className="flex-1">
                      <Label>Term</Label>
                      <Input
                        value={pair.left}
                        onChange={(e) => {
                          const newPairs = [...matchingData.pairs];
                          newPairs[index].left = e.target.value;
                          setMatchingData({ pairs: newPairs });
                        }}
                        placeholder="Enter term"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Definition</Label>
                      <Input
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...matchingData.pairs];
                          newPairs[index].right = e.target.value;
                          setMatchingData({ pairs: newPairs });
                        }}
                        placeholder="Enter definition"
                      />
                    </div>
                    {matchingData.pairs.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMatchingData(prev => ({
                            pairs: prev.pairs.filter(p => p.id !== pair.id)
                          }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMatchingData(prev => ({
                  pairs: [...prev.pairs, { id: uuidv4(), left: '', right: '' }]
                }));
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pair
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/questions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Question</h1>
          <p className="text-gray-600">Add a new question to your learning content</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Setup</CardTitle>
            <CardDescription>Choose where this question belongs and what type it should be</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject._id.toString()} value={subject._id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Select
                  value={formData.topicId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, topicId: value }))}
                  disabled={topics.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic._id.toString()} value={topic._id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sectionId: value }))}
                  disabled={sections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section._id.toString()} value={section._id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sections.length === 0 && formData.topicId && (
                  <p className="text-sm text-amber-600 mt-1">
                    No sections found. <Link href={`/admin/sections/new?topicId=${formData.topicId}`} className="underline">Create a section first</Link>.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Question Type *</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                {questionTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleQuestionTypeChange(type.id as any)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <IconComponent className="w-4 h-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-tight">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Content */}
        <Card>
          <CardHeader>
            <CardTitle>Question Content</CardTitle>
            <CardDescription>Write your question and add any supporting materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor
              label="Question Text *"
              value={formData.text}
              onChange={(value) => setFormData(prev => ({ ...prev, text: value }))}
              placeholder="Enter your question text here..."
              disabled={isLoading}
              rows={3}
              required
            />

            <ImageUrlInput
              label="Question Image (optional)"
              description="Add an image to help illustrate your question"
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              disabled={isLoading}
              placeholder="https://example.com/question-image.jpg"
            />
          </CardContent>
        </Card>

        {/* Answer Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Answer Configuration</CardTitle>
            <CardDescription>
              Configure the correct answer(s) for your {questionTypes.find(t => t.id === formData.type)?.label?.toLowerCase()} question
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderQuestionTypeConfig()}
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
            <CardDescription>Help students understand the correct answer</CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              label="Explanation (optional)"
              value={formData.explanation || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, explanation: value }))}
              placeholder="Explain why this is the correct answer and provide additional context..."
              disabled={isLoading}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure difficulty, XP reward, and time estimate</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSection
              difficulty={formData.difficulty}
              xpReward={formData.xpReward}
              estimatedMinutes={formData.estimatedMinutes}
              onDifficultyChange={(difficulty) => setFormData(prev => ({ ...prev, difficulty }))}
              onXpRewardChange={(xpReward) => setFormData(prev => ({ ...prev, xpReward }))}
              onEstimatedMinutesChange={(estimatedMinutes) => setFormData(prev => ({ ...prev, estimatedMinutes }))}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/questions')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.topicId || !formData.sectionId || !formData.text.trim()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Question
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}