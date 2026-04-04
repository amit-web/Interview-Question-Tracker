import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProgressChart({ data }) {
  const chartData = data.map(item => ({
    name: item.category,
    'Not Started': item.not_started,
    'In Progress': item.in_progress,
    'Revised': item.revised,
    'Strong': item.strong
  }));
  
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-6">
      <h2 className="text-2xl font-bold font-chivo tracking-tight mb-6">Progress Overview</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }}
            stroke="#9ca3af"
          />
          <YAxis 
            tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            stroke="#9ca3af"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '2px',
              fontFamily: 'IBM Plex Sans'
            }}
          />
          <Legend 
            wrapperStyle={{
              fontFamily: 'IBM Plex Sans',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="Not Started" fill="#94A3B8" />
          <Bar dataKey="In Progress" fill="#F59E0B" />
          <Bar dataKey="Revised" fill="#3B82F6" />
          <Bar dataKey="Strong" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
