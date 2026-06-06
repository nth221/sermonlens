import React from 'react';
import { motion } from 'framer-motion';
import { Target, Cpu, Activity, ListChecks, ArrowRight, Layers } from 'lucide-react';

const OrientationTask = () => {
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
        <h2 className="page-title">지향성 지수 테스트 설명</h2>
        <p className="page-description">
          SermonLens의 핵심 분석 태스크인 지향성 지수 산출 시스템의 내부 메커니즘과 검증 프로세스를 소개합니다.
        </p>
      </motion.div>

      <motion.div 
        className="intro-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Task Overview */}
        <motion.div className="intro-hero-card" variants={itemVariants}>
          <p style={{ fontSize: '1.3rem' }}>
            SermonLens의 지향성 지수 테스트는 각 분석 축의 지향성을 정량적으로 평가하기 위해 학술적 근거로 설계된 <strong>20개의 질문</strong>을 활용합니다. <br /><strong>AI 신학자 페르소나를 가진 LLM</strong>이 개별 설교를 여러 번 평가하며 판정의 일관성을 확보함으로써, 
            주관적 추론의 한계를 보완한 <strong>신뢰도 높은 정량적 평가</strong>를 가능하게 합니다.
          </p>
        </motion.div>

        {/* 2. Model & Context */}
        <div className="intro-grid">
          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><Cpu size={20} /></div>
              <h4>사용 모델 및 환경</h4>
            </div>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.7' }}>
              방대한 분량의 설교 문맥을 정확하게 이해하고 일관되게 평가하기 위해, 대용량 컨텍스트 처리와 고도의 추론 능력이 뛰어난 <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>gemma-4-26b-a4b-it</span> 모델을 사용하였습니다.
            </p>
          </motion.div>

          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><Layers size={20} /></div>
              <h4>분석 파이프라인</h4>
            </div>
            <p style={{ fontSize: '1.2rem' }}>
              설교를 전/후반부로 나누어 분석하는 <strong>원자화(Atomization)</strong> 전략을 적용하며, 섹션별 3회 반복 추론을 통해 데이터의 변동성을 최소화하고 정밀도를 높였습니다.
            </p>
          </motion.div>
        </div>

        {/* 3. Logic & Verification */}
        <motion.div className="intro-criteria-section" variants={itemVariants}>
          <div className="section-header">
            <div className="header-icon"><ListChecks size={24} /></div>
            <h3>점수 책정 및 검증 로직</h3>
          </div>
          
          <div className="criteria-container">
            <div className="criteria-column">
              <div className="step-badge">Step A</div>
              <h5>다수결 원칙 (Majority Vote)</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                각 지향성 지표별로 전반부와 후반부 각각에 대해 3회씩 독립적인 평가를 수행합니다. 그중 <strong>2번 이상의 결과가 일치</strong>하는 경우에만 유효한 판정으로 인정하여 데이터의 신뢰도를 확보합니다.
              </p>
            </div>

            <div className="criteria-column">
              <div className="step-badge">Step B</div>
              <h5>섹션 간 상호 보완 (포괄적 탐지)</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                전반부 혹은 후반부 중 어느 한 곳에서라도 해당 지표와 관련된 내용이 탐지되면 긍정으로 판정합니다. 이는 설교 전체에 조금이라도 나타난 경향성을 놓치지 않기 위함입니다.
              </p>
            </div>

            <div className="criteria-column">
              <div className="step-badge">Step C</div>
              <h5>정량적 경향성 지수 도출</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                각 지표별 20개 질문에 대한 최종 긍정 답변의 총합을 계산합니다. 이를 통해 <strong>해당 설교 데이터셋에 나타난 설교자의 신학적 경향성 지수</strong>를 0~20점 사이의 수치로 산출합니다.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrientationTask;
