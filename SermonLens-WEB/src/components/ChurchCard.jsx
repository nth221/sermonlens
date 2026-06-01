import React from 'react';
import DimensionChart from './DimensionChart';

const ChurchCard = ({ church, maxStats }) => {
  const { masked_name, total_sermons, dimension_stats } = church;

  return (
    <div className="card church-card">
      <div className="church-card-header">
        <h3 className="church-name">{masked_name}</h3>
        <p className="church-meta">분석된 설교 수: {total_sermons}편</p>
      </div>
      <div className="church-card-body">
        <div className="stats-list">
          <div className="stat-row">
            <span className="stat-label">공공신학 (평균)</span>
            <span className="stat-value">{dimension_stats.public_theology.mean.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">번영신학 (평균)</span>
            <span className="stat-value">{dimension_stats.prosperity_theology.mean.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">정치적 동원성 (평균)</span>
            <span className="stat-value">{dimension_stats.political_mobilization.mean.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">권위주의 통제성 (평균)</span>
            <span className="stat-value">{dimension_stats.authoritarian_control.mean.toFixed(2)}</span>
          </div>
        </div>
        
        <DimensionChart stats={dimension_stats} maxStats={maxStats} />
      </div>
    </div>
  );
};

export default ChurchCard;
