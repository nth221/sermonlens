import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Cloud, Map as MapIcon, Info, ChevronLeft, ChevronRight, 
  Loader2, AlertCircle, BarChart3, FileText, CheckCircle2 
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, LabelList
} from 'recharts';

// Data imports

import { maskChurchName } from '../utils/masking';
import ScatterPlotView from '../components/ScatterPlotView';
import WordCloud from '../components/WordCloud';

// WordCloud configurations
const WC_CONFIG = {
  CHURCH: {
    minFontSize: 14,
    maxFontSize: 42,
    limit: 60,
    padding: 1.2,
    squashFactor: 0.65
  },
  SERMON: {
    minFontSize: 8,
    maxFontSize: 24,
    limit: 50,
    padding: 0.5,
    squashFactor: 0.6
  }
};



// --- Custom Grouped Bar Chart to show Church vs Overall Average ---
const DimensionChartWithAverage = ({ stats, maxStats, overallStats }) => {
  if (!stats || !maxStats || !overallStats) return null;

  const data = [
    { 
      subject: '공공신학', 
      churchValue: (stats.public_theology.mean / maxStats.public_theology) * 100, 
      avgValue: (overallStats.public_theology / maxStats.public_theology) * 100,
      churchActual: stats.public_theology.mean,
      avgActual: overallStats.public_theology,
      color: '#3b82f6' 
    },
    { 
      subject: '번영신학', 
      churchValue: (stats.prosperity_theology.mean / maxStats.prosperity_theology) * 100, 
      avgValue: (overallStats.prosperity_theology / maxStats.prosperity_theology) * 100,
      churchActual: stats.prosperity_theology.mean,
      avgActual: overallStats.prosperity_theology,
      color: '#f59e0b' 
    },
    { 
      subject: '정치동원', 
      churchValue: (stats.political_mobilization.mean / maxStats.political_mobilization) * 100, 
      avgValue: (overallStats.political_mobilization / maxStats.political_mobilization) * 100,
      churchActual: stats.political_mobilization.mean,
      avgActual: overallStats.political_mobilization,
      color: '#10b981' 
    },
    { 
      subject: '권위주의', 
      churchValue: (stats.authoritarian_control.mean / maxStats.authoritarian_control) * 100, 
      avgValue: (overallStats.authoritarian_control / maxStats.authoritarian_control) * 100,
      churchActual: stats.authoritarian_control.mean,
      avgActual: overallStats.authoritarian_control,
      color: '#ef4444' 
    },
  ];

  return (
    <div className="chart-container" style={{ height: '280px', marginTop: '1.25rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
          <XAxis 
            dataKey="subject" 
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} 
            tickLine={false} 
            tick={{ fill: '#334155', fontSize: 18, fontWeight: 800 }}
            interval={0}
          />
          <YAxis type="number" hide domain={[0, 100]} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '10px', fontSize: '14px' }}
            formatter={(value, name, props) => {
              if (name === 'churchValue') {
                return [props.payload.churchActual.toFixed(2), '교회 평균'];
              }
              return [props.payload.avgActual.toFixed(2), '전체 평균 (정규화)'];
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={32} 
            formatter={(value) => {
              if (value === 'churchValue') return <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>교회 평균</span>;
              return <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>전체 평균 (정규화)</span>;
            }}
          />
          {/* Church score bar */}
          <Bar name="churchValue" dataKey="churchValue" radius={[4, 4, 0, 0]} barSize={36}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="churchActual" position="top" formatter={(val) => val.toFixed(2)} style={{ fontSize: '15px', fontWeight: 'bold', fill: '#1e293b' }} />
          </Bar>
          {/* Overall average bar */}
          <Bar name="avgValue" dataKey="avgValue" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} opacity={0.5}>
            <LabelList dataKey="avgActual" position="top" formatter={(val) => val.toFixed(2)} style={{ fontSize: '13px', fontWeight: '600', fill: '#64748b' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Main Page Component ---
const ChurchSummary = () => {
  const [selectedChurch, setSelectedChurch] = useState('');
  const [churchKeys, setChurchKeys] = useState([]);
  
  // WordCloud states
  const [wordcloudIndex, setWordcloudIndex] = useState(null);
  const [churchWordcloudData, setChurchWordcloudData] = useState(null);
  const [loadingWordcloud, setLoadingWordcloud] = useState(false);
  const [showSermonWordclouds, setShowSermonWordclouds] = useState(false);
  const [sermonWordclouds, setSermonWordclouds] = useState({});
  const [loadingSermons, setLoadingSermons] = useState(false);
  const [sermonPage, setSermonPage] = useState(1);
  const SERMON_PAGE_SIZE = 10;
  const [weightType, setWeightType] = useState('freq');

  const [sermonData, setSermonData] = useState([]);
  const [topicData, setTopicData] = useState({});
  const [topicKeywords, setTopicKeywords] = useState({});
  const [wordClusterPercentages, setWordClusterPercentages] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initialize unique church keys
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [sermonRes, topicRes, keywordsRes, wcIndexRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/orientation/sermonData.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_map.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_keywords_ctfidf.json`),
          fetch(`${import.meta.env.BASE_URL}data/wordcloud/index.json`)
        ]);
        const sData = await sermonRes.json();
        const tData = await topicRes.json();
        const kData = await keywordsRes.json();
        const wcIndexData = await wcIndexRes.json();

        setSermonData(sData);
        setTopicData(tData);
        setTopicKeywords(kData);
        setWordcloudIndex(wcIndexData);
        
        // Calculate wordClusterPercentages for 50% Sparsity Filter
        const rawTopicCount = Object.keys(kData).length || 1;
        const percentages = {};
        if (rawTopicCount > 0) {
          const wordFrequencies = {};
          Object.values(kData).forEach(wordsList => {
            wordsList.forEach(({ word }) => {
              wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
            });
          });
          for (const [word, count] of Object.entries(wordFrequencies)) {
            percentages[word] = (count / rawTopicCount) * 100;
          }
        }
        setWordClusterPercentages(percentages);

        const keys = new Set();
        sData.forEach(c => {
          if (c.church) keys.add(c.church);
        });

        Object.keys(tData).forEach(topicKey => {
          if (topicKey === 'outlier') return;
          const meta = tData[topicKey].meta || [];
          meta.forEach(m => {
            if (m.church) keys.add(m.church);
          });
        });

        if (wcIndexData.churches) {
          wcIndexData.churches.forEach(c => keys.add(c));
        }

        setChurchKeys(Array.from(keys).sort());
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to load ChurchSummary data:", err);
      }
    };

    loadAllData();
  }, []);

  // Fetch selected church's WordCloud data
  useEffect(() => {
    const fetchChurchWc = async () => {
      if (!selectedChurch || !wordcloudIndex) {
        setChurchWordcloudData(null);
        return;
      }
      
      const hasWc = wordcloudIndex.churches.includes(selectedChurch);
      if (!hasWc) {
        setChurchWordcloudData(null);
        return;
      }

      setLoadingWordcloud(true);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/wordcloud/church/${selectedChurch}.json`);
        const data = await res.json();
        setChurchWordcloudData(data);
      } catch (e) {
        console.error("Failed to load church wordcloud:", e);
        setChurchWordcloudData(null);
      } finally {
        setLoadingWordcloud(false);
      }
    };

    fetchChurchWc();
    setShowSermonWordclouds(true);
    setSermonWordclouds({});
    setSermonPage(1);
  }, [selectedChurch, wordcloudIndex]);

  // Process data for Orientation Index
  const orientationData = useMemo(() => {
    if (!selectedChurch || !isDataLoaded) return null;
    return sermonData.find(c => c.church === selectedChurch) || null;
  }, [selectedChurch, sermonData, isDataLoaded]);

  const maxStats = useMemo(() => {
    if (!isDataLoaded || sermonData.length === 0) return { public_theology: 1, prosperity_theology: 1, political_mobilization: 1, authoritarian_control: 1 };
    return {
      public_theology: Math.max(...sermonData.map(c => c.dimension_stats.public_theology.mean), 1),
      prosperity_theology: Math.max(...sermonData.map(c => c.dimension_stats.prosperity_theology.mean), 1),
      political_mobilization: Math.max(...sermonData.map(c => c.dimension_stats.political_mobilization.mean), 1),
      authoritarian_control: Math.max(...sermonData.map(c => c.dimension_stats.authoritarian_control.mean), 1),
    };
  }, [sermonData, isDataLoaded]);

  const overallStats = useMemo(() => {
    if (!isDataLoaded || sermonData.length === 0) return { public_theology: 0, prosperity_theology: 0, political_mobilization: 0, authoritarian_control: 0 };
    let totals = {
      public_theology: 0,
      prosperity_theology: 0,
      political_mobilization: 0,
      authoritarian_control: 0,
    };
    sermonData.forEach(c => {
      totals.public_theology += c.dimension_stats.public_theology.mean;
      totals.prosperity_theology += c.dimension_stats.prosperity_theology.mean;
      totals.political_mobilization += c.dimension_stats.political_mobilization.mean;
      totals.authoritarian_control += c.dimension_stats.authoritarian_control.mean;
    });
    const count = sermonData.length;
    return {
      public_theology: totals.public_theology / count,
      prosperity_theology: totals.prosperity_theology / count,
      political_mobilization: totals.political_mobilization / count,
      authoritarian_control: totals.authoritarian_control / count,
    };
  }, [sermonData, isDataLoaded]);

  // Process Topic Modeling data
  const topicDistribution = useMemo(() => {
    if (!selectedChurch || !isDataLoaded) return [];
    const dist = {};
    
    Object.keys(topicData).forEach(topicKey => {
      if (topicKey === 'outlier') return;
      const metaList = topicData[topicKey].meta || [];
      let count = 0;
      metaList.forEach(m => {
        if (m.church === selectedChurch) {
          count++;
        }
      });
      if (count > 0) {
        const topicId = topicKey.replace('topic_', '');
        dist[topicId] = {
          topicId,
          count,
          keywords: topicKeywords[topicId] || []
        };
      }
    });

    return Object.values(dist).sort((a, b) => b.count - a.count);
  }, [selectedChurch, topicData, topicKeywords, isDataLoaded]);

  const totalChurchTopicSermons = useMemo(() => {
    return topicDistribution.reduce((acc, t) => acc + t.count, 0);
  }, [topicDistribution]);

  // Load paginated sermon wordclouds
  const sermonList = useMemo(() => {
    if (!selectedChurch || !wordcloudIndex || !wordcloudIndex.sermons[selectedChurch]) return [];
    return wordcloudIndex.sermons[selectedChurch];
  }, [selectedChurch, wordcloudIndex]);

  const paginatedSermons = useMemo(() => {
    const start = (sermonPage - 1) * SERMON_PAGE_SIZE;
    return sermonList.slice(start, start + SERMON_PAGE_SIZE);
  }, [sermonList, sermonPage]);

  const totalSermonPages = Math.ceil(sermonList.length / SERMON_PAGE_SIZE);

  useEffect(() => {
    const fetchSermonWcs = async () => {
      if (!showSermonWordclouds || paginatedSermons.length === 0) return;
      
      setLoadingSermons(true);
      const newSermons = { ...sermonWordclouds };
      let updated = false;

      const promises = paginatedSermons.map(async (sermonId) => {
        if (newSermons[sermonId]) return;
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}data/wordcloud/sermon/${selectedChurch}/${sermonId}.json`);
          newSermons[sermonId] = await res.json();
          updated = true;
        } catch (e) {
          console.error("Failed to load sermon wordcloud:", e);
        }
      });

      if (promises.length > 0) {
        await Promise.all(promises);
        if (updated) setSermonWordclouds(newSermons);
      }
      setLoadingSermons(false);
    };

    fetchSermonWcs();
  }, [showSermonWordclouds, paginatedSermons, selectedChurch]);

  const getWordsFromData = (data, type = 'freq') => {
    if (!data || !data[type]) return [];
    const words = [];
    ['NNG', 'NNP'].forEach(pos => {
      if (data[type][pos]) {
        Object.entries(data[type][pos]).forEach(([text, value]) => words.push({ text, value }));
      }
    });
    return words;
  };

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <span className="text-sm text-slate-500 font-medium">데이터를 불러오는 중입니다...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Page Header */}
      <div className="page-header" style={{ overflow: 'visible' }}>
        <div className="page-header-main" style={{ alignItems: 'center' }}>
          <div className="title-area">
            <h2 className="page-title">교회별 결과 모아보기</h2>
            <p className="page-description">
              교회를 선택하여 지향성 테스트(바 차트, 전체 설교 산점도), 주요 설교 토픽 분포, 교회 대표 워드클라우드를 통합 분석합니다.
            </p>
          </div>

          <div className="header-controls">
            <div className="control-group">
              <label className="control-label">분석 대상 교회 선택</label>
              <div className="select-wrapper highlight" style={{ minWidth: '260px' }}>
                <select 
                  className="view-select"
                  value={selectedChurch}
                  onChange={(e) => setSelectedChurch(e.target.value)}
                >
                  <option value="">교회를 선택하세요</option>
                  {churchKeys.map(k => (
                    <option key={k} value={k}>
                      {maskChurchName(k)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="view-content mt-6">
        <AnimatePresence mode="wait">
          {!selectedChurch ? (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-slate-400"
            >
              <Building2 size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-bold">교회를 선택하면 우측 상단에서 산점도를 확인할 수 있습니다.</p>
              <p className="text-sm mt-1 text-slate-500">교회별 모든 분석 결과가 한 화면에 정렬되어 표시됩니다.</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedChurch}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10"
            >
              
              {/* ROW 1: Orientation Index (Dimension Chart & Scatter Plot) */}
              <div className="flex flex-col gap-4">
                <div className="section-title-wrapper-custom">
                  <BarChart3 className="section-icon-custom text-blue-600" />
                  <h3 className="summary-section-title">1. 지향성 지수 분석 결과</h3>
                </div>

                <div className="summary-grid-orientation">
                  {/* Left: Dimension Bar Chart */}
                  {orientationData ? (
                    <div className="card p-6 bg-white flex flex-col justify-between" style={{ height: '420px' }}>
                      <div style={{ width: '100%' }}>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="church-name" style={{ fontSize: '1.3rem', margin: 0, fontWeight: '900' }}>
                            {maskChurchName(selectedChurch)} 평균 지수
                          </h4>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '700' }}>
                            분석된 설교: {orientationData.total_sermons}개
                          </span>
                        </div>
                        <DimensionChartWithAverage 
                          stats={orientationData.dimension_stats} 
                          maxStats={maxStats} 
                          overallStats={overallStats} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="card flex items-center gap-3 p-6 bg-slate-50/50 border-dashed border-2 text-slate-400" style={{ height: '420px', justifyContent: 'center', flexDirection: 'column' }}>
                      <AlertCircle size={40} className="opacity-40 text-amber-500" />
                      <p className="font-bold text-center">지향성 지수 분석 결과가 없습니다.</p>
                      <p className="text-xs text-slate-500 text-center">지향성 테스트 결과가 수집되지 않은 교회입니다.</p>
                    </div>
                  )}

                  {/* Right: Scatter Plot View */}
                  {orientationData ? (
                    <ScatterPlotView
                      data={sermonData}
                      selectedChannel={selectedChurch}
                      selectedEntityName={selectedChurch ? maskChurchName(selectedChurch) : ''}
                      selectedEntityLabel="선택된 교회"
                      variant="compact"
                      title="선택 교회 산점도"
                    />
                  ) : (
                    <div className="card flex items-center gap-3 p-6 bg-slate-50/50 border-dashed border-2 text-slate-400" style={{ height: '420px', justifyContent: 'center', flexDirection: 'column' }}>
                      <AlertCircle size={40} className="opacity-40 text-amber-500" />
                      <p className="font-bold text-center">지향성 지수 분석 결과가 없습니다.</p>
                      <p className="text-xs text-slate-500 text-center">지향성 테스트 결과가 수집되지 않은 교회입니다.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 2: Topic Modeling (Left) & WordCloud (Right) */}
              <div className="summary-grid-2">
                
                {/* Left: Topic Modeling */}
                <div className="flex flex-col gap-4">
                  <div className="section-title-wrapper-custom">
                    <MapIcon className="section-icon-custom text-indigo-600" />
                  <h3 className="summary-section-title">2. 지향성 토픽 분포</h3>
                  </div>

                  {topicDistribution.length > 0 ? (
                    <div className="card p-6 bg-white flex flex-col justify-between" style={{ minHeight: '480px', height: '100%' }}>
                      <div style={{ width: '100%' }}>
                        <div className="flex flex-col mb-6">
                          <h4 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                            주요 지향 토픽 분포 <span className="text-secondary text-sm" style={{ fontSize: '0.9rem' }}>({totalChurchTopicSermons}개 분류)</span>
                          </h4>
                          <p className="text-slate-500 text-xs mt-1 mb-0">
                            * 보편적인 단어를 50% 희소성 필터 기준으로 제외하여 특징적인 키워드를 표시합니다.
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-4" style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
                          {topicDistribution.slice(0, 3).map((item, idx) => {
                            const ratio = (item.count / totalChurchTopicSermons) * 100;
                            return (
                              <div 
                                key={item.topicId} 
                                className="topic-custom-card"
                                style={{
                                  position: 'relative',
                                  padding: '1.25rem',
                                  borderRadius: '12px',
                                  border: '1px solid #f1f5f9',
                                  background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Visual ratio progress background */}
                                <div style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${ratio}%`,
                                  backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.04)' : 'rgba(15, 76, 129, 0.02)',
                                  zIndex: 0,
                                  pointerEvents: 'none'
                                }} />
                                
                                <div style={{ position: 'relative', zIndex: 1 }} className="flex items-center justify-between gap-4">
                                  {/* Topic Label and Keywords aligned horizontally */}
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span style={{ 
                                      background: idx === 0 ? 'var(--color-brand-primary)' : '#cbd5e1',
                                      color: idx === 0 ? 'white' : 'var(--color-text-primary)',
                                      fontSize: '0.85rem',
                                      fontWeight: '800',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '6px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      Topic {item.topicId}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(() => {
                                        const filteredKeywords = item.keywords
                                          .filter(w => !wordClusterPercentages[w.word] || wordClusterPercentages[w.word] <= 50)
                                          .slice(0, 3);
                                        
                                        if (filteredKeywords.length === 0) {
                                          return (
                                            <span style={{
                                              fontSize: '0.8rem',
                                              fontWeight: '500',
                                              padding: '0.3rem 0.7rem',
                                              borderRadius: '100px',
                                              backgroundColor: '#f1f5f9',
                                              color: '#64748b',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              cursor: 'default',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              특징적인 고유 키워드 없음
                                            </span>
                                          );
                                        }

                                        return filteredKeywords.map((w, i) => (
                                          <span 
                                            key={i} 
                                            style={{
                                              fontSize: '0.8rem',
                                              fontWeight: '700',
                                              padding: '0.3rem 0.7rem',
                                              borderRadius: '100px',
                                              backgroundColor: 'rgba(99, 102, 241, 0.06)',
                                              color: 'var(--color-brand-primary)',
                                              border: '1px solid rgba(99, 102, 241, 0.12)',
                                              transition: 'all 0.2s ease',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              cursor: 'default',
                                              whiteSpace: 'nowrap'
                                            }}
                                            className="topic-keyword-chip"
                                          >
                                            {w.word}
                                          </span>
                                        ));
                                      })()}
                                    </div>
                                  </div>

                                  {/* Sermon Count & Ratio aligned to the far right */}
                                  <span className="text-base font-bold text-slate-700 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
                                    {item.count}개 <span style={{ color: 'var(--color-brand-accent)', marginLeft: '4px' }}>{ratio.toFixed(1)}%</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          
                          {topicDistribution.length > 3 && (
                            <p className="text-sm text-center text-slate-400 font-bold mt-2">
                              외 {topicDistribution.length - 3}개의 추가 지향 토픽이 더 있습니다.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card flex items-center gap-3 p-6 bg-slate-50/50 border-dashed border-2 text-slate-400" style={{ height: '480px', justifyContent: 'center', flexDirection: 'column' }}>
                      <AlertCircle size={40} className="opacity-40 text-amber-500" />
                      <p className="font-bold text-center">해당 교회의 토픽 분포 분석 대상이 없습니다.</p>
                      <p className="text-xs text-slate-500 text-center">토픽 모델에서 추출된 데이터가 수집 범위에 포함되지 않았습니다.</p>
                    </div>
                  )}
                </div>

                {/* Right: WordCloud */}
                <div className="flex flex-col gap-4">
                  <div className="section-title-wrapper-custom">
                    <Cloud className="section-icon-custom text-emerald-600" />
                    <h3 className="summary-section-title">3. 워드클라우드 집중 해부</h3>
                  </div>

                  {loadingWordcloud ? (
                    <div className="card flex items-center justify-center p-12 bg-white" style={{ height: '480px' }}>
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    </div>
                  ) : churchWordcloudData ? (
                    <div className="card p-6 bg-white flex flex-col justify-between" style={{ minHeight: '480px', height: '100%' }}>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <div>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>교회 요약 워드클라우드</h4>
                        </div>
                        
                        <div className="wc-weight-toggle">
                          <button 
                            onClick={() => setWeightType('freq')} 
                            className={`wc-weight-btn ${weightType === 'freq' ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          >
                            빈도
                          </button>
                          <button 
                            onClick={() => setWeightType('tfidf')} 
                            className={`wc-weight-btn ${weightType === 'tfidf' ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          >
                            중요도
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-center flex-grow items-center">
                        <div 
                          style={{ 
                            aspectRatio: '1/1', 
                            width: '100%', 
                            maxWidth: '360px', 
                            backgroundColor: 'var(--color-bg-secondary)', 
                            borderRadius: '2rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <WordCloud 
                            words={getWordsFromData(churchWordcloudData, weightType)} 
                            minFontSize={WC_CONFIG.CHURCH.minFontSize} 
                            maxFontSize={WC_CONFIG.CHURCH.maxFontSize} 
                            width={320}
                            height={320}
                            limit={WC_CONFIG.CHURCH.limit}
                            padding={WC_CONFIG.CHURCH.padding}
                            squashFactor={WC_CONFIG.CHURCH.squashFactor}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card flex items-center gap-3 p-12 bg-slate-50/50 border-dashed border-2 text-slate-400" style={{ height: '480px', justifyContent: 'center', flexDirection: 'column' }}>
                      <AlertCircle size={40} className="opacity-40 text-amber-500" />
                      <p className="font-bold text-center">해당 교회의 워드클라우드 분석 대상이 없습니다.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION: Expandable Sermon-level WordClouds (Always at the very bottom, full width, 4 columns) */}
              <AnimatePresence>
                {showSermonWordclouds && churchWordcloudData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="card p-6 bg-white flex flex-col gap-6" style={{ border: '1px solid var(--color-border)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                        <div>
                          <h5 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--color-brand-primary)' }}>
                            교회별 워드클라우드 상세 리스트 <span className="text-secondary text-sm" style={{ fontWeight: '500', fontSize: '0.95rem' }}>({sermonList.length}개)</span>
                          </h5>
                          <p className="text-slate-400 text-sm mt-1">각 설교문에서 추출한 워드클라우드를 별도로 확인할 수 있습니다.</p>
                        </div>

                        {totalSermonPages > 1 && (
                          <div className="wc-weight-toggle" style={{ padding: '4px 8px', alignItems: 'center', gap: '10px' }}>
                            <button 
                              disabled={sermonPage === 1} 
                              onClick={() => setSermonPage(sermonPage - 1)} 
                              style={{ opacity: sermonPage === 1 ? 0.2 : 1, padding: '2px', display: 'flex', alignItems: 'center' }}
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.95rem', fontWeight: '900', minWidth: '50px', textAlign: 'center', color: 'var(--color-brand-primary)' }}>
                              {sermonPage} / {totalSermonPages}
                            </span>
                            <button 
                              disabled={sermonPage === totalSermonPages} 
                              onClick={() => setSermonPage(sermonPage + 1)} 
                              style={{ opacity: sermonPage === totalSermonPages ? 0.2 : 1, transform: 'rotate(180deg)', padding: '2px', display: 'flex', alignItems: 'center' }}
                            >
                              <ChevronLeft size={20} />
                            </button>
                          </div>
                        )}
                      </div>

                      {loadingSermons ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                          <p className="text-sm font-bold text-slate-500">설교별 데이터를 불러오는 중입니다...</p>
                        </div>
                      ) : (
                        <div className="sermon-wc-grid">
                          {paginatedSermons.map((sermonId, idx) => {
                            const sermonWc = sermonWordclouds[sermonId];
                            return (
                              <div key={sermonId} className="card p-3 bg-white border border-slate-100 flex flex-col gap-3">
                                <div className="px-1 border-b pb-1.5">
                                  <h6 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sermonId}>
                                    {sermonId}
                                  </h6>
                                </div>
                                <div style={{ aspectRatio: '1/1', width: '100%', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justify: 'center', overflow: 'hidden' }}>
                                  <WordCloud 
                                    words={sermonWc ? getWordsFromData(sermonWc, weightType) : []} 
                                    minFontSize={WC_CONFIG.SERMON.minFontSize} 
                                    maxFontSize={WC_CONFIG.SERMON.maxFontSize} 
                                    delay={idx * 40} 
                                    width={140}
                                    height={140}
                                    limit={WC_CONFIG.SERMON.limit}
                                    padding={WC_CONFIG.SERMON.padding}
                                    squashFactor={WC_CONFIG.SERMON.squashFactor}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Styled custom overrides */}
      <style>{`
        .summary-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .summary-grid-orientation {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 2rem;
          align-items: start;
        }
        .sermon-wc-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .summary-grid-2,
          .summary-grid-orientation {
            grid-template-columns: 1fr;
          }
          .sermon-wc-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 1280px) {
          .summary-grid-2,
          .summary-grid-orientation {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .sermon-wc-grid {
            grid-template-columns: 1fr;
          }
        }
        .section-title-wrapper-custom {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 3px solid var(--color-bg-tertiary);
          margin-bottom: 0.5rem;
        }
        .section-icon-custom {
          width: 2.2rem;
          height: 2.2rem;
          flex-shrink: 0;
        }
        .summary-section-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        /* Remove global card hover effect for this page */
        .dashboard-wrapper .card:hover {
          transform: none !important;
          box-shadow: var(--shadow-sm) !important;
        }
      `}</style>
    </div>
  );
};

export default ChurchSummary;


