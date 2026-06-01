import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompareView = ({ data, overallStats, selectedChannel }) => {
  if (!selectedChannel) {
    return (
      <div className="compare-placeholder">
        <div className="placeholder-icon-wrapper">
          <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="placeholder-title">채널을 선택하여 분석을 시작하세요</h3>
        <p className="placeholder-desc">
          상단 드롭다운 메뉴에서 분석 대상을 선택하시면,<br/>
          표본 집단(상위 교회군) 전체 평균 데이터와 비교하여<br/>
          해당 채널의 상대적 지향성 편차를 한눈에 파악할 수 있습니다.
        </p>
      </div>
    );
  }

  const selectedChurch = data.find(c => c.church === selectedChannel);
  if (!selectedChurch) return null;

  const compareData = [
    {
      subject: '공공신학',
      '표본 집단 평균': overallStats.public_theology,
      [selectedChurch.masked_name]: selectedChurch.dimension_stats.public_theology.mean,
    },
    {
      subject: '번영신학',
      '표본 집단 평균': overallStats.prosperity_theology,
      [selectedChurch.masked_name]: selectedChurch.dimension_stats.prosperity_theology.mean,
    },
    {
      subject: '정치적 동원성',
      '표본 집단 평균': overallStats.political_mobilization,
      [selectedChurch.masked_name]: selectedChurch.dimension_stats.political_mobilization.mean,
    },
    {
      subject: '권위주의 통제성',
      '표본 집단 평균': overallStats.authoritarian_control,
      [selectedChurch.masked_name]: selectedChurch.dimension_stats.authoritarian_control.mean,
    },
  ];

  return (
    <div className="card bg-white p-12 mt-4 rounded-xl shadow-md border border-slate-100">
      <h3 className="text-2xl font-extrabold mb-10 text-center" style={{ color: 'var(--color-brand-primary)' }}>
        표본 집단 평균 vs {selectedChurch.masked_name} 비교 분석
      </h3>
      
      <div style={{ width: '100%', height: 450 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={compareData}
            margin={{ top: 5, right: 40, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.4} />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax + 2']} 
              tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }}
              axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#94a3b8' }}
            />
            <YAxis 
              dataKey="subject" 
              type="category" 
              tick={{ fill: '#1e293b', fontSize: 16, fontWeight: 800 }} 
              axisLine={false} 
              tickLine={false} 
              width={160}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)', padding: '16px' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '40px' }} iconType="circle" />
            <Bar dataKey="표본 집단 평균" fill="#94a3b8" opacity={0.4} radius={[0, 6, 6, 0]} barSize={28} />
            <Bar dataKey={selectedChurch.masked_name} fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-center text-slate-400 mt-8">
        * 지표별 실제 평균 점수를 직접 비교한 결과입니다. (수치가 클수록 해당 성향이 강함)
      </p>
    </div>
  );
};

export default CompareView;
