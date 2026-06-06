import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const OrientationGuide = () => {
  const [activeIndicator, setActiveIndicator] = useState('public_theology');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [guideData, setGuideData] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/orientation/orientationGuideData.json`)
      .then(res => res.json())
      .then(data => setGuideData(data))
      .catch(err => console.error("Failed to load guide data:", err));
  }, []);

  if (!guideData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = guideData[activeIndicator];

  const indicators = [
    { id: 'public_theology', label: '공공신학', color: '#3b82f6' },
    { id: 'prosperity_theology', label: '번영신학', color: '#f59e0b' },
    { id: 'political_mobilization', label: '정치적 동원', color: '#10b981' },
    { id: 'authoritarian_control', label: '권위주의 통제', color: '#ef4444' },
  ];

  return (
    <div className="guide-wrapper">
      <div className="page-header">
        <h2 className="page-title">지향성 지수 가이드 (Metric Guide)</h2>
        <p className="page-description">
          SermonLens의 지향성 지수 분석이 기반하고 있는 학술적 쟁점과 측정 기준을 설명합니다.
        </p>
      </div>

      {/* Indicator Tabs */}
      <div className="guide-tabs">
        {indicators.map((ind) => (
          <button
            key={ind.id}
            className={`guide-tab ${activeIndicator === ind.id ? 'active' : ''}`}
            onClick={() => {
              setActiveIndicator(ind.id);
              setExpandedQuestion(null);
            }}
            style={{ 
              '--active-color': ind.color,
              borderBottomColor: activeIndicator === ind.id ? ind.color : 'transparent'
            }}
          >
            {ind.label}
          </button>
        ))}
      </div>

      <div className="guide-content-area">
        {/* Hero Section */}
        <div className="guide-hero">
          <div className="guide-hero-badge" style={{ backgroundColor: indicators.find(i => i.id === activeIndicator).color }}>
            Metric Profile
          </div>
          <h3 className="guide-indicator-title">{data.title}</h3>
          <p className="guide-indicator-summary">{data.summary}</p>
        </div>

        <div className="guide-grid">
          {/* Key Issues */}
          <section className="guide-section">
            <div className="section-title-wrapper">
              <BookOpen className="section-icon" />
              <h4 className="section-title">핵심 쟁점 및 이론적 배경</h4>
            </div>
            <div className="issue-cards">
              {data.issues.map((issue, idx) => (
                <div key={idx} className="issue-card">
                  <div className="issue-card-header">
                    <span className="issue-number">{idx + 1}</span>
                    <h5 className="issue-title">{issue.title}</h5>
                  </div>
                  <p className="issue-desc">{issue.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Measurement Questions */}
          <section className="guide-section">
            <div className="section-title-wrapper">
              <HelpCircle className="section-icon" />
              <h4 className="section-title">분석 질문 및 학술적 근거</h4>
            </div>
            <div className="question-accordion">
              {data.questions.map((q) => (
                <div key={q.id} className={`question-item ${expandedQuestion === q.id ? 'expanded' : ''}`}>
                  <button 
                    className="question-trigger"
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                  >
                    <span className="q-badge">Q{q.id}</span>
                    <span className="q-text">{q.question}</span>
                    {expandedQuestion === q.id ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </button>
                  {expandedQuestion === q.id && (
                    <div className="question-body">
                      <div className="q-basis">
                        <span className="label">학술적 근거:</span> 
                        {q.basis.includes('인용:') ? (
                          <>
                            {q.basis.split('인용:')[0]}
                            <div className="q-quote">
                              <span className="font-bold">인용:</span> {q.basis.split('인용:')[1]}
                            </div>
                          </>
                        ) : (
                          q.basis
                        )}
                      </div>
                      <div className="q-reason">
                        <span className="label">판단 사유:</span> {q.reason}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Bibliography */}
          <section className="guide-section">
            <div className="section-title-wrapper">
              <FileText className="section-icon" />
              <h4 className="section-title">참고 문헌 (Bibliography)</h4>
            </div>
            <ul className="ref-list">
              {data.references.map((ref, idx) => (
                <li key={idx} className="ref-item">
                  <span className="ref-marker">[{idx + 1}]</span>
                  <span className="ref-text">{ref}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrientationGuide;
