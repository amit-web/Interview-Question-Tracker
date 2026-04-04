import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../utils/api';
import useQuestionStore from '../store/useQuestionStore';
import { Button } from '../components/ui/button';
import QuestionCard from '../components/features/QuestionCard';
import QuestionDialog from '../components/features/QuestionDialog';
import Header from '../components/features/Header';
import { toast } from 'sonner';

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { questions, setQuestions } = useQuestionStore();
  
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchQuestions();
  }, [category]);
  
  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/questions?category=${category}`);
      setQuestions(response.data);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };
  
  const categoryQuestions = questions.filter(q => q.category === category);
  
  const statusCounts = {
    'Not Started': categoryQuestions.filter(q => q.status === 'Not Started').length,
    'In Progress': categoryQuestions.filter(q => q.status === 'In Progress').length,
    'Revised': categoryQuestions.filter(q => q.status === 'Revised').length,
    'Strong': categoryQuestions.filter(q => q.status === 'Strong').length
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-ibm-plex-sans">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <Button
          data-testid="back-button"
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 font-ibm-plex-sans"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black font-chivo tracking-tighter mb-4">
            {category}
          </h1>
          <p className="text-gray-600 font-ibm-plex-sans">
            {categoryQuestions.length} {categoryQuestions.length === 1 ? 'question' : 'questions'} in this category
          </p>
        </div>
        
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-slate-600 font-ibm-plex-mono mb-1">
              Not Started
            </p>
            <p className="text-2xl font-black font-chivo">{statusCounts['Not Started']}</p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-amber-700 font-ibm-plex-mono mb-1">
              In Progress
            </p>
            <p className="text-2xl font-black font-chivo text-amber-700">{statusCounts['In Progress']}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-blue-700 font-ibm-plex-mono mb-1">
              Revised
            </p>
            <p className="text-2xl font-black font-chivo text-blue-700">{statusCounts['Revised']}</p>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-ibm-plex-mono mb-1">
              Strong
            </p>
            <p className="text-2xl font-black font-chivo text-emerald-700">{statusCounts['Strong']}</p>
          </div>
        </div>
        
        {/* Add Question Button */}
        <div className="mb-6">
          <Button
            data-testid="add-question-category-btn"
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionDialog(true);
            }}
            className="bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question to {category}
          </Button>
        </div>
        
        {/* Questions List */}
        {categoryQuestions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
            <p className="text-gray-500 font-ibm-plex-sans mb-4">
              No questions in {category} yet
            </p>
            <Button
              onClick={() => setShowQuestionDialog(true)}
              className="bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
            >
              Add Your First Question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={(q) => {
                  setEditingQuestion(q);
                  setShowQuestionDialog(true);
                }}
                onRefresh={fetchQuestions}
              />
            ))}
          </div>
        )}
      </main>
      
      <QuestionDialog
        open={showQuestionDialog}
        onClose={() => {
          setShowQuestionDialog(false);
          setEditingQuestion(null);
        }}
        question={editingQuestion}
        defaultCategory={category}
        onSuccess={fetchQuestions}
      />
    </div>
  );
}
