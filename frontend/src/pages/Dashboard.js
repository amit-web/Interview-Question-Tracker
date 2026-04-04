import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Upload, TrendingUp, Flame } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import useQuestionStore from '../store/useQuestionStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import CategoryCard from '../components/features/CategoryCard';
import QuestionCard from '../components/features/QuestionCard';
import QuestionDialog from '../components/features/QuestionDialog';
import ProgressChart from '../components/features/ProgressChart';
import Header from '../components/features/Header';
import { exportAsJSON, exportAsCSV, parseJSONFile } from '../utils/helpers';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const CATEGORIES = ['JavaScript', 'React', 'Redux', 'DSA', 'Debugging', 'Production Issues'];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { questions, setQuestions, selectedCategory, searchQuery, filterStatus, setSearchQuery, setFilterStatus } = useQuestionStore();
  
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [questionsRes, progressRes, meRes] = await Promise.all([
        api.get('/questions'),
        api.get('/progress/categories'),
        api.get('/auth/me')
      ]);
      
      setQuestions(questionsRes.data);
      setCategoryProgress(progressRes.data);
      updateUser(meRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (format) => {
    try {
      if (format === 'json') {
        exportAsJSON(questions);
      } else {
        exportAsCSV(questions);
      }
      toast.success(`Exported ${questions.length} questions as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };
  
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await parseJSONFile(file);
      await api.post('/import/json', data);
      toast.success('Questions imported successfully');
      fetchData();
    } catch (error) {
      toast.error('Import failed');
    }
    
    e.target.value = '';
  };
  
  const filteredQuestions = questions.filter(q => {
    if (filterStatus && q.status !== filterStatus) return false;
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
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
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono mb-1">
                  Total Questions
                </p>
                <p className="text-3xl font-black font-chivo">{questions.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-300" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono mb-1">
                  Strong Answers
                </p>
                <p className="text-3xl font-black font-chivo">
                  {questions.filter(q => q.status === 'Strong').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-sm flex items-center justify-center">
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono mb-1">
                  Need Revision
                </p>
                <p className="text-3xl font-black font-chivo">
                  {questions.filter(q => q.status !== 'Strong').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-amber-100 rounded-sm flex items-center justify-center">
                <span className="text-amber-600 font-bold">!</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-ibm-plex-mono mb-1">
                  Current Streak
                </p>
                <p className="text-3xl font-black font-chivo">{user?.streak_count || 0}</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
        
        {/* Progress Chart */}
        <div className="mb-8">
          <ProgressChart data={categoryProgress} />
        </div>
        
        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-chivo tracking-tight mb-4">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(category => {
              const progress = categoryProgress.find(p => p.category === category);
              return (
                <CategoryCard
                  key={category}
                  category={category}
                  progress={progress}
                  onClick={() => navigate(`/category/${category}`)}
                />
              );
            })}
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              data-testid="search-input"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-sm font-ibm-plex-sans"
            />
          </div>
          
          <Select value={filterStatus || ''} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="filter-status-select" className="w-full sm:w-48 rounded-sm font-ibm-plex-sans">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" onClick={() => setFilterStatus(null)}>All Status</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Revised">Revised</SelectItem>
              <SelectItem value="Strong">Strong</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            data-testid="add-question-btn"
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionDialog(true);
            }}
            className="bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="export-menu-trigger"
                variant="outline"
                className="rounded-sm font-ibm-plex-sans"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem data-testid="export-json-btn" onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="export-csv-btn" onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <label>
            <Button
              data-testid="import-btn"
              variant="outline"
              className="rounded-sm font-ibm-plex-sans cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
        
        {/* Questions List */}
        <div>
          <h2 className="text-2xl font-bold font-chivo tracking-tight mb-4">
            Recent Questions ({filteredQuestions.length})
          </h2>
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
              <p className="text-gray-500 font-ibm-plex-sans">No questions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.slice(0, 10).map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onEdit={(q) => {
                    setEditingQuestion(q);
                    setShowQuestionDialog(true);
                  }}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <QuestionDialog
        open={showQuestionDialog}
        onClose={() => {
          setShowQuestionDialog(false);
          setEditingQuestion(null);
        }}
        question={editingQuestion}
        onSuccess={fetchData}
      />
    </div>
  );
}
