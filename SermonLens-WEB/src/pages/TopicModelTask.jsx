import React from 'react';
import { motion } from 'framer-motion';
import { Network, Cpu, Layers, Spline, BarChart3, HelpCircle, AlertCircle, FileText } from 'lucide-react';

const TopicModelTask = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="guide-wrapper">
      {/* Page Header */}
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="page-title">Topic Modeling 기술가이드 설명</h2>
        <p className="page-description">
          토픽 모델링은 대규모 텍스트 세트에 대한 비지도 학습을 적용하여 문서/컬렉션의 전체 주요 토픽 세트를 나타내는 요약 용어 세트를 생성하는 텍스트 마이닝 기법입니다.
        </p>
      </motion.div>

      <motion.div 
        className="intro-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Existing Limitations & Context */}
        <motion.div className="intro-grid" variants={itemVariants}>
          <div className="intro-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <div className="card-header-inline">
              <div className="card-icon-small" style={{ color: 'var(--color-danger)' }}><AlertCircle size={20} /></div>
              <h4>기존 토픽 모델링의 한계 (Bag of Words)</h4>
            </div>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7' }}>
              전통적인 기법들은 <strong>Bag of Words</strong> 방식을 주로 활용합니다. 이는 단어들의 순서는 전혀 고려하지 않고, 단어들의 출현 빈도(frequency)에만 집중하는 텍스트 데이터의 수치화 표현 방법입니다. 이로 인해 단어의 문맥적 흐름이나 정교한 의미를 파악하는 데 한계가 있습니다.
            </p>
          </div>

          <div className="intro-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <div className="card-header-inline">
              <div className="card-icon-small" style={{ color: 'var(--color-warning)' }}><FileText size={20} /></div>
              <h4>설교문 분석의 특수성</h4>
            </div>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7' }}>
              설교문은 주제가 분명해 보이지만 실제로는 여러 신학적 요소가 복잡하게 얽혀 있습니다. 예를 들어 <strong>회개, 위로, 소명, 공동체, 종말론</strong>이 하나의 설교 안에서 함께 나타날 수 있으며, 이러한 연결은 단어의 단순한 동시 출현을 넘어 더 넓은 문맥 속에서 이해되어야 합니다.
            </p>
          </div>
        </motion.div>

        {/* 2. BERTopic Solution */}
        <motion.div className="intro-hero-card" variants={itemVariants} style={{ borderLeft: '4px solid var(--color-brand-primary)' }}>
          <div style={{ width: '100%' }}>
            <div className="card-header-inline" style={{ marginBottom: '1rem' }}>
              <div className="card-icon-small"><Cpu size={20} /></div>
              <h4 style={{ fontSize: '1.3rem', margin: 0 }}>문맥 반영을 위한 BERTopic 도입</h4>
            </div>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.7' }}>
              <strong>BERTopic</strong>은 문서를 임베딩으로 표현한 뒤 의미적으로 가까운 문서들을 군집화하고, 그 군집에서 대표 단어를 추출하는 방식입니다. 이를 통해 단순 빈도 계산을 탈피하여, 단어가 사용된 <strong>문맥적 유사성</strong>을 훨씬 더 잘 반영한 분석 결과를 도출합니다.
            </p>
          </div>
        </motion.div>

        {/* 3. Pipeline Mechanism */}
        <motion.div className="intro-criteria-section" variants={itemVariants}>
          <div className="section-header">
            <div className="header-icon"><Network size={24} /></div>
            <h3>BERTopic 기반의 토픽 모델링 파이프라인</h3>
          </div>

          <div className="criteria-container">
            {/* Step 1: Embeddings */}
            <div className="criteria-column">
              <div className="step-badge" style={{ backgroundColor: 'var(--color-brand-accent)' }}>1. Embeddings</div>
              <h5>임베딩 (Embeddings)</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                설교 문서를 고차원 벡터로 변환합니다. 문맥을 다각도로 이해하고 다국어 및 한국어에 강점을 가진 모델인 <strong>dragonkue/BGE-m3-ko</strong>를 활용하여 임베딩합니다.
              </p>
            </div>

            {/* Step 2: Dimensionality Reduction & Step 3: Clustering */}
            <div className="criteria-column">
              <div className="step-badge" style={{ backgroundColor: 'var(--color-brand-primary)' }}>2 & 3. Reduction & Clustering</div>
              <h5>차원 축소 & 군집화</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1.2rem' }}>
                <strong>2. Dimensionality Reduction (차원 축소)</strong><br />
                임베딩된 고차원 벡터를 군집화 효율성을 높이기 위해 <strong>UMAP</strong>을 활용하여 저차원 [1024d -{'>'} 5d]으로 축소합니다.
              </p>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                <strong>3. Clustering (클러스터링)</strong><br />
                차원 축소된 공간에서 <strong>HDBSCAN</strong> 밀도 기반 클러스터링을 적용합니다.
              </p>
            </div>

            {/* Step 4: Topic Representation */}
            <div className="criteria-column topic-representation-wide">
              <div className="topic-representation-heading">
                <div>
                  <div className="step-badge" style={{ backgroundColor: 'var(--color-success)' }}>4. Topic Representation</div>
                  <h5>Sector 기반 토픽 표현</h5>
                </div>
              </div>

              <div className="topic-representation-grid">
                <div>
                  <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', marginTop: 0 }}>
                    토픽 지형도의 각 <strong>sector</strong>는 단순한 색상 구역이 아니라 하나의 <strong>topic representation</strong>입니다.
                    같은 sector에 속한 설교들은 의미적으로 가까운 문서 집합이며, 이 집합을 해석 가능한 토픽으로 만들기 위해 대표 문서와 c-TF-IDF 키워드를 함께 사용합니다.
                  </p>

                  <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', marginTop: '1rem' }}>
                    c-TF-IDF는 각 sector 내에서 특정 단어가 해당 토픽을 얼마나 대표하는지 계산하여 <strong>핵심 키워드의 가중치</strong>를 산출합니다.
                  </p>
                  
                  <div className="latex-formula-container" style={{ marginTop: '1rem' }}>
                    <div className="latex-formula" style={{ fontSize: '1.05rem' }}>
                      <div className="term">W<sub>i, c</sub></div>
                      <div className="operator">=</div>
                      <div className="term">tf<sub>i, c</sub></div>
                      <div className="operator">×</div>
                      <div className="term">
                        log <span className="paren">(</span>
                        1 +
                        <div className="fraction inline">
                          <div className="numerator">A</div>
                          <div className="denominator">df<sub>i</sub></div>
                        </div>
                        <span className="paren">)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-secondary" style={{ fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '0.5rem', lineHeight: '1.5' }}>
                    * <strong>W<sub>i, c</sub></strong>: 토픽 c에서 단어 i의 c-TF-IDF 가중치<br />
                    * <strong>tf<sub>i, c</sub></strong>: 토픽 c에서의 단어 i 빈도수<br />
                    * <strong>df<sub>i</sub></strong>: 단어 i의 전체 문서 빈도수, <strong>A</strong>: 토픽당 평균 단어 수
                  </div>
                </div>

                <div className="topic-representation-actions">
                  <div className="topic-representation-note topic-representation-note-blue">
                    <strong>1. 대표 문서 + c-TF-IDF + LLM 해석</strong>
                    <p>
                      각 클러스터의 중심점에 가까운 대표 설교문과 해당 sector의 c-TF-IDF 상위 키워드를 LLM에 함께 제공합니다.
                      이를 통해 모델은 단어 목록만 보는 것이 아니라, 실제 대표 문맥을 근거로 토픽 라벨과 설명을 생성하여 해석력을 높입니다.
                    </p>
                  </div>

                  <div className="topic-representation-note topic-representation-note-green">
                    <strong>2. c-TF-IDF 워드클라우드 제공</strong>
                    <p>
                      c-TF-IDF 결과는 토픽 키워드 갤러리에서 워드클라우드로 제공합니다.
                      가중치가 높은 키워드일수록 더 크게 표시되어, sector를 대표하는 핵심 어휘를 빠르게 파악할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .topic-representation-wide {
          grid-column: 1 / -1;
        }

        .topic-representation-heading h5 {
          margin-bottom: 0;
        }

        .topic-representation-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
          gap: 1.5rem;
          align-items: start;
          margin-top: 1rem;
        }

        .topic-representation-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
          height: 100%;
        }

        .topic-representation-note {
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .topic-representation-note-blue {
          background: rgba(15, 76, 129, 0.04);
        }

        .topic-representation-note-green {
          background: rgba(42, 157, 143, 0.05);
        }

        .topic-representation-note strong {
          display: block;
          color: var(--color-text-primary);
          margin-bottom: 0.45rem;
        }

        .topic-representation-note p {
          font-size: 0.98rem;
          color: var(--color-text-secondary);
          line-height: 1.65;
          margin: 0;
        }

        @media (max-width: 1080px) {
          .topic-representation-grid,
          .topic-representation-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TopicModelTask;
