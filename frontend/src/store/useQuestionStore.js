import { create } from 'zustand';

const useQuestionStore = create((set) => ({
  questions: [],
  selectedCategory: null,
  searchQuery: '',
  filterStatus: null,
  
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => set((state) => ({
    questions: [...state.questions, question]
  })),
  
  updateQuestion: (questionId, updatedData) => set((state) => ({
    questions: state.questions.map(q => 
      q.id === questionId ? { ...q, ...updatedData } : q
    )
  })),
  
  deleteQuestion: (questionId) => set((state) => ({
    questions: state.questions.filter(q => q.id !== questionId)
  })),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  clearFilters: () => set({ searchQuery: '', filterStatus: null })
}));

export default useQuestionStore;
