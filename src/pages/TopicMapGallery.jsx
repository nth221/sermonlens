import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Hash, Layers3, Loader2, Search } from 'lucide-react';


const VECTOR_PRECISION = 6;

const getTopicNumber = (topicKey) => Number(String(topicKey).replace('topic_', ''));
const getKeywordKey = (topicKey) => String(topicKey).replace('topic_', '');
const getTopicFallbackLabel = (topicKey) => topicKey.replace('topic_', 'Topic ');
const getSubTopicFallbackLabel = (index) => `Sub-topic ${index + 1}`;



const WORD_COLORS = [
  '#0f4c81',
  '#2a9d8f',
  '#e76f51',
  '#6d597a',
  '#457b9d',
  '#bc6c25',
  '#3a5a40',
  '#7b2cbf',
  '#d62828',
  '#577590',
];

const getPointIdentity = (vector, meta = {}) => {
  const x = Number(vector[0]).toFixed(VECTOR_PRECISION);
  const y = Number(vector[1]).toFixed(VECTOR_PRECISION);
  return `${x}|${y}|${meta.church || ''}|${meta.video_id || ''}`;
};

const getTopWords = (words = [], limit = 6) => words.slice(0, limit).map(item => item.word);

const WordCloud = ({
  words,
  minFontSize = 10,
  maxFontSize = 32,
  delay = 0,
  width = 220,
  height = 180,
  limit = 24,
  padding = 1,
  squashFactor = 0.68,
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(false);
    const timer = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timer);
  }, [delay, width, height, limit, words?.length]);

  const data = useMemo(() => {
    if (!words || words.length === 0) return [];

    const sorted = [...words].sort((a, b) => b.score - a.score);
    const maxVal = sorted[0]?.score || 0;
    if (maxVal === 0) return [];

    return sorted.slice(0, limit).map((word, index) => ({
      text: word.word,
      rank: index,
      value: (Math.pow(word.score, squashFactor) / Math.pow(maxVal, squashFactor)) * 100,
      score: word.score,
    }));
  }, [words, limit, squashFactor]);

  if (!words || words.length === 0) {
    return (
      <div className="topic-map-empty-cloud">키워드 없음</div>
    );
  }

  if (!shouldRender) {
    return (
      <div className="topic-map-cloud-loader">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="topic-map-cloud-inner"
      style={{ width, minHeight: height }}
    >
      {data.map((word, index) => {
        const size = (word.value / 100) * (maxFontSize - minFontSize) + minFontSize;
        const opacity = 0.62 + (word.value / 100) * 0.38;

        return (
          <span
            key={`${word.text}-${index}`}
            className="topic-map-cloud-word"
            style={{
              color: WORD_COLORS[index % WORD_COLORS.length],
              fontSize: `${size}px`,
              lineHeight: 1,
              opacity,
              padding: `${padding + 1}px ${padding + 3}px`,
            }}
            title={`${word.text}: ${word.score.toFixed(5)}`}
          >
            {word.text}
          </span>
        );
      })}
    </motion.div>
  );
};

