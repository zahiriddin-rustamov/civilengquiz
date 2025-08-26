'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { ISubject, ITopic } from '@/models/database';

interface BulkFlashcard {
  front: string;
  back: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  tags: string[];
  category?: string;
}

export default function BulkFlashcardsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CSV/Text parsing state
  const [csvData, setCsvData] = useState('');
  const [parsedFlashcards, setParsedFlashcards] = useState<BulkFlashcard[]>([]);

  // Manual entry state
  const [manualFlashcards, setManualFlashcards] = useState<BulkFlashcard[]>([
    {
      front: '',
      back: '',
      difficulty: 'Beginner',
      points: 5,
      tags: [],
      category: ''
    }
  ]);

  useEffect(() => {
    fetchSubjects();
  }, []);

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
        setSelectedTopic('');
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const parseCSV = () => {
    try {
      const lines = csvData.trim().split('\n');
      const flashcards: BulkFlashcard[] = [];

      for (let i = 1; i < lines.length; i++) { // Skip header row
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handles basic cases)
        const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'));
        
        if (columns.length >= 2) {
          const flashcard: BulkFlashcard = {
            front: columns[0] || '',
            back: columns[1] || '',
            difficulty: (columns[2] as any) || 'Beginner',
            points: parseInt(columns[3]) || 5,
            tags: columns[4] ? columns[4].split(';').map(tag => tag.trim()).filter(Boolean) : [],
            category: columns[5] || undefined
          };

          if (flashcard.front && flashcard.back) {
            flashcards.push(flashcard);
          }
        }
      }

      setParsedFlashcards(flashcards);
      setError(null);
    } catch (err) {
      setError('Failed to parse CSV data. Please check the format.');
      setParsedFlashcards([]);
    }
  };

  const addManualFlashcard = () => {
    setManualFlashcards(prev => [
      ...prev,
      {
        front: '',
        back: '',
        difficulty: 'Beginner',
        points: 5,
        tags: [],
        category: ''
      }
    ]);
  };

  const removeManualFlashcard = (index: number) => {
    setManualFlashcards(prev => prev.filter((_, i) => i !== index));
  };

  const updateManualFlashcard = (index: number, field: keyof BulkFlashcard, value: any) => {
    setManualFlashcards(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (flashcards: BulkFlashcard[]) => {
    if (!selectedTopic) {
      setError('Please select a topic');
      return;
    }

    if (flashcards.length === 0) {
      setError('Please add at least one flashcard');
      return;
    }

    // Validate flashcards
    const invalidCards = flashcards.filter(fc => !fc.front.trim() || !fc.back.trim());
    if (invalidCards.length > 0) {
      setError(`${invalidCards.length} flashcard(s) have empty front or back content`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const flashcardsData = flashcards.map((fc, index) => ({
        ...fc,
        topicId: selectedTopic,
        order: index + 1
      }));

      const response = await fetch('/api/admin/flashcards', {
        method: 'PUT', // Using PUT for bulk create
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flashcards: flashcardsData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create flashcards');
      }

      const result = await response.json();
      setSuccess(result.message);
      
      // Reset forms after success
      setCsvData('');
      setParsedFlashcards([]);
      setManualFlashcards([{
        front: '',
        back: '',
        difficulty: 'Beginner',
        points: 5,
        tags: [],
        category: ''
      }]);

    } catch (err) {
      console.error('Error creating flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to create flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCSVTemplate = () => {
    const template = `Front,Back,Difficulty,Points,Tags,Category
"What is concrete?","A composite material made of cement, water, and aggregates",Beginner,5,"materials;basics","Definitions"
"Calculate compressive strength","σ = F/A where F is force and A is area",Intermediate,10,"formulas;strength","Calculations"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/flashcards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Flashcards
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import Flashcards</h1>
          <p className="text-gray-600">Import multiple flashcards at once via CSV or manual entry</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Destination</CardTitle>
          <CardDescription>Choose where to import the flashcards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                fetchTopicsForSubject(value);
              }}>
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
              <Label htmlFor="topic">Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={topics.length === 0}>
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
          </div>
        </CardContent>
      </Card>

      {/* Import Methods */}
      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* CSV Import */}
        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CSV Import</CardTitle>
                  <CardDescription>
                    Import flashcards from CSV format. First row should be headers.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={generateCSVTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csvData">CSV Data</Label>
                <Textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Front,Back,Difficulty,Points,Tags,Category
What is concrete?,A composite material...,Beginner,5,materials;basics,Definitions"
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="mt-2 text-sm text-gray-600">
                  Expected format: Front, Back, Difficulty, Points, Tags (semicolon-separated), Category
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={parseCSV} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Parse CSV
                </Button>
                {parsedFlashcards.length > 0 && (
                  <Button 
                    onClick={() => handleSubmit(parsedFlashcards)} 
                    disabled={isLoading || !selectedTopic}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? 'Importing...' : `Import ${parsedFlashcards.length} Flashcards`}
                  </Button>
                )}
              </div>

              {/* Parsed Flashcards Preview */}
              {parsedFlashcards.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Parsed Flashcards ({parsedFlashcards.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {parsedFlashcards.slice(0, 5).map((flashcard, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">Flashcard {index + 1}</div>
                          <div className="flex space-x-2">
                            <Badge className="text-xs">{flashcard.difficulty}</Badge>
                            <Badge variant="outline" className="text-xs">{flashcard.points} XP</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-gray-600">Front:</div>
                            <div className="truncate">{flashcard.front}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Back:</div>
                            <div className="truncate">{flashcard.back}</div>
                          </div>
                        </div>
                        {flashcard.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {flashcard.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {parsedFlashcards.length > 5 && (
                      <div className="text-center text-gray-500 text-sm">
                        ... and {parsedFlashcards.length - 5} more flashcards
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manual Entry</CardTitle>
                  <CardDescription>Add multiple flashcards one by one</CardDescription>
                </div>
                <Button onClick={addManualFlashcard} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Flashcard
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {manualFlashcards.map((flashcard, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Flashcard {index + 1}</h4>
                    {manualFlashcards.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeManualFlashcard(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Front Side</Label>
                        <Textarea
                          value={flashcard.front}
                          onChange={(e) => updateManualFlashcard(index, 'front', e.target.value)}
                          placeholder="Question or term..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Back Side</Label>
                        <Textarea
                          value={flashcard.back}
                          onChange={(e) => updateManualFlashcard(index, 'back', e.target.value)}
                          placeholder="Answer or definition..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label>Difficulty</Label>
                        <Select 
                          value={flashcard.difficulty}
                          onValueChange={(value: any) => updateManualFlashcard(index, 'difficulty', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={flashcard.points}
                          onChange={(e) => updateManualFlashcard(index, 'points', parseInt(e.target.value) || 5)}
                        />
                      </div>

                      <div>
                        <Label>Category</Label>
                        <Input
                          value={flashcard.category}
                          onChange={(e) => updateManualFlashcard(index, 'category', e.target.value)}
                          placeholder="Optional category..."
                        />
                      </div>

                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={flashcard.tags.join(', ')}
                          onChange={(e) => updateManualFlashcard(
                            index, 
                            'tags', 
                            e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          )}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between">
                <Button onClick={addManualFlashcard} variant="outline">
                  Add Another Flashcard
                </Button>
                
                <Button 
                  onClick={() => handleSubmit(manualFlashcards)} 
                  disabled={isLoading || !selectedTopic}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isLoading ? 'Creating...' : `Create ${manualFlashcards.length} Flashcards`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}