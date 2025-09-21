'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Eye,
  Edit3,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  required?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Enter your content...',
  disabled = false,
  rows = 4,
  required = false
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (before: string, after: string = '') => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(start);

    const newText = beforeText + text + afterText;
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertFormat('**', '**'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertFormat('*', '*'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertAtCursor('\n- '),
      shortcut: 'Ctrl+L'
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertAtCursor('\n1. '),
      shortcut: 'Ctrl+Shift+L'
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertFormat('[', '](url)'),
      shortcut: 'Ctrl+K'
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertFormat('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertFormat('*', '*');
          break;
        case 'l':
          e.preventDefault();
          if (e.shiftKey) {
            insertAtCursor('\n1. ');
          } else {
            insertAtCursor('\n- ');
          }
          break;
        case 'k':
          e.preventDefault();
          insertFormat('[', '](url)');
          break;
      }
    }
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Bullet lists
      .replace(/^- (.+)/gm, '• $1')
      // Numbered lists
      .replace(/^\d+\. (.+)/gm, '• $1');
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('edit')}
              disabled={disabled}
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
              disabled={disabled || !value.trim()}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center space-x-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
            {formatButtons.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={button.action}
                disabled={disabled}
                title={`${button.label} (${button.shortcut})`}
                className="h-8 w-8 p-0"
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
            <div className="flex-1" />
            <div className="text-xs text-gray-500 flex items-center">
              <Type className="w-3 h-3 mr-1" />
              Markdown
            </div>
          </div>

          {/* Text Area */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="border-t-0 rounded-t-none focus:ring-0 focus:border-gray-300 resize-none"
          />

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Formatting:</strong> **bold**, *italic*, [link](url), - bullet list, 1. numbered list
            </p>
            <p>
              <strong>Shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic), Ctrl+L (list), Ctrl+K (link)
            </p>
          </div>
        </>
      )}

      {mode === 'preview' && (
        <div className="border border-gray-300 rounded-md p-4 min-h-[100px] bg-white">
          {value.trim() ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
            />
          ) : (
            <div className="text-gray-500 italic">Nothing to preview</div>
          )}
        </div>
      )}
    </div>
  );
}