const useTopicGalleryData = (maxClusterFreq) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mergedTopicDataRes, rawTopicDataRes, mergedTopicKeywordsRes, rawTopicKeywordsRes, topicLabelDataRes, subTopicLabelDataRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_merged_map.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_map.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_merged_keywords_ctfidf.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_keywords_ctfidf.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/topic_label.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/sub_topic_label.json`)
        ]);

        const mergedTopicData = await mergedTopicDataRes.json();
        const rawTopicData = await rawTopicDataRes.json();
        const mergedTopicKeywords = await mergedTopicKeywordsRes.json();
        const rawTopicKeywords = await rawTopicKeywordsRes.json();
        const topicLabelData = await topicLabelDataRes.json();
        const subTopicLabelData = await subTopicLabelDataRes.json();

        const topicKeys = Object.keys(mergedTopicData)
          .filter(key => key !== 'outlier')
          .sort((a, b) => getTopicNumber(a) - getTopicNumber(b));

        const rawTopicKeys = Object.keys(rawTopicData)
          .filter(key => key !== 'outlier')
          .sort((a, b) => getTopicNumber(a) - getTopicNumber(b));

        const rawTopicLookup = rawTopicKeys.reduce((acc, topicKey) => {
          const vectors = rawTopicData[topicKey].vectors || [];
          const meta = rawTopicData[topicKey].meta || [];

          vectors.forEach((vector, pointIndex) => {
            const identity = getPointIdentity(vector, meta[pointIndex]);
            if (!acc[identity]) acc[identity] = topicKey;
          });

          return acc;
        }, {});

        const rawTopicCount = Object.keys(rawTopicKeywords).length || 1;
        const wordClusterPercentages = {};
        if (rawTopicCount > 0) {
          const wordClusterFrequencies = {};
          Object.values(rawTopicKeywords).forEach(wordsList => {
            wordsList.forEach(({ word }) => {
              wordClusterFrequencies[word] = (wordClusterFrequencies[word] || 0) + 1;
            });
          });
          for (const [word, count] of Object.entries(wordClusterFrequencies)) {
            wordClusterPercentages[word] = (count / rawTopicCount) * 100;
          }
        }

        setData({
          mergedTopicData,
          mergedTopicKeywords,
          rawTopicKeywords,
          topicLabelData,
          subTopicLabelData,
          topicKeys,
          rawTopicLookup,
          wordClusterPercentages
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load topic gallery data", err);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const topics = useMemo(() => {
    if (!data) return [];
    const {
      mergedTopicData,
      mergedTopicKeywords,
      rawTopicKeywords,
      topicLabelData,
      subTopicLabelData,
      topicKeys,
      rawTopicLookup,
      wordClusterPercentages
    } = data;

    const getTopicLabelInfo = (topicKey) => (
      topicLabelData.labels?.[String(getTopicNumber(topicKey))]?.label || null
    );

    const getSubTopicLabelInfo = (topicKey) => (
      subTopicLabelData.labels?.[String(getTopicNumber(topicKey))]?.label || null
    );

    return topicKeys.map((topicKey) => {
      const vectors = mergedTopicData[topicKey].vectors || [];
      const meta = mergedTopicData[topicKey].meta || [];
      const rawClusterCounts = {};

      vectors.forEach((vector, pointIndex) => {
        const rawTopicKey = rawTopicLookup[getPointIdentity(vector, meta[pointIndex])];
        if (rawTopicKey) rawClusterCounts[rawTopicKey] = (rawClusterCounts[rawTopicKey] || 0) + 1;
      });

      const labelInfo = getTopicLabelInfo(topicKey);
      const rawKeywords = mergedTopicKeywords[getKeywordKey(topicKey)] || [];
      const keywords = rawKeywords.filter(w => (wordClusterPercentages[w.word] || 0) <= maxClusterFreq);

      const subTopics = Object.entries(rawClusterCounts)
        .sort((a, b) => b[1] - a[1] || getTopicNumber(a[0]) - getTopicNumber(b[0]))
        .map(([rawTopicKey, count], index) => {
          const subLabelInfo = getSubTopicLabelInfo(rawTopicKey);
          const rawSubKeywords = rawTopicKeywords[getKeywordKey(rawTopicKey)] || [];
          const subKeywords = rawSubKeywords.filter(w => (wordClusterPercentages[w.word] || 0) <= maxClusterFreq);

          return {
            topicKey: rawTopicKey,
            id: getTopicNumber(rawTopicKey),
            label: subLabelInfo?.label || getSubTopicFallbackLabel(index),
            description: subLabelInfo?.description || '',
            count,
            keywords: subKeywords,
            topWords: getTopWords(subKeywords, 5),
          };
        });

      return {
        topicKey,
        id: getTopicNumber(topicKey),
        label: labelInfo?.label || getTopicFallbackLabel(topicKey),
        description: labelInfo?.description || '',
        count: vectors.length,
        keywords,
        topWords: getTopWords(keywords, 6),
        subTopics,
      };
    });
  }, [data, maxClusterFreq]);

  return { topics, isLoading };
};

const TopicMapGallery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopics, setExpandedTopics] = useState(() => new Set(['topic_0']));
  const [maxClusterFreq, setMaxClusterFreq] = useState(50);

  const { topics, isLoading } = useTopicGalleryData(maxClusterFreq);

  const filteredTopics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return topics;

    return topics.filter(topic => {
      const topicText = [
        `topic ${topic.id}`,
        topic.label,
        topic.description,
        ...topic.topWords,
      ].join(' ').toLowerCase();

      const subTopicMatches = topic.subTopics.some(subTopic => [
        `sub-topic ${subTopic.id}`,
        subTopic.label,
        subTopic.description,
        ...subTopic.topWords,
      ].join(' ').toLowerCase().includes(query));

      return topicText.includes(query) || subTopicMatches;
    });
  }, [topics, searchTerm]);

  const toggleTopic = (topicKey) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicKey)) next.delete(topicKey);
      else next.add(topicKey);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-sm text-slate-500 font-medium">데이터를 불러오는 중입니다...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper main-content">
      <div className="page-header topic-map-gallery-header">
        <div className="title-area">
          <h2 className="page-title">토픽 맵 키워드 갤러리</h2>
          <p className="page-description">
            병합된 상위 클러스터와 그 안의 sub-topic을 c-TF-IDF 워드클라우드로 함께 살펴봅니다.
          </p>
        </div>

        <div className="topic-map-controls-area">
          <div className="topic-map-search">
            <Search size={18} className="topic-map-search-icon" />
            <input
              type="text"
              placeholder="라벨, 토픽 번호, 키워드 검색..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="sparsity-filter-section">
        <div className="sparsity-header">
          <h4 className="sparsity-title">희소성 필터 (Sparsity Filter)</h4>
          <p className="sparsity-desc">
            전체 서브 토픽 대비 특정 키워드의 출현율(Cluster Frequency)을 계산하여, 설정된 임계값 이상의 보편적인 단어를 워드클라우드에서 동적으로 제외합니다.
          </p>
        </div>
        <div className="sparsity-control">
          <input
            type="range"
            min="0" max="100" step="5"
            value={maxClusterFreq}
            onChange={(event) => setMaxClusterFreq(Number(event.target.value))}
            className="sparsity-slider-long"
          />
          <div className="sparsity-labels">
            <span>엄격하게 필터링 (0%)</span>
            <span className="current-val">현재 출현율 <strong>{maxClusterFreq}%</strong> 이하만 표시</span>
            <span>필터링 없음 (100%)</span>
          </div>
        </div>
      </div>

      <main className="topic-map-gallery">
        {filteredTopics.map((topic, topicIndex) => {
          const isExpanded = expandedTopics.has(topic.topicKey);
          const visibleSubTopics = isExpanded ? topic.subTopics : topic.subTopics.slice(0, 2);

          return (
            <section key={topic.topicKey} className="topic-map-panel">
              <div className="topic-map-panel-main">
                <div className="topic-map-summary">
                  <div className="topic-map-eyebrow">
                    <span>Topic {topic.id}</span>
                    <span>{topic.count.toLocaleString()} sermons</span>
                  </div>
                  <h3>{topic.label}</h3>
                  {topic.description && <p>{topic.description}</p>}
                  <div className="topic-map-keywords">
                    {topic.topWords.map(word => (
                      <span key={word}>
                        <Hash size={12} />
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="topic-map-cloud-large">
                  <WordCloud
                    words={topic.keywords}
                    minFontSize={12}
                    maxFontSize={38}
                    delay={topicIndex * 35}
                    width={300}
                    height={220}
                    limit={26}
                    padding={1}
                    squashFactor={0.64}
                  />
                </div>
              </div>

              <div className="topic-map-subtopic-header">
                <div>
                  <Layers3 size={17} />
                  <span>Sub-topics</span>
                  <strong>{topic.subTopics.length}</strong>
                </div>
                {topic.subTopics.length > 2 && (
                  <button type="button" onClick={() => toggleTopic(topic.topicKey)}>
                    {isExpanded ? '접기' : '전체 보기'}
                    <ChevronDown size={16} className={isExpanded ? 'is-open' : ''} />
                  </button>
                )}
              </div>

              <div className="topic-map-subtopics">
                {visibleSubTopics.map((subTopic, subTopicIndex) => (
                  <article key={subTopic.topicKey} className="topic-map-subtopic">
                    <div className="topic-map-subtopic-copy">
                      <div className="topic-map-subtopic-id">
                        Sub-topic {subTopic.id}
                        <span>{subTopic.count.toLocaleString()} sermons</span>
                      </div>
                      <h4>{subTopic.label}</h4>
                      {subTopic.description && <p>{subTopic.description}</p>}
                      <div className="topic-map-mini-keywords">
                        {subTopic.topWords.slice(0, 4).map(word => (
                          <span key={word}>#{word}</span>
                        ))}
                      </div>
                    </div>
                    <div className="topic-map-cloud-small">
                      <WordCloud
                        words={subTopic.keywords}
                        minFontSize={8}
                        maxFontSize={22}
                        delay={(topicIndex * 35) + (subTopicIndex * 20)}
                        width={170}
                        height={125}
                        limit={16}
                        padding={1}
                        squashFactor={0.7}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="topic-map-no-results">
            <Search size={56} />
            <p>일치하는 토픽을 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      <style>{`
        .topic-map-gallery-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .topic-map-controls-area {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sparsity-filter-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }

        .sparsity-header {
          margin-bottom: 1.5rem;
        }

        .sparsity-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-brand-primary, #0f4c81);
          margin: 0 0 0.5rem 0;
        }

        .sparsity-desc {
          margin: 0;
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.6;
          word-break: keep-all;
        }

        .sparsity-control {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sparsity-slider-long {
          width: 100%;
          height: 10px;
          border-radius: 5px;
          accent-color: var(--color-brand-primary, #0f4c81);
          cursor: pointer;
        }

        .sparsity-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .current-val {
          color: #334155;
          font-size: 0.9rem;
          background: #f1f5f9;
          padding: 0.3rem 1rem;
          border-radius: 20px;
        }
        
        .current-val strong {
          color: var(--color-brand-primary, #0f4c81);
          font-weight: 800;
        }

        .topic-map-search {
          position: relative;
          display: flex;
          align-items: center;
          width: min(300px, 100%);
          height: 48px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          padding: 0 1rem;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .topic-map-search:focus-within {
          border-color: var(--color-brand-primary, #0f4c81);
          box-shadow: 0 0 0 4px rgba(15, 76, 129, 0.09);
        }

        .topic-map-search-icon {
          color: #94a3b8;
          flex: 0 0 auto;
          margin-right: 0.75rem;
        }

        .topic-map-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font-size: 0.94rem;
          font-weight: 600;
        }

        .topic-map-search input::placeholder {
          color: #b6c2d1;
          font-weight: 500;
        }

        .topic-map-gallery {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          padding-bottom: 3rem;
        }

        .topic-map-panel {
          border: 1px solid #e8edf4;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .topic-map-panel-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 1.25rem;
          padding: 1.25rem;
          align-items: stretch;
        }

        .topic-map-summary {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .topic-map-eyebrow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .topic-map-eyebrow span {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 0.25rem 0.65rem;
        }

        .topic-map-summary h3 {
          margin: 0;
          color: #0f172a;
          font-size: 1.32rem;
          font-weight: 900;
          line-height: 1.35;
          letter-spacing: 0;
        }

        .topic-map-summary p {
          margin: 0.7rem 0 0;
          color: #64748b;
          font-size: 0.94rem;
          line-height: 1.65;
          word-break: keep-all;
        }

        .topic-map-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 1rem;
        }

        .topic-map-keywords span {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          color: #0f4c81;
          background: #eef6ff;
          border: 1px solid #d9ebff;
          border-radius: 8px;
          min-height: 28px;
          padding: 0.25rem 0.55rem;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .topic-map-cloud-large,
        .topic-map-cloud-small {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #fbfdff;
          border: 1px solid #edf2f7;
          border-radius: 8px;
        }

        .topic-map-cloud-large {
          min-height: 236px;
        }

        .topic-map-cloud-small {
          width: 186px;
          min-height: 136px;
          flex: 0 0 auto;
        }

        .topic-map-cloud-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          align-content: center;
          flex-wrap: wrap;
          gap: 0.22rem 0.34rem;
          pointer-events: none;
          padding: 0.75rem;
          text-align: center;
        }

        .topic-map-cloud-word {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          border-radius: 6px;
          font-weight: 900;
          letter-spacing: 0;
          white-space: nowrap;
          word-break: keep-all;
        }

        .topic-map-cloud-loader,
        .topic-map-empty-cloud {
          min-height: 120px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .topic-map-subtopic-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-top: 1px solid #edf2f7;
          padding: 0.85rem 1.25rem;
          background: #fbfdff;
        }

        .topic-map-subtopic-header > div {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: #334155;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .topic-map-subtopic-header strong {
          color: #0f4c81;
          font-size: 0.82rem;
        }

        .topic-map-subtopic-header button {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 32px;
          border: 1px solid #dbe6f0;
          border-radius: 8px;
          background: #ffffff;
          color: #334155;
          padding: 0 0.7rem;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
        }

        .topic-map-subtopic-header button:hover {
          border-color: #b8c8d9;
          color: #0f4c81;
        }

        .topic-map-subtopic-header button svg {
          transition: transform 0.2s ease;
        }

        .topic-map-subtopic-header button svg.is-open {
          transform: rotate(180deg);
        }

        .topic-map-subtopics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid #edf2f7;
        }

        .topic-map-subtopic {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          min-width: 0;
          padding: 1rem 1.25rem;
          border-top: 1px solid #edf2f7;
        }

        .topic-map-subtopic:nth-child(-n + 2) {
          border-top: 0;
        }

        .topic-map-subtopic:nth-child(odd) {
          border-right: 1px solid #edf2f7;
        }

        .topic-map-subtopic-copy {
          min-width: 0;
        }

        .topic-map-subtopic-id {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.45rem;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .topic-map-subtopic-id span {
          color: #94a3b8;
          font-weight: 800;
        }

        .topic-map-subtopic h4 {
          margin: 0;
          color: #172033;
          font-size: 0.98rem;
          font-weight: 900;
          line-height: 1.35;
          letter-spacing: 0;
          word-break: keep-all;
        }

        .topic-map-subtopic p {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0.45rem 0 0;
          color: #64748b;
          font-size: 0.82rem;
          line-height: 1.55;
          word-break: keep-all;
        }

        .topic-map-mini-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.65rem;
        }

        .topic-map-mini-keywords span {
          color: #7c8da3;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .topic-map-no-results {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
          gap: 1rem;
        }

        .topic-map-no-results p {
          margin: 0;
          font-size: 1rem;
          font-weight: 800;
        }

        @media (max-width: 1120px) {
          .topic-map-panel-main {
            grid-template-columns: 1fr;
          }

          .topic-map-cloud-large {
            min-height: 230px;
          }

          .topic-map-subtopics {
            grid-template-columns: 1fr;
          }

          .topic-map-subtopic:nth-child(odd) {
            border-right: 0;
          }

          .topic-map-subtopic:nth-child(2) {
            border-top: 1px solid #edf2f7;
          }
        }

        @media (max-width: 760px) {
          .topic-map-gallery-header {
            align-items: stretch;
            flex-direction: column;
          }

          .topic-map-search {
            width: 100%;
          }

          .topic-map-subtopic {
            align-items: stretch;
            flex-direction: column;
          }

          .topic-map-cloud-small {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TopicMapGallery;
