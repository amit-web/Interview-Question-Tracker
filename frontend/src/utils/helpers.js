/**
 * Calculate revision priority score
 * Higher score = needs more revision
 */
export const calculateRevisionScore = (question) => {
  // Mistake weight
  const mistakesScore = (question.mistakes_count || 0) * 10;
  
  // Status weight
  const statusWeights = {
    'Not Started': 30,
    'In Progress': 20,
    'Revised': 10,
    'Strong': 0
  };
  const statusScore = statusWeights[question.status] || 30;
  
  // Time since last revision
  let timeScore = 0;
  if (question.last_revised_at) {
    const lastRevised = new Date(question.last_revised_at);
    const now = new Date();
    const daysSince = Math.floor((now - lastRevised) / (1000 * 60 * 60 * 24));
    timeScore = daysSince * 5;
  } else {
    // Never revised
    timeScore = 100;
  }
  
  return mistakesScore + statusScore + timeScore;
};

/**
 * Sort questions by revision priority
 */
export const sortByRevisionPriority = (questions) => {
  return [...questions].sort((a, b) => {
    return calculateRevisionScore(b) - calculateRevisionScore(a);
  });
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const colors = {
    'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Revised': 'bg-blue-50 text-blue-700 border-blue-200',
    'Strong': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return colors[status] || colors['Not Started'];
};

/**
 * Export questions as JSON
 */
export const exportAsJSON = (questions) => {
  const dataStr = JSON.stringify({ questions }, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `interview-prep-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export questions as CSV
 */
export const exportAsCSV = (questions) => {
  const headers = ['Category', 'Question', 'Ideal Answer', 'Status', 'Notes', 'Mistakes Count', 'Created At', 'Last Revised At'];
  const rows = questions.map(q => [
    q.category,
    q.question,
    q.ideal_answer,
    q.status,
    q.notes,
    q.mistakes_count,
    q.created_at,
    q.last_revised_at || 'N/A'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `interview-prep-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Parse imported JSON file
 */
export const parseJSONFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
