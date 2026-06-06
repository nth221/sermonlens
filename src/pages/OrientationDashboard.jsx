import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { maskChurchName } from '../utils/masking';
import ChurchCard from '../components/ChurchCard';
import CompareView from '../components/CompareView';
import ScatterPlotView from '../components/ScatterPlotView';

const OrientationDashboard = () => {
  const [currentView, setCurrentView] = useState('overall'); // 'overall', 'compare', 'scatter'
  const [selectedChannel, setSelectedChannel] = useState('');
  const [sermonData, setSermonData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/orientation/sermonData.json`)
      .then(res => res.json())
      .then(data => {
        setSermonData(data);
        setIsLoaded(true);
      })
      .catch(err => console.error("Failed to load sermonData:", err));
  }, []);

  // Process data to mask church names and calculate averages
  const { processedData, overallStats, maxStats } = useMemo(() => {
    if (!isLoaded || sermonData.length === 0) return { processedData: [], overallStats: null, maxStats: null };
    let totals = {
      public_theology: 0,
      prosperity_theology: 0,
      political_mobilization: 0,
      authoritarian_control: 0,
    };
    let count = 0;

    const masked = sermonData.map(church => {
      const maskedName = maskChurchName(church.church);
      
      // Accumulate for overall average
      totals.public_theology += church.dimension_stats.public_theology.mean;
      totals.prosperity_theology += church.dimension_stats.prosperity_theology.mean;
      totals.political_mobilization += church.dimension_stats.political_mobilization.mean;
      totals.authoritarian_control += church.dimension_stats.authoritarian_control.mean;
      count++;

      return {
        ...church,
        masked_name: maskedName
      };
    });

    // Sort by total sermons descending
    masked.sort((a, b) => b.total_sermons - a.total_sermons);

    // Calculate max means for EACH dimension to normalize charts effectively
    const maxStats = {
      public_theology: Math.max(...masked.map(c => c.dimension_stats.public_theology.mean), 1),
      prosperity_theology: Math.max(...masked.map(c => c.dimension_stats.prosperity_theology.mean), 1),
      political_mobilization: Math.max(...masked.map(c => c.dimension_stats.political_mobilization.mean), 1),
      authoritarian_control: Math.max(...masked.map(c => c.dimension_stats.authoritarian_control.mean), 1),
    };

    return {
      processedData: masked,
      overallStats: {
        public_theology: totals.public_theology / count,
        prosperity_theology: totals.prosperity_theology / count,
        political_mobilization: totals.political_mobilization / count,
        authoritarian_control: totals.authoritarian_control / count,
      },
      maxStats
    };
  }, [sermonData, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="page-header">
        <div className="page-header-main">
          <div className="title-area">
            <h2 className="page-title">지향성 지수 테스트 (Orientation Index)</h2>
            <p className="page-description">
              교회별 설교 텍스트를 분석하여 4가지 핵심 지표에 대한 지향성을 수치화한 데이터입니다.
            </p>
          </div>
          
          <div className="header-controls">
            <div className="control-group">
              <label className="control-label">분석 모드</label>
              <div className="select-wrapper">
                <select 
                  className="view-select"
                  value={currentView}
                  onChange={(e) => setCurrentView(e.target.value)}
                >
                  <option value="overall">📊 전체 평균 통계</option>
                  <option value="compare">⚖️ 교회 비교 분석</option>
                  <option value="scatter">📍 전체 설교 산점도</option>
                </select>
              </div>
            </div>

            <div className={`control-group ${!(currentView === 'compare' || currentView === 'scatter') ? 'disabled' : ''}`}>
              <label className="control-label">대상 교회</label>
              <div className="select-wrapper highlight">
                <select 
                  className="view-select"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  disabled={!(currentView === 'compare' || currentView === 'scatter')}
                >
                  <option value="">🎯 교회를 선택하세요</option>
                  {processedData.map(c => (
                    <option key={c.church} value={c.church}>
                      {c.masked_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="view-content mt-6">
        {currentView === 'overall' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Overall Summary Horizontal Bar */}
            <div className="overall-summary-bar">
              <div className="summary-header">
                <span className="summary-badge">Overall Average</span>
                <h3 className="summary-title">분석된 {processedData.length}개 교회 평균</h3>
              </div>
              <div className="summary-stats">
                <div className="summary-stat-item public">
                  <span className="stat-label">공공신학</span>
                  <span className="stat-value">{overallStats.public_theology.toFixed(2)}</span>
                </div>
                <div className="summary-stat-item prosperity">
                  <span className="stat-label">번영신학</span>
                  <span className="stat-value">{overallStats.prosperity_theology.toFixed(2)}</span>
                </div>
                <div className="summary-stat-item political">
                  <span className="stat-label">정치적 동원성</span>
                  <span className="stat-value">{overallStats.political_mobilization.toFixed(2)}</span>
                </div>
                <div className="summary-stat-item authoritarian">
                  <span className="stat-label">권위주의 통제성</span>
                  <span className="stat-value">{overallStats.authoritarian_control.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refined Scale Guide */}
            <div className="scale-guide-footer">
              <div className="scale-guide-info">
                <span className="scale-guide-label">※ 데이터 시각화 기준 안내:</span>
                <span className="scale-guide-desc">모든 차트는 분석 데이터 내 상대적 비교를 위해 각 지표별 각 교회의 평균 점수의 최댓값을 만점으로 하여 자동 스케일링됩니다.</span>
              </div>
              <div className="scale-guide-values">
                <span className="scale-guide-item">공공신학 <strong>{maxStats.public_theology.toFixed(2)}</strong></span>
                <span className="scale-guide-item">번영신학 <strong>{maxStats.prosperity_theology.toFixed(2)}</strong></span>
                <span className="scale-guide-item">정치적 동원성 <strong>{maxStats.political_mobilization.toFixed(2)}</strong></span>
                <span className="scale-guide-item">권위주의 통제성 <strong>{maxStats.authoritarian_control.toFixed(2)}</strong></span>
              </div>
            </div>

            <div className="dashboard-grid">
              {processedData.map((church, index) => (
                <ChurchCard key={church.church} church={church} maxStats={maxStats} />
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'compare' && (
          <CompareView 
            data={processedData} 
            overallStats={overallStats} 
            selectedChannel={selectedChannel} 
          />
        )}

        {currentView === 'scatter' && (
          <ScatterPlotView 
            data={processedData} 
            selectedChannel={selectedChannel} 
          />
        )}
      </div>
    </div>
  );
};

export default OrientationDashboard;
