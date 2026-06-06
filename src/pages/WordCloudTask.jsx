import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Type, Zap, Scale, ListChecks, ArrowRight, BarChart3 } from 'lucide-react';

const WordCloudTask = () => {
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
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="page-title">워드클라우드 분석 설명</h2>
        <p className="page-description">
          설교 텍스트에서 핵심 어휘를 추출하고 시각화하는 워드클라우드 태스크의 전처리 과정과 가중치 산출 로직을 소개합니다.
        </p>
      </motion.div>

      <motion.div 
        className="intro-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Word Count Mechanism */}
        <motion.div className="intro-hero-card" variants={itemVariants}>
          <p style={{ fontSize: '1.3rem' }}>
            SermonLens의 어휘 분석은 단순 공백 기준 분절이 아닌 <strong>정교한 형태소 분석</strong>을 기반으로 합니다. <br />
            한국어의 특성을 고려하여 <strong>명사와 주요 용언(동사, 형용사)</strong> 등 의미를 가진 형태소만을 선별적으로 추출하며, 
            불용어 제거 과정을 거쳐 설교의 진정한 핵심 키워드를 도출합니다.
          </p>
        </motion.div>

        {/* 2. Morphology & Engine */}
        <div className="intro-grid">
          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><Type size={20} /></div>
              <h4>형태소 분석 엔진</h4>
            </div>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7' }}>
              카카오에서 개발한 딥러닝 기반 형태소 분석기인 <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>Khaiii</span>를 사용합니다. 
              기존 규칙 기반 분석기보다 한국어의 복잡한 결합 구조를 더 정확하게 분리해낼 수 있어 정밀한 어휘 통계가 가능합니다.
            </p>
          </motion.div>

          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><ListChecks size={20} /></div>
              <h4>분석 대상 품사 (POS Tags)</h4>
            </div>
            <div className="mt-2">
              <ul className="task-bullet-list" style={{ paddingLeft: '0.5rem' }}>
                <li style={{ fontSize: '1.2rem' }}><strong>NNG, NNP</strong>: 일반 및 고유 명사 (핵심 개념)</li>
              </ul>
              <p className="mt-4 text-secondary" style={{ fontSize: '1rem', fontStyle: 'italic', paddingLeft: '1rem' }}>
                * 분석의 정확도를 위해 의미가 모호한 용언이나 수식어는 배제하고 체언(명사) 중심으로 추출합니다.
              </p>
            </div>
          </motion.div>
        </div>

        {/* 3. Weighting Strategy */}
        <motion.div className="intro-criteria-section" variants={itemVariants}>
          <div className="section-header">
            <div className="header-icon"><BarChart3 size={24} /></div>
            <h3>워드클라우드 가중치 산출 방식</h3>
          </div>
          
          <div className="criteria-container">
            <div className="criteria-column">
              <div className="step-badge" style={{ backgroundColor: 'var(--color-brand-accent)' }}>Option 1</div>
              <h5>빈도수 방식 (Frequency)</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                특정 설교 또는 교회에서 단어가 등장한 <strong>절대 횟수</strong>를 그대로 반영합니다. 해당 텍스트에서 반복적으로 강조된 핵심 어휘를 직관적으로 파악하는 데 유용합니다.
              </p>
              <div className="latex-formula-container">
                <div className="latex-formula">
                  score(w, d) = count(w, d)
                </div>
              </div>
            </div>

            <div className="criteria-column" style={{ gridColumn: 'span 2' }}>
              <div className="step-badge" style={{ backgroundColor: 'var(--color-brand-primary)' }}>Option 2</div>
              <h5>TF-IDF 가중치</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                전체 설교 코퍼스와 비교하여 <strong>특정 설교나 교회에서만 유독 두드러지는 특징어</strong>를 추출합니다. 모든 설교에 흔한 단어는 제외하고 해당 데이터의 개성을 보여주는 단어를 강조합니다.
              </p>
              <div className="latex-formula-container" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="latex-formula" style={{ fontSize: '1.05rem' }}>
                  score(w,&thinsp;d)&nbsp;&nbsp;=&nbsp;&nbsp;TF(w,&thinsp;d)&nbsp;&nbsp;×&nbsp;&nbsp;IDF(w)
                </div>
                <div style={{ width: '100%', borderTop: '1px dashed var(--color-border)' }} />
                <div className="latex-formula" style={{ fontSize: '1.05rem' }}>
                  <span>TF(w,&thinsp;d)</span>
                  <div className="operator">=</div>
                  <div className="fraction">
                    <div className="numerator">count(w,&thinsp;d)</div>
                    <div className="denominator">∑&thinsp;count(w',&thinsp;d)</div>
                  </div>
                </div>
                <div className="latex-formula" style={{ fontSize: '1.05rem' }}>
                  <span>IDF(w)</span>
                  <div className="operator">=</div>
                  <span>log</span>
                  <span className="paren">(</span>
                  <div className="fraction inline">
                    <div className="numerator">|D|&thinsp;+&thinsp;1</div>
                    <div className="denominator">df(w)&thinsp;+&thinsp;1</div>
                  </div>
                  <span className="paren">)</span>
                  <span>&nbsp;+&thinsp;1</span>
                </div>
              </div>
            </div>

            <div className="criteria-column" style={{ gridColumn: '1 / -1' }}>
              <div className="step-badge" style={{ backgroundColor: 'var(--color-success)' }}>Effect</div>
              <h5>데이터 시각화의 목적</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                단어의 크기를 가중치에 비례하게 배치하여, 방대한 설교 텍스트를 읽지 않고도 <strong>신학적 키워드와 어휘적 특성</strong>을 한눈에 조망할 수 있는 통찰을 제공합니다.
              </p>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default WordCloudTask;
