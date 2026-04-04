import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import QuestionCard from '@/components/features/QuestionCard';
import Header from '@/components/features/Header';
import { toast } from 'sonner';

export default function SmartRevisionPage() {
  const navigate = useNavigate();
  const updateUser = useAuthStore(state => state.updateUser);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSmartRevisionList();
    updateStreak();
  }, []);
  
  const fetchSmartRevisionList = async () => {
    try {
      const response = await api.get('/questions/smart-revision/list');
      setQuestions(response.data);
    } catch (error) {
      toast.error('Failed to load revision list');
    } finally {
      setLoading(false);
    }
  };
  
  const updateStreak = async () => {
    try {
      const response = await api.post('/streak/update');
      updateUser({ streak_count: response.data.streak_count });
    } catch (error) {
      console.error('Failed to update streak');
    }
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
          data-testid="back-to-dashboard-btn"
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 font-ibm-plex-sans"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-amber-500" />
            <h1 className="text-4xl sm:text-5xl font-black font-chivo tracking-tighter">
              Smart Revision
            </h1>
          </div>
          <p className="text-gray-600 font-ibm-plex-sans mb-4">
            Questions prioritized by mistakes, time since last revision, and current status
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
            <p className="text-sm font-ibm-plex-sans text-amber-900">
              <strong>Algorithm:</strong> Score = (Mistakes × 10) + (Days Since Last Revision × 5) + Status Weight
              <br />
              <span className="text-xs text-amber-700">
                Status Weights: Not Started (30) > In Progress (20) > Revised (10) > Strong (0)
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-700 font-ibm-plex-sans">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} to revise
          </p>
          
          <Button
            data-testid="refresh-revision-btn"
            variant="outline"
            onClick={fetchSmartRevisionList}
            className="rounded-sm font-ibm-plex-sans"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {questions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
            <div className="mb-4 text-6xl">✨</div>
            <h3 className="text-xl font-bold font-chivo mb-2">All Caught Up!</h3>
            <p className="text-gray-500 font-ibm-plex-sans">
              You don't have any questions to revise right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="relative">
                <div className="absolute -left-12 top-6 hidden lg:block">
                  <div className="w-8 h-8 bg-black text-white rounded-sm flex items-center justify-center font-ibm-plex-mono text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <QuestionCard
                  question={question}
                  onEdit={() => {}}
                  onRefresh={fetchSmartRevisionList}
                  showPriority
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
