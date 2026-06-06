import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart2, TrendingUp, Orbit, Loader2 } from 'lucide-react';
import WordCloudChart from 'react-d3-cloud';
import * as d3 from 'd3';

import '../styles/UniverseBackground.css';

// ── 워드클라우드 설정 (Aesthetics 관련 설정) ───────────────────────────
const WC_CONFIG = {
  minFontSize: 20,      // 최소 폰트 크기
  maxFontSize: 160,     // 최대 폰트 크기
  limit: 500,           // 단어 표시 개수
  padding: 1,           // 단어 간 간격
  rotate: 0,            // 회전 각도
  delay: 0,            // 렌더링 지연 시간 (ms)
  squashFactor: 0.55     // 1.0(선형) ~ 0.3(강한 압축). 하나님 같은 거대 단어 보정용.
};

// ── WordCloud 내부 렌더러 (레이아웃 재계산 방지를 위해 메모이제이션) ──────────
const WordCloudInner = React.memo(({ data, width, height, minFontSize, maxFontSize, spiral, rotate, padding, onHover }) => {
  // 프리미엄 컬러 스케일 (연속적인 그라데이션)
  const colorScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([1, 10, 50, 150, 400]) // 순위별 분기점
      .range(['#ffffff', '#a5b4fc', '#818cf8', '#6366f1', '#1e293b']) // 대응 색상
      .interpolate(d3.interpolateRgb);
  }, []);

  // 비네팅 투명도 처리 포함
  const getWordColor = (d) => {
    // 1. 연속적인 그라데이션 색상 추출
    const baseColor = colorScale(d.rank);

    // 2. 가장자리 투명도 계산 (중앙에서의 거리 기준)
    const dist = Math.sqrt(d.x * d.x + d.y * d.y);
    const maxDist = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
    const opacityFactor = Math.max(0.15, 1 - (dist / maxDist) * 1.3);

    // 3. 투명도 적용
    const c = d3.color(baseColor);
    c.opacity = opacityFactor;
    return c.toString();
  };

  const getRotation = useCallback((d) => {
    const hash = d.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 30) - 15; 
  }, []);

  return (
    <div className="wc-inner-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* SVG 글로우 필터 */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="word-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
      
      <WordCloudChart
        data={data}
        width={width}
        height={height}
        font="Pretendard, sans-serif"
        spiral={spiral}
        fontSize={(word) => (word.value / 100) * (maxFontSize - minFontSize) + minFontSize}
        rotate={getRotation}
        padding={padding}
        fill={getWordColor}
        onWordMouseOver={(e, d) => onHover(d)}
        onWordMouseOut={() => onHover(null)}
      />
      
      <style>{`
        .wc-inner-wrapper svg text {
          filter: url(#word-glow);
          transition: opacity 0.4s ease !important;
          cursor: pointer !important;
          font-weight: 800;
          pointer-events: all !important;
        }
        
        /* 상위 5개 단어: 더 빠른 속도로 역동적으로 호흡 (약 2~2.5초 주기) */
        .wc-inner-wrapper svg text:nth-child(1) { animation: breathing 2.5s ease-in-out infinite alternate; }
        .wc-inner-wrapper svg text:nth-child(2) { animation: breathing 2.1s ease-in-out infinite alternate-reverse; animation-delay: 0.2s; }
        .wc-inner-wrapper svg text:nth-child(3) { animation: breathing 2.3s ease-in-out infinite alternate; animation-delay: 0.5s; }
        .wc-inner-wrapper svg text:nth-child(4) { animation: breathing 1.9s ease-in-out infinite alternate-reverse; animation-delay: 0.3s; }
        .wc-inner-wrapper svg text:nth-child(5) { animation: breathing 2.6s ease-in-out infinite alternate; animation-delay: 0.7s; }

        @keyframes breathing {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        /* 호버 시 색상 변화 없이 정보만 띄우도록 하이라이트 제거 */
        .wc-inner-wrapper svg text:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}, (prev, next) => {
  return prev.data === next.data && prev.width === next.width && prev.height === next.height;
});

// ── WordCloud 포장지 ─────────────────────────────────────────────────────────
const WordCloud = ({ 
  words, 
  minFontSize = WC_CONFIG.minFontSize, 
  maxFontSize = WC_CONFIG.maxFontSize, 
  delay = WC_CONFIG.delay, 
  width, 
  height, 
  limit = WC_CONFIG.limit,
  padding = WC_CONFIG.padding,
  spiral = 'archimedean', // 중앙 집약형 나선 강제
  rotate = WC_CONFIG.rotate,
  squashFactor = WC_CONFIG.squashFactor,
  onHover 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(false);
    const timer = setTimeout(() => setShouldRender(true), delay || 50);
    return () => clearTimeout(timer);
  }, [delay, width, height, limit, words.length]);

  const data = useMemo(() => {
    if (!words || words.length === 0) return [];
    // 확실한 내림차순 정렬 (중앙 배치를 위해)
    const sorted = [...words].sort((a, b) => b.value - a.value);
    const maxVal = sorted[0]?.value || 0;
    
    return sorted
      .slice(0, limit)
      .map((w, i) => ({
        text: w.text,
        rank: i + 1,
        rawValue: w.value,
        value: (Math.pow(w.value, squashFactor) / Math.pow(maxVal, squashFactor)) * 100,
      }));
  }, [words, limit, squashFactor]);

  if (!words || words.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-300 text-[10px] italic">Empty</div>
  );

  if (!shouldRender || !width || !height) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(2, 6, 23, 0.2)', backdropFilter: 'blur(8px)', borderRadius: '2rem' }}
    >
      <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Orbit className="text-indigo-400 opacity-40" size={64} style={{ animation: 'spin 4s linear infinite' }} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p style={{ color: '#fff', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analyzing Star Clusters</p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>데이터 성단을 재구성하고 있습니다...</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
    >
      <div className="w-full h-full cursor-default">
        <WordCloudInner
          data={data}
          width={width}
          height={height}
          minFontSize={minFontSize}
          maxFontSize={maxFontSize}
          spiral={spiral}
          rotate={rotate}
          padding={padding}
          onHover={onHover}
        />
      </div>
    </motion.div>
  );
};

// ── 키워드 랭킹 바 ─────────────────────────────────────────────────────────────
const WordRanking = ({ words, limit = 20, offset = 0 }) => {
  const allSorted = useMemo(() =>
    [...words].sort((a, b) => b.value - a.value),
    [words]
  );
  const slice = allSorted.slice(offset, offset + limit);
  const max = allSorted[0]?.value || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {slice.map((w, i) => (
        <div key={w.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            minWidth: '1.8rem', fontSize: '0.72rem', fontWeight: '900', textAlign: 'right',
            color: (offset + i) < 3 ? 'var(--color-brand-primary)' : '#94a3b8',
          }}>
            {offset + i + 1}
          </span>
          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${(w.value / max) * 100}%`, height: '100%', borderRadius: '100px',
              background: (offset + i) < 3
                ? 'linear-gradient(90deg, var(--color-brand-primary), #6366f1)'
                : '#cbd5e1',
            }} />
          </div>
          <span style={{ minWidth: '4rem', fontSize: '0.84rem', fontWeight: '700', color: '#334155' }}>{w.text}</span>
          <span style={{ minWidth: '3.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
            {w.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const CorpusWordCloud = ({ onClose }) => {
  const [weightType, setWeightType] = useState('freq');
  const [selectedTab, setSelectedTab] = useState('cloud');
  const [hoveredWord, setHoveredWord] = useState(null);
  const [corpusData, setCorpusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const bodyRef = useRef(null);
  const [cloudSize, setCloudSize] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Load corpus data asynchronously
  useEffect(() => {
    const loadCorpus = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/wordcloud/corpus.json`);
        const data = await res.json();
        setCorpusData(data);
      } catch (err) {
        console.error("Failed to load corpus data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCorpus();
  }, []);

  // 마우스 이동 감지
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // 스크롤바 예약 여백(scrollbar-gutter) 제거 로직
  useEffect(() => {
    // 마운트 시: 전역 스크롤바 예약 여백 제거
    const originalGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = 'auto';
    
    // 바디 스크롤 방지
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      // 언마운트 시: 복구
      document.documentElement.style.scrollbarGutter = originalGutter;
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 남은 공간을 자동으로 측정하는 로직
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCloudSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // corpus.json에서 NNG + NNP 단어 추출
  const words = useMemo(() => {
    if (!corpusData || !corpusData[weightType]) return [];
    const result = [];
    ['NNG', 'NNP'].forEach(pos => {
      const posData = corpusData[weightType][pos];
      if (posData) {
        Object.entries(posData).forEach(([text, value]) =>
          result.push({ text, value: Number(value) })
        );
      }
    });
    return result;
  }, [corpusData, weightType]);

  const topWord = useMemo(() =>
    [...words].sort((a, b) => b.value - a.value)[0],
    [words]
  );

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', 
      height: '100vh', width: '100vw', 
      overflow: 'hidden', padding: 0, margin: 0,
      background: '#020617',
      color: '#f8fafc',
      scrollbarGutter: 'auto'
    }} onMouseMove={handleMouseMove}>
      {/* ── 자연스러운 우주 배경 (메시 + 다층 별무리) ── */}
      <div className="universe-bg-container">
        <div className="glass-bg-blob blob-1"></div>
        <div className="glass-bg-blob blob-2"></div>
        <div className="glass-bg-blob blob-3"></div>
        
        {/* 다층 별무리 (CSS 파일에서 제어) */}
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>

      <style>{`
        /* 호버 효과 (가장 강력한 선택자) */
        .wc-container svg g text { 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; 
          pointer-events: all !important; 
          cursor: pointer !important;
        }
        .wc-container svg g text:hover {
          fill: #22d3ee !important;
          filter: drop-shadow(0 0 12px rgba(34, 211, 238, 1)) !important;
          transform: scale(1.15) !important;
          stroke: #22d3ee !important;
          stroke-width: 0.5px !important;
          opacity: 1 !important;
        }

        .dark-glass-header { backdrop-filter: blur(20px) saturate(150%); background: rgba(2, 6, 23, 0.7); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .dark-glass-pill { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 4px; display: flex; gap: 4px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
        .dark-glass-btn { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 8px 18px; color: #f1f5f9; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 8px; }
        .dark-glass-btn:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.3); }
        
        .wc-weight-btn { color: #94a3b8; transition: all 0.2s; font-size: 0.8rem; border: none; background: transparent; cursor: pointer; }
        .wc-weight-btn.active { background: #6366f1 !important; color: white !important; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
      `}</style>

      {/* ── 다크 헤더 ── */}
      <div className="dark-glass-header" style={{ flexShrink: 0, padding: '1.25rem 2.5rem', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="title-area">
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              표본 통합 워드클라우드
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '700' }}>
                {corpusData ? `${corpusData.document_count.toLocaleString()} SERMONS` : 'LOADING...'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {corpusData ? `${words.length.toLocaleString()} KEYWORDS` : '--'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="dark-glass-pill">
              <button onClick={() => setWeightType('freq')} className={`wc-weight-btn ${weightType === 'freq' ? 'active' : ''}`} style={{ borderRadius: '10px', padding: '6px 18px', border: 'none', cursor: 'pointer' }}>빈도수</button>
              <button onClick={() => setWeightType('tfidf')} className={`wc-weight-btn ${weightType === 'tfidf' ? 'active' : ''}`} style={{ borderRadius: '10px', padding: '6px 18px', border: 'none', cursor: 'pointer' }}>중요도</button>
            </div>
            
            <div className="dark-glass-pill">
              <button onClick={() => setSelectedTab('cloud')} className={`wc-weight-btn ${selectedTab === 'cloud' ? 'active' : ''}`} style={{ borderRadius: '10px', padding: '6px 18px', border: 'none', cursor: 'pointer' }}>시각화</button>
              <button onClick={() => setSelectedTab('ranking')} className={`wc-weight-btn ${selectedTab === 'ranking' ? 'active' : ''}`} style={{ borderRadius: '10px', padding: '6px 18px', border: 'none', cursor: 'pointer' }}>랭킹</button>
            </div>

            <button onClick={onClose} className="dark-glass-btn">
              <ChevronLeft size={18} />
              나가기
            </button>
          </div>
        </div>
      </div>

      {/* ── 바디 (다크 캔버스) ── */}
      <div ref={bodyRef} style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
            >
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              <p className="text-indigo-200 font-bold tracking-widest uppercase text-xs">Loading Universe Data</p>
            </motion.div>
          ) : selectedTab === 'cloud' ? (
            <motion.div
              key={`cloud-${weightType}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', padding: '1rem'
              }}
            >
              <WordCloud
                words={words}
                width={cloudSize.width}
                height={cloudSize.height}
                onHover={setHoveredWord}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`ranking-${weightType}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
                padding: '1.5rem 4rem', // 상하 패딩 축소
                overflowY: 'auto',
              }}
            >
              {[0, 20].map((offset, idx) => (
                <div key={offset} className="dark-glass-pill" style={{ 
                  flexDirection: 'column', padding: '1.25rem 1.75rem', height: 'fit-content', // 패딩 축소
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#f1f5f9', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} color="#6366f1" />
                    TOP {offset + 1} — {offset + 20}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}> {/* 간격 축소 */}
                    {words.sort((a, b) => b.value - a.value).slice(offset, offset + 20).map((w, i) => {
                      const rank = offset + i + 1;
                      const maxVal = words[0]?.value || 1;
                      return (
                        <div key={w.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ minWidth: '1.8rem', fontSize: '0.75rem', fontWeight: '900', color: rank <= 3 ? '#6366f1' : '#475569', textAlign: 'right' }}>
                            {rank}
                          </span>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${(w.value / maxVal) * 100}%`, height: '100%',
                              background: rank <= 3 ? 'linear-gradient(90deg, #6366f1, #a855f7)' : '#334155',
                              boxShadow: rank <= 3 ? '0 0 10px rgba(99, 102, 241, 0.2)' : 'none'
                            }} />
                          </div>
                          <span style={{ minWidth: '4.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>{w.text}</span>
                          <span style={{ minWidth: '3.5rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {w.value.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 툴팁 오버레이 (마우스 추적 래퍼 분리) ── */}
      <AnimatePresence>
        {hoveredWord && (
          <div 
            style={{
              position: 'fixed',
              top: mousePos.y, 
              left: mousePos.x,
              pointerEvents: 'none',
              zIndex: 10000,
              transform: 'translate(-50%, -100%)', // 하단 중앙을 커서에 맞춤
              marginTop: '-25px' // 커서로부터의 수직 거리 확보
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.4)', // 투명도 약간 강화 (0.95 -> 0.8)
                color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '1rem',
                backdropFilter: 'blur(3px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)',
                minWidth: 'max-content'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                Rank #{hoveredWord.rank}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '4px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {hoveredWord.text}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: '800' }}>
                {hoveredWord.rawValue.toLocaleString()} <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>SCORE</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CorpusWordCloud;
