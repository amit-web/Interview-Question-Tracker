import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ category, progress, onClick }) {
  const total = progress?.total || 0;
  const strong = progress?.strong || 0;
  const percentage = total > 0 ? Math.round((strong / total) * 100) : 0;
  
  return (
    <div
      data-testid={`category-card-${category.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-sm p-6 hover:-translate-y-1 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold font-chivo tracking-tight group-hover:text-black transition-colors">
          {category}
        </h3>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-ibm-plex-sans">
          <span className="text-gray-600">Progress</span>
          <span className="font-bold font-ibm-plex-mono">{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-100 rounded-sm h-2 overflow-hidden">
          <div
            className="bg-black h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-4 gap-2 pt-2">
          <div>
            <p className="text-xs text-slate-500 font-ibm-plex-mono">Not Started</p>
            <p className="text-sm font-bold font-ibm-plex-mono">{progress?.not_started || 0}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 font-ibm-plex-mono">In Progress</p>
            <p className="text-sm font-bold font-ibm-plex-mono text-amber-600">{progress?.in_progress || 0}</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 font-ibm-plex-mono">Revised</p>
            <p className="text-sm font-bold font-ibm-plex-mono text-blue-600">{progress?.revised || 0}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-ibm-plex-mono">Strong</p>
            <p className="text-sm font-bold font-ibm-plex-mono text-emerald-600">{strong}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
