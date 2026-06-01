import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DimensionChart = ({ stats, maxStats }) => {
  if (!stats || !maxStats) return null;

  const data = [
    { 
      subject: '공공신학', 
      actualValue: stats.public_theology.mean, 
      displayValue: (stats.public_theology.mean / maxStats.public_theology) * 100, 
      color: '#3b82f6' 
    },
    { 
      subject: '번영신학', 
      actualValue: stats.prosperity_theology.mean, 
      displayValue: (stats.prosperity_theology.mean / maxStats.prosperity_theology) * 100, 
      color: '#f59e0b' 
    },
    { 
      subject: '정치적 동원', 
      actualValue: stats.political_mobilization.mean, 
      displayValue: (stats.political_mobilization.mean / maxStats.political_mobilization) * 100, 
      color: '#10b981' 
    },
    { 
      subject: '권위주의 통제', 
      actualValue: stats.authoritarian_control.mean, 
      displayValue: (stats.authoritarian_control.mean / maxStats.authoritarian_control) * 100, 
      color: '#ef4444' 
    },
  ];

  return (
    <div className="chart-container" style={{ height: '220px', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.3} />
          <XAxis 
            dataKey="subject" 
            axisLine={{ stroke: '#94a3b8', strokeWidth: 1.2 }} 
            tickLine={false} 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
            interval={0}
          />
          <YAxis type="number" hide domain={[0, 100]} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '8px' }}
            formatter={(value, name, props) => [props.payload.actualValue.toFixed(2), '평균 점수']}
          />
          <Bar dataKey="displayValue" radius={[4, 4, 0, 0]} barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DimensionChart;
