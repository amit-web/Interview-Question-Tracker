import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CATEGORIES = ['JavaScript', 'React', 'Redux', 'DSA', 'Debugging', 'Production Issues'];
const STATUSES = ['Not Started', 'In Progress', 'Revised', 'Strong'];

export default function QuestionDialog({ open, onClose, question, defaultCategory, onSuccess }) {
  const [formData, setFormData] = useState({
    category: defaultCategory || 'JavaScript',
    question: '',
    ideal_answer: '',
    status: 'Not Started',
    notes: '',
    mistakes_count: 0
  });
  const [questionText, setQuestionText] = useState('');
  const [questionCode, setQuestionCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (question) {
      // Parse existing question into text and code parts
      const codeBlockMatch = question.question.match(/```[\s\S]*?```/);
      if (codeBlockMatch) {
        const codeBlock = codeBlockMatch[0];
        const textPart = question.question.replace(codeBlock, '').trim();
        const codePart = codeBlock.replace(/```\w*\n?/g, '').replace(/```/g, '').trim();
        setQuestionText(textPart);
        setQuestionCode(codePart);
      } else {
        setQuestionText(question.question);
        setQuestionCode('');
      }
      
      setFormData({
        category: question.category,
        question: question.question,
        ideal_answer: question.ideal_answer,
        status: question.status,
        notes: question.notes || '',
        mistakes_count: question.mistakes_count || 0
      });
    } else {
      setQuestionText('');
      setQuestionCode('');
      setFormData({
        category: defaultCategory || 'JavaScript',
        question: '',
        ideal_answer: '',
        status: 'Not Started',
        notes: '',
        mistakes_count: 0
      });
    }
  }, [question, defaultCategory, open]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Combine question text and code into single markdown format
    let combinedQuestion = questionText.trim();
    if (questionCode.trim()) {
      combinedQuestion += '\n\n```javascript\n' + questionCode.trim() + '\n```';
    }
    
    const submitData = {
      ...formData,
      question: combinedQuestion
    };
    
    try {
      if (question) {
        // Update existing question
        await api.put(`/questions/${question.id}`, submitData);
        toast.success('Question updated successfully');
      } else {
        // Create new question
        await api.post('/questions', submitData);
        toast.success('Question created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-chivo text-2xl">
            {question ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
          <DialogDescription className="font-ibm-plex-sans">
            {question ? 'Update your question and ideal answer' : 'Create a new question to track your prep'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
                Category *
              </label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="category-select" className="rounded-sm font-ibm-plex-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
                Status *
              </label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="status-select" className="rounded-sm font-ibm-plex-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
              Question *
            </label>
            
            <div className="space-y-3">
              {/* Text Question Input */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono">
                    📝 Question Text
                  </span>
                </div>
                <Textarea
                  data-testid="question-input"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g., What is a closure in JavaScript and why is it useful?"
                  className="rounded-sm font-ibm-plex-sans min-h-20"
                  required
                />
              </div>
              
              {/* Code Snippet Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono">
                    💻 Code Snippet (Optional)
                  </span>
                  <span className="text-xs text-gray-400 font-ibm-plex-sans">
                    Add code context to your question
                  </span>
                </div>
                <div className="relative">
                  <Textarea
                    data-testid="question-code-input"
                    value={questionCode}
                    onChange={(e) => setQuestionCode(e.target.value)}
                    placeholder="// Add code snippet if your question includes code context
function example() {
  return 'code here';
}"
                    className="rounded-sm font-ibm-plex-mono text-sm min-h-32 bg-gray-900 text-gray-100 placeholder:text-gray-500 border-gray-700 focus:border-gray-500 focus:ring-gray-500"
                  />
                  {questionCode && (
                    <button
                      type="button"
                      onClick={() => setQuestionCode('')}
                      className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {/* Preview Combined Question */}
              {(questionText || questionCode) && (
                <div className="bg-blue-50 border border-blue-200 rounded-sm p-3">
                  <p className="text-xs uppercase tracking-widest text-blue-600 font-ibm-plex-mono mb-2">
                    👁️ Question Preview
                  </p>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ node, inline, className, children, ...props }) => {
                          return inline ? (
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-sm font-ibm-plex-mono text-blue-800" {...props}>
                              {children}
                            </code>
                          ) : (
                            <div className="my-1">
                              <div className="bg-gray-700 text-gray-300 px-2 py-1 text-xs font-ibm-plex-mono rounded-t">
                                javascript
                              </div>
                              <code className="block bg-gray-800 text-gray-100 p-2 rounded-b text-xs font-ibm-plex-mono overflow-x-auto" {...props}>
                                {children}
                              </code>
                            </div>
                          );
                        },
                        p: ({ children }) => <p className="text-sm text-gray-700 font-ibm-plex-sans">{children}</p>,
                      }}
                    >
                      {questionText + (questionCode ? '\n\n```javascript\n' + questionCode + '\n```' : '')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
              Ideal Answer * (Supports Markdown)
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor Side */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-ibm-plex-sans">
                  ✍️ Write your answer (Markdown supported)
                </p>
                <Textarea
                  data-testid="ideal-answer-input"
                  value={formData.ideal_answer}
                  onChange={(e) => setFormData({ ...formData, ideal_answer: e.target.value })}
                  placeholder="Write your ideal answer here. You can use markdown for code blocks:

```javascript
const example = 'code here';
```"
                  className="rounded-sm font-ibm-plex-mono text-sm min-h-64"
                  required
                />
                <p className="text-xs text-gray-500 mt-1 font-ibm-plex-sans">
                  Tip: Use ```language for code blocks, **bold**, *italic*, lists, etc.
                </p>
              </div>
              
              {/* Preview Side */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-ibm-plex-sans">
                  👁️ Live Preview
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 min-h-64 max-h-64 overflow-y-auto">
                  {formData.ideal_answer ? (
                    <div className="prose prose-sm max-w-none font-ibm-plex-sans">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return inline ? (
                              <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-ibm-plex-mono text-red-600" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="my-2">
                                {match && (
                                  <div className="bg-gray-700 text-gray-300 px-3 py-1 text-xs font-ibm-plex-mono rounded-t-sm">
                                    {match[1]}
                                  </div>
                                )}
                                <code className="block bg-gray-800 text-gray-100 p-3 rounded-b-sm text-sm font-ibm-plex-mono overflow-x-auto" {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          },
                          h1: ({ children }) => <h1 className="text-xl font-bold font-chivo mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold font-chivo mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold font-chivo mb-1">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {formData.ideal_answer}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm font-ibm-plex-sans italic">
                      Preview will appear here as you type...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
              Notes & Mistakes
            </label>
            <Textarea
              data-testid="notes-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Track your mistakes, gotchas, or additional notes..."
              className="rounded-sm font-ibm-plex-sans min-h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
              Mistakes Count
            </label>
            <Input
              data-testid="mistakes-count-input"
              type="number"
              min="0"
              value={formData.mistakes_count}
              onChange={(e) => setFormData({ ...formData, mistakes_count: parseInt(e.target.value) || 0 })}
              className="rounded-sm font-ibm-plex-mono"
            />
            <p className="text-xs text-gray-500 mt-1 font-ibm-plex-sans">
              Higher mistake counts increase revision priority
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-sm font-ibm-plex-sans"
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-question-btn"
              type="submit"
              className="bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
              disabled={loading}
            >
              {loading ? 'Saving...' : (question ? 'Update Question' : 'Create Question')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
