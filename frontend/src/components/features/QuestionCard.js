import { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStatusColor } from '../../utils/helpers';

export default function QuestionCard({ question, onEdit, onRefresh, showPriority = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: question.status,
    notes: question.notes,
    mistakes_count: question.mistakes_count
  });
  
  const handleQuickUpdate = async () => {
    try {
      const updatePayload = {
        ...editData,
        last_revised_at: new Date().toISOString()
      };
      
      await api.put(`/questions/${question.id}`, updatePayload);
      toast.success('Question updated');
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update question');
    }
  };
  
  const handleDelete = async () => {
    try {
      await api.delete(`/questions/${question.id}`);
      toast.success('Question deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };
  
  return (
    <>
      <div
        data-testid={`question-card-${question.id}`}
        className="bg-white border border-gray-200 rounded-sm hover:border-gray-300 transition-all duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className={`${getStatusColor(question.status)} rounded-sm px-2 py-1 text-xs uppercase tracking-widest font-ibm-plex-mono font-medium`}
                >
                  {question.status}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-sm px-2 py-1 text-xs font-ibm-plex-mono"
                >
                  {question.category}
                </Badge>
                {question.mistakes_count > 0 && (
                  <Badge
                    className="bg-red-50 text-red-700 border-red-200 rounded-sm px-2 py-1 text-xs font-ibm-plex-mono"
                  >
                    {question.mistakes_count} {question.mistakes_count === 1 ? 'mistake' : 'mistakes'}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold font-ibm-plex-sans leading-tight">
                {question.question}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                data-testid={`edit-question-btn-${question.id}`}
                variant="ghost"
                size="icon"
                onClick={() => onEdit(question)}
                className="rounded-sm"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                data-testid={`delete-question-btn-${question.id}`}
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-sm hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                data-testid={`toggle-expand-btn-${question.id}`}
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="rounded-sm"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {showPriority && question.mistakes_count > 3 && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-ibm-plex-sans mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>High priority - Multiple mistakes recorded</span>
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="mb-6">
              <h4 className="text-sm font-medium font-ibm-plex-sans mb-2 flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono">Ideal Answer</span>
              </h4>
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="prose prose-sm max-w-none font-ibm-plex-sans">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, inline, ...props }) => (
                        inline ? 
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-ibm-plex-mono" {...props} /> :
                          <code className="block bg-gray-100 p-3 rounded-sm text-sm font-ibm-plex-mono overflow-x-auto" {...props} />
                      )
                    }}
                  >
                    {question.ideal_answer}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
                    Status
                  </label>
                  <Select 
                    value={editData.status} 
                    onValueChange={(value) => setEditData({ ...editData, status: value })}
                  >
                    <SelectTrigger className="rounded-sm font-ibm-plex-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Revised">Revised</SelectItem>
                      <SelectItem value="Strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
                    Mistakes Count
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editData.mistakes_count}
                    onChange={(e) => setEditData({ ...editData, mistakes_count: parseInt(e.target.value) || 0 })}
                    className="rounded-sm font-ibm-plex-sans"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium font-ibm-plex-sans mb-1.5">
                    Notes
                  </label>
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Add your notes, mistakes, or insights..."
                    className="rounded-sm font-ibm-plex-sans min-h-24"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    data-testid="save-quick-edit-btn"
                    onClick={handleQuickUpdate}
                    className="bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        status: question.status,
                        notes: question.notes,
                        mistakes_count: question.mistakes_count
                      });
                    }}
                    className="rounded-sm font-ibm-plex-sans"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {question.notes && (
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono mb-2">
                      Notes & Mistakes
                    </h4>
                    <p className="text-sm font-ibm-plex-sans text-gray-700 whitespace-pre-wrap">
                      {question.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500 font-ibm-plex-mono">
                  {question.last_revised_at && (
                    <span>
                      Last revised: {new Date(question.last_revised_at).toLocaleDateString()}
                    </span>
                  )}
                  <span>
                    Created: {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <Button
                  data-testid="quick-edit-btn"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="rounded-sm font-ibm-plex-sans"
                >
                  Quick Edit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-chivo">Delete Question?</AlertDialogTitle>
            <AlertDialogDescription className="font-ibm-plex-sans">
              This action cannot be undone. This will permanently delete the question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm font-ibm-plex-sans">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-btn"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-sm font-ibm-plex-sans"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
