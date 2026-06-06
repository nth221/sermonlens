import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import CorpusWordCloud from './CorpusWordCloud';
import WordCloud from '../components/WordCloud';
import { maskChurchName } from '../utils/masking';

// ── 워드클라우드 설정 ────────────────────────────────────────────────────────
const WC_CONFIG = {
  CHURCH: {             // 갤러리 목록 (교회별)
    minFontSize: 10,
    maxFontSize: 32,
    limit: 80,
    padding: 1,
    squashFactor: 0.6   // 빈도 보정 (0.5 ~ 1.0)
  },
  SERMON: {             // 상세 리스트 (설교별)
    minFontSize: 8,
    maxFontSize: 24,
    limit: 70,
    padding: 0.3,
    squashFactor: 0.6
  }
};



const WordCloudResults = () => {
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [weightType, setWeightType] = useState('freq');
  const [showCorpus, setShowCorpus] = useState(false);
  const [churches, setChurches] = useState([]);
  const [sermonIndex, setSermonIndex] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadedSermonData, setLoadedSermonData] = useState({});
  const [isLoadingSermons, setIsLoadingSermons] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Load church and sermon index asynchronously
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 1. Load the index
        const indexRes = await fetch(`${import.meta.env.BASE_URL}data/wordcloud/index.json`);
        const indexData = await indexRes.json();
        setSermonIndex(indexData.sermons);

        // 2. Load all church metadata in parallel
        const churchMetadata = await Promise.all(
          indexData.churches.map(async (churchId) => {
            const res = await fetch(`${import.meta.env.BASE_URL}data/wordcloud/church/${churchId}.json`);
            const data = await res.json();
            const displayName = maskChurchName(data.church);
            return {
              fullId: data.church,
              displayName,
              maskedName: displayName,
              total_sermons: data.sermon_count,
              tfidf: data
            };
          })
        );
        
        setChurches(churchMetadata.sort((a, b) => b.total_sermons - a.total_sermons));
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const currentSermons = useMemo(() => {
    if (!selectedChurch || !sermonIndex[selectedChurch.fullId]) return [];
    return sermonIndex[selectedChurch.fullId].map(id => ({
      sermon_id: id,
      path: `/data/wordcloud/sermon/${selectedChurch.fullId}/${id}.json`
    }));
  }, [selectedChurch, sermonIndex]);

  const totalPages = Math.ceil(currentSermons.length / PAGE_SIZE);

  const paginatedSermons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return currentSermons.slice(start, start + PAGE_SIZE);
  }, [currentSermons, currentPage]);

  useEffect(() => {
    const loadCurrentSermons = async () => {
      if (!selectedChurch) return;
      setIsLoadingSermons(true);
      const newSermonData = { ...loadedSermonData };
      let updated = false;

      // Only load sermons for the CURRENT page to save memory and time
      const promises = paginatedSermons.map(async (sermon) => {
        if (newSermonData[sermon.sermon_id]) return;
        try {
          const res = await fetch(sermon.path.replace('/data/', `${import.meta.env.BASE_URL}data/`));
          newSermonData[sermon.sermon_id] = await res.json();
          updated = true;
        } catch (e) { console.error("Sermon load error:", e); }
      });

      if (promises.length > 0) {
        await Promise.all(promises);
        if (updated) setLoadedSermonData(newSermonData);
      }
      setIsLoadingSermons(false);
    };
    
    loadCurrentSermons();
  }, [selectedChurch, currentPage, paginatedSermons]);

  const getWordsFromData = (data, type = 'freq') => {
    if (!data || !data[type]) return [];
    const words = [];
    ['NNG', 'NNP'].forEach(pos => {
      if (data[type][pos]) Object.entries(data[type][pos]).forEach(([text, value]) => words.push({ text, value }));
    });
    return words;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showCorpus) {
    return <CorpusWordCloud onClose={() => setShowCorpus(false)} />;
  }

  if (selectedChurch) {
    return (
      <div className="dashboard-wrapper main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            <div className="title-area">
              <button onClick={() => setSelectedChurch(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
                <ChevronLeft size={18} />
                <span>갤러리로 돌아가기</span>
              </button>
              <h2 className="page-title" style={{ marginBottom: '0.25rem' }}>{selectedChurch.displayName} 분석 리포트</h2>
              <p className="page-description" style={{ fontSize: '0.9rem', color: '#64748b' }}>총 <span style={{ fontWeight: 700, color: '#334155' }}>{selectedChurch.total_sermons}</span>개의 설교 중 <span style={{ fontWeight: 700, color: '#334155' }}>{currentPage}</span>페이지를 조회 중입니다.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div className="wc-weight-toggle">
                <button onClick={() => setWeightType('freq')} className={`wc-weight-btn ${weightType === 'freq' ? 'active' : ''}`}>빈도수</button>
                <button onClick={() => setWeightType('tfidf')} className={`wc-weight-btn ${weightType === 'tfidf' ? 'active' : ''}`}>중요도</button>
              </div>

              {totalPages > 1 && (
                <div className="wc-weight-toggle" style={{ padding: '6px 12px', alignItems: 'center', gap: '15px' }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    style={{ opacity: currentPage === 1 ? 0.2 : 1, display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: '900', minWidth: '70px', textAlign: 'center', color: 'var(--color-brand-primary)' }}>
                    {currentPage} <span style={{ color: '#cbd5e1', fontWeight: '400', margin: '0 4px' }}>/</span> {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    style={{ opacity: currentPage === totalPages ? 0.2 : 1, transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', padding: '4px' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoadingSermons ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <p className="text-slate-500 font-bold">대량의 분석 데이터를 처리하고 있습니다...</p>
            </motion.div>
          ) : (
            <motion.main key={`page-${currentPage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto">
              <div className="wc-grid-4">
                {paginatedSermons.map((sermon, idx) => {
                  const sermonTfidf = loadedSermonData[sermon.sermon_id];
                  return (
                    <div key={sermon.sermon_id} className="card p-3 bg-white flex flex-col gap-4">
                      <div className="px-3 pt-3">
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sermon.sermon_id}</h4>
                      </div>
                      <div style={{ aspectRatio: '1/1', width: '100%', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <WordCloud 
                          words={sermonTfidf ? getWordsFromData(sermonTfidf, weightType) : []} 
                          minFontSize={WC_CONFIG.SERMON.minFontSize} 
                          maxFontSize={WC_CONFIG.SERMON.maxFontSize} 
                          delay={idx * 60} 
                          width={130}
                          height={130}
                          limit={WC_CONFIG.SERMON.limit}
                          padding={WC_CONFIG.SERMON.padding}
                          squashFactor={WC_CONFIG.SERMON.squashFactor}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="wc-pagination-container">
                  <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="wc-pagination-btn">
                    <ChevronLeft size={18} />
                    PREV
                  </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, and 5 pages around current page
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 5 && pageNum <= currentPage + 5)) {
                          return (
                            <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`wc-page-num ${currentPage === pageNum ? 'active' : ''}`}>
                              {pageNum}
                            </button>
                          );
                        }
                        // Ellipsis for breaks
                        if (pageNum === currentPage - 6 || pageNum === currentPage + 6) return <span key={pageNum} style={{ alignSelf: 'center', color: '#cbd5e1' }}>...</span>;
                        return null;
                      })}
                    </div>
                  <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="wc-pagination-btn">
                    NEXT
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper main-content">
      <div className="page-header" style={{ overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', overflow: 'visible' }}>
          <div>
            <h2 className="page-title">WordCloud Gallery</h2>
            <p className="page-description">분석 완료된 교회의 설교 키워드 지형도입니다.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: '4px', overflow: 'visible', paddingBottom: '30px' }}>
            <div className="wc-weight-toggle">
              <button onClick={() => setWeightType('freq')} className={`wc-weight-btn ${weightType === 'freq' ? 'active' : ''}`}>빈도수</button>
              <button onClick={() => setWeightType('tfidf')} className={`wc-weight-btn ${weightType === 'tfidf' ? 'active' : ''}`}>중요도</button>
            </div>
            <button
              id="corpus-wordcloud-btn"
              onClick={() => setShowCorpus(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 22px', borderRadius: '1rem',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
                color: '#fff',
                fontWeight: '800', fontSize: '0.875rem',
                border: '1px solid rgba(165, 180, 252, 0.2)',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                zIndex: 1,
                overflow: 'visible'
              }}
            >
              <style>{`
                #corpus-wordcloud-btn:hover {
                  transform: scale(1.1) !important;
                  box-shadow: 
                    0 0 20px rgba(99, 102, 241, 0.6), 
                    0 0 40px rgba(165, 180, 252, 0.3),
                    inset 0 0 12px rgba(255, 255, 255, 0.2) !important;
                  border-color: rgba(165, 180, 252, 0.8) !important;
                  z-index: 100 !important;
                }
                #corpus-wordcloud-btn:hover .portal-glow-layer {
                  opacity: 1 !important;
                }
                #corpus-wordcloud-btn:hover span, 
                #corpus-wordcloud-btn:hover svg {
                  text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 5px rgba(255, 255, 255, 0.5) !important;
                  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) !important;
                  color: #fff !important;
                }
              `}</style>

              <div 
                className="portal-glow-layer"
                style={{
                  position: 'absolute', inset: '-1px', borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
                  opacity: 0, transition: 'opacity 0.25s ease',
                  zIndex: 1, pointerEvents: 'none'
                }} 
              />

              <Sparkles size={18} style={{ color: '#a5b4fc', filter: 'drop-shadow(0 0 5px rgba(165, 180, 252, 0.8))', position: 'relative', zIndex: 2 }} />
              <span style={{ letterSpacing: '-0.01em', textShadow: '0 0 8px rgba(255,255,255,0.3)', position: 'relative', zIndex: 2 }}>표본 통합 워드클라우드</span>
              
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '1rem', pointerEvents: 'none', zIndex: 1 }}>
                <div style={{ 
                  position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)'
                }} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <main className="container mx-auto">
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-bold text-lg">교회별 분석 데이터를 구성하고 있습니다...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {churches.map((church, idx) => (
              <div key={church.fullId} onClick={() => setSelectedChurch(church)} className="card p-3 bg-white flex flex-col gap-6 cursor-pointer">
                <div className="px-3 pt-3 flex justify-between items-center">
                  <h4 className="church-name" style={{ margin: 0 }}>{church.displayName}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94a3b8', background: '#f8fafc', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.05em' }}>{church.total_sermons} Sermons</span>
                </div>
                <div style={{ aspectRatio: '1/1', width: '100%', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <WordCloud 
                    words={getWordsFromData(church.tfidf, weightType)} 
                    minFontSize={WC_CONFIG.CHURCH.minFontSize} 
                    maxFontSize={WC_CONFIG.CHURCH.maxFontSize} 
                    delay={idx * 100}
                    width={200}
                    height={200}
                    limit={WC_CONFIG.CHURCH.limit}
                    padding={WC_CONFIG.CHURCH.padding}
                    squashFactor={WC_CONFIG.CHURCH.squashFactor}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WordCloudResults;
