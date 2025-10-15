'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Download,
  Upload,
  Database,
  Check,
  AlertCircle,
  FileJson,
  Loader2,
  Info,
  Shield,
  Archive,
  RefreshCw
} from 'lucide-react';

interface BackupPreview {
  version: string;
  timestamp: string;
  type: string;
  metadata: {
    totalSubjects: number;
    totalTopics: number;
    totalQuestionSections: number;
    totalQuestions: number;
    totalFlashcards: number;
    totalMedia: number;
    totalItems: number;
  };
  collections: {
    subjects: number;
    topics: number;
    questionSections: number;
    questions: number;
    flashcards: number;
    media: number;
  };
}

interface ImportResult {
  success: boolean;
  mode: string;
  imported: {
    subjects: number;
    topics: number;
    questionSections: number;
    questions: number;
    flashcards: number;
    media: number;
    skipped?: {
      subjects: number;
      topics: number;
      questionSections: number;
      questions: number;
      flashcards: number;
      media: number;
    };
  };
}

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch('/api/admin/backup/export', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export backup');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `backup-${new Date().toISOString().split('T')[0]}.json`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error exporting backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setBackupPreview(null);
    setValidationErrors([]);
    setImportResult(null);
    setError(null);

    // Validate the file
    await validateBackupFile(file);
  };

  const validateBackupFile = async (file: File) => {
    try {
      setIsValidating(true);
      setError(null);

      // Read the file
      const fileContent = await file.text();
      const backup = JSON.parse(fileContent);

      // Validate with API
      const response = await fetch('/api/admin/backup/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup }),
      });

      const result = await response.json();

      if (!result.valid) {
        setValidationErrors(result.errors || ['Invalid backup file']);
        setBackupPreview(null);
      } else {
        setValidationErrors([]);
        setBackupPreview(result.preview);
      }

    } catch (err) {
      console.error('Error validating backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate backup file');
      setValidationErrors(['Invalid JSON format or corrupted file']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImportBackup = async () => {
    if (!selectedFile || !backupPreview) return;

    if (importMode === 'replace') {
      const confirmed = window.confirm(
        '⚠️ WARNING: This will DELETE ALL existing content and replace it with the backup data.\n\n' +
        'This action cannot be undone. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setImportResult(null);

      // Read the file
      const fileContent = await selectedFile.text();
      const backup = JSON.parse(fileContent);

      // Import the backup
      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backup,
          mode: importMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import backup');
      }

      setImportResult(result);

      // Reset file selection after successful import
      setSelectedFile(null);
      setBackupPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Error importing backup:', err);
      setError(err instanceof Error ? err.message : 'Failed to import backup');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setBackupPreview(null);
    setValidationErrors([]);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
        <p className="text-gray-600">Export and import your platform content</p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Backups</AlertTitle>
        <AlertDescription>
          Backups include all educational content (subjects, topics, sections, questions, flashcards, and media).
          User data, progress, and analytics are not included in backups.
        </AlertDescription>
      </Alert>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle>Export Backup</CardTitle>
          </div>
          <CardDescription>
            Download a complete backup of all content as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Database className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  Creates a complete snapshot of your platform's content including:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>All subjects and topics</li>
                  <li>Question sections and questions</li>
                  <li>Flashcards and media items</li>
                  <li>Metadata and relationships</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Backup Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-green-600" />
            <CardTitle>Import Backup</CardTitle>
          </div>
          <CardDescription>
            Restore content from a previously exported backup file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="backup-file" className="text-sm font-medium">
                Select Backup File
              </Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  id="backup-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Validation in progress */}
            {isValidating && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Validating backup file...</span>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Backup File</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Backup Preview */}
            {backupPreview && !isValidating && (
              <div className="space-y-4">
                <Alert>
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Valid Backup File</AlertTitle>
                  <AlertDescription>
                    The backup file has been validated successfully. Review the contents below.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Backup Information</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Created: {new Date(backupPreview.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      Version {backupPreview.version}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-blue-600">
                        {backupPreview.collections.subjects}
                      </div>
                      <div className="text-xs text-gray-600">Subjects</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-green-600">
                        {backupPreview.collections.topics}
                      </div>
                      <div className="text-xs text-gray-600">Topics</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-purple-600">
                        {backupPreview.collections.questionSections}
                      </div>
                      <div className="text-xs text-gray-600">Sections</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-orange-600">
                        {backupPreview.collections.questions}
                      </div>
                      <div className="text-xs text-gray-600">Questions</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-pink-600">
                        {backupPreview.collections.flashcards}
                      </div>
                      <div className="text-xs text-gray-600">Flashcards</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-2xl font-bold text-red-600">
                        {backupPreview.collections.media}
                      </div>
                      <div className="text-xs text-gray-600">Media Items</div>
                    </div>
                  </div>
                </div>

                {/* Import Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Import Mode</Label>
                  <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as 'replace' | 'merge')}>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="replace" id="replace" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="replace" className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Replace All Content</span>
                            <Badge variant="destructive" className="text-xs">Destructive</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Deletes all existing content and replaces it with the backup. Use this for a complete restore.
                          </p>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="merge" id="merge" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="merge" className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <Archive className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Merge with Existing</span>
                            <Badge variant="secondary" className="text-xs">Safe</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Adds backup content alongside existing content. Skips items that already exist (by ID).
                          </p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Warning for Replace Mode */}
                {importMode === 'replace' && (
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Destructive Action</AlertTitle>
                    <AlertDescription>
                      Replace mode will permanently delete all existing content before importing the backup.
                      This action cannot be undone. Make sure you have a current backup before proceeding.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Import Actions */}
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleImportBackup}
                    disabled={isImporting}
                    variant={importMode === 'replace' ? 'destructive' : 'default'}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {importMode === 'replace' ? 'Replace All & Import' : 'Merge & Import'}
                      </>
                    )}
                  </Button>

                  <Button onClick={handleClearSelection} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <Alert>
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle>Import Successful</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      Successfully imported content in <strong>{importResult.mode}</strong> mode:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div>• {importResult.imported.subjects} subjects</div>
                      <div>• {importResult.imported.topics} topics</div>
                      <div>• {importResult.imported.questionSections} sections</div>
                      <div>• {importResult.imported.questions} questions</div>
                      <div>• {importResult.imported.flashcards} flashcards</div>
                      <div>• {importResult.imported.media} media items</div>
                    </div>
                    {importResult.imported.skipped && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm font-medium">Skipped (already exist):</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-1">
                          <div>• {importResult.imported.skipped.subjects} subjects</div>
                          <div>• {importResult.imported.skipped.topics} topics</div>
                          <div>• {importResult.imported.skipped.questionSections} sections</div>
                          <div>• {importResult.imported.skipped.questions} questions</div>
                          <div>• {importResult.imported.skipped.flashcards} flashcards</div>
                          <div>• {importResult.imported.skipped.media} media items</div>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* General Error */}
            {error && !validationErrors.length && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileJson className="h-5 w-5 text-purple-600" />
            <CardTitle>Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Export backups regularly, especially before making major changes</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Store backup files in a safe location outside of this server</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Test backup files by importing them in a test environment first</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Use "Replace" mode for complete restoration, "Merge" mode for adding content</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Always verify backup contents before importing to avoid data loss</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
