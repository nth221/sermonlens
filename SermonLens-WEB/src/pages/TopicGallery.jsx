import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import WordCloudChart from 'react-d3-cloud';
import * as d3 from 'd3';
import topicKeywords from '../data/topicmodel/global_topic_keywords_ctfidf.json';

// --- Shared WordCloud Component (Matching WordCloudResults.jsx Logic) ---
const WordCloud = ({ 
  words, 
  minFontSize = 10, 
  maxFontSize = 32, 
  delay = 0, 
  width = 160, 
  height = 160, 
  limit = 20, 
  padding = 1,
  squashFactor = 0.7 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(false);
    const timer = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timer);
  }, [delay, width, height, limit, words?.length]);

  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeTableau10), []);

  const data = useMemo(() => {
    if (!words || words.length === 0) return [];
    // Data format: [{word: string, score: number}, ...]
    const sorted = [...words].sort((a, b) => b.score - a.score);
    const maxVal = sorted[0]?.score || 0;
    if (maxVal === 0) return [];

    return sorted
      .slice(0, limit)
      .map((w, i) => ({ 
        text: w.word, 
        rank: i,
        // Match WordCloudResults.jsx normalization logic
        value: (Math.pow(w.score, squashFactor) / Math.pow(maxVal, squashFactor)) * 100
      }));
  }, [words, limit, squashFactor]);

  const getRotation = (d) => {
    const hash = d.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 30) - 15;
  };

  if (!words || words.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-300 text-[10px] italic">Empty</div>
  );

  if (!shouldRender) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/30 rounded-xl">
      <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div className="w-full h-full pointer-events-none">
        <WordCloudChart
          data={data}
          width={width}
          height={height}
          font="Pretendard, sans-serif"
          fontSize={(word) => (word.value / 100) * (maxFontSize - minFontSize) + minFontSize}
          rotate={getRotation}
          spiral="archimedean"
          padding={padding}
          fill={(d, i) => colorScale(i)}
        />
      </div>
    </motion.div>
  );
};

const TopicGallery = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTopics = useMemo(() => {
    const entries = Object.entries(topicKeywords);
    if (!searchTerm) return entries;
    return entries.filter(([id, words]) => {
      const topicMatches = id.includes(searchTerm);
      const keywordMatches = words.some(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()));
      return topicMatches || keywordMatches;
    });
  }, [searchTerm]);

  return (
    <div className="dashboard-wrapper main-content">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="flex justify-between items-end w-full">
          <div className="title-area">
            <h2 className="page-title">토픽 키워드 갤러리</h2>
            <p className="page-description">c-TF-IDF 알고리즘으로 분석된 클러스터별 핵심 주제 지형도입니다.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="search-box-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="토픽 번호 또는 키워드 검색..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto">
        <div className="grid grid-cols-2 sm-grid-cols-2 lg-grid-cols-4 xl-grid-cols-6 gap-6">
          {filteredTopics.map(([topicId, words], idx) => (
            <div key={topicId} className="topic-card-premium group">
              {/* Header: Topic Title (Centered) */}
              <div className="topic-card-header">
                <span className="topic-id-badge">Topic {topicId}</span>
              </div>
              
              {/* Body: WordCloud */}
              <div className="topic-card-body">
                <div className="wordcloud-container">
                  <WordCloud 
                    words={words} 
                    minFontSize={10} 
                    maxFontSize={28} 
                    delay={idx * 30} 
                    width={160}
                    height={160}
                    limit={15}
                    padding={1}
                    squashFactor={0.65}
                  />
                </div>
              </div>
              
              {/* Footer: Hashtags (Top 3) */}
              <div className="topic-card-footer">
                <div className="topic-hashtags">
                  {words.slice(0, 3).map((w, i) => (
                    <span key={i} className="hashtag-item">
                      #{w.word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 text-slate-300">
            <Search size={64} className="mb-4 opacity-10" />
            <p className="text-lg font-medium">일치하는 토픽을 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      <style>{`
        .topic-card-premium {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 1.5rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          position: relative;
          overflow: hidden;
        }

        .topic-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
          border-color: var(--color-brand-primary-light, #e2e8f0);
        }

        .topic-card-header {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .topic-id-badge {
          background: #f1f5f9;
          color: #334155;
          font-size: 0.85rem;
          font-weight: 900;
          padding: 0.4rem 1.2rem;
          border-radius: 2rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }

        .topic-card-premium:hover .topic-id-badge {
          background: var(--color-brand-primary);
          color: white;
          border-color: var(--color-brand-primary);
        }

        .topic-card-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wordcloud-container {
          aspect-ratio: 1 / 1;
          width: 100%;
          background: #fcfdfe;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .topic-card-premium:hover .wordcloud-container {
          background: #fff;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.02);
        }

        .topic-card-footer {
          display: flex;
          justify-content: center;
        }

        .topic-hashtags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .hashtag-item {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          transition: all 0.3s ease;
        }

        .topic-card-premium:hover .hashtag-item {
          color: var(--color-brand-primary);
        }

        /* Search Box Styles */
        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0 1.25rem;
          width: 320px;
          height: 48px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .search-box-wrapper:focus-within {
          border-color: var(--color-brand-primary);
          box-shadow: 0 0 0 4px rgba(15, 76, 129, 0.1);
          width: 380px;
        }

        .search-icon {
          color: #94a3b8;
          margin-right: 1rem;
        }

        .search-input {
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1e293b;
          width: 100%;
          outline: none;
        }

        .search-input::placeholder {
          color: #cbd5e1;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};

export default TopicGallery;
