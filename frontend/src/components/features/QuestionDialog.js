import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (question) {
      setFormData({
        category: question.category,
        question: question.question,
        ideal_answer: question.ideal_answer,
        status: question.status,
        notes: question.notes || '',
        mistakes_count: question.mistakes_count || 0
      });
    } else {
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
    
    try {
      if (question) {
        // Update existing question
        await api.put(`/questions/${question.id}`, formData);
        toast.success('Question updated successfully');
      } else {
        // Create new question
        await api.post('/questions', formData);
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
            <Textarea
              data-testid="question-input"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What is the question you need to master?"
              className="rounded-sm font-ibm-plex-sans min-h-24"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
              Ideal Answer * (Supports Markdown)
            </label>
            <Textarea
              data-testid="ideal-answer-input"
              value={formData.ideal_answer}
              onChange={(e) => setFormData({ ...formData, ideal_answer: e.target.value })}
              placeholder="Write your ideal answer here. You can use markdown for code blocks:

```javascript
const example = 'code here';
```"
              className="rounded-sm font-ibm-plex-mono text-sm min-h-48"
              required
            />
            <p className="text-xs text-gray-500 mt-1 font-ibm-plex-sans">
              Tip: Use markdown syntax for code blocks, lists, and formatting
            </p>
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
