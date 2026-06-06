import React from 'react';
import { motion } from 'framer-motion';
import { Target, BarChart3, Database, ShieldCheck, Cpu } from 'lucide-react';

const ProjectIntroduction = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
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
        <h2 className="page-title">SermonLens란?</h2>
        <p className="page-description">
          머신러닝 기술이 분석하는 한국 교회의 신학적 지형도
        </p>
      </motion.div>

      <motion.div 
        className="intro-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h3 className="section-title">프로젝트 개요</h3>
        <div className="intro-top-row">
          {/* Main Concept Card */}
          <motion.div className="intro-hero-card" variants={itemVariants}>
            <p>
              <strong>SermonLens</strong>는 한국 기독교 설교 데이터를 수집하여 머신러닝 기반의 기술을 활용해 <strong>신학적, 정치적, 사회적 함의</strong>를 분석하고 시각화하여 제공하는 분석 플랫폼입니다.
            </p>
          </motion.div>
          
          <motion.div className="dev-card-outer" variants={itemVariants}>
            <div className="dev-card">
              <div className="lab-info">
                <img src={`${import.meta.env.BASE_URL}hail.png`} alt="HAIL Lab" className="lab-logo-giant" />
              </div>
              <div className="member-list">
                <div className="member-item">
                  <span className="member-name">정예준</span>
                  <span className="member-tag">학부생 (21)</span>
                </div>
                <div className="member-item">
                  <span className="member-name">김한결</span>
                  <span className="member-tag">학부생 (21)</span>
                </div>
                <div className="member-item advisor">
                  <span className="member-name">홍참길</span>
                  <span className="member-tag">지도교수</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="intro-grid">
          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><Database size={24} /></div>
              <h4>자동화된 데이터 수집</h4>
            </div>
            <p>수천 편의 유튜브 설교 영상을 자동으로 수집하고, 최신 음성 인식 기술(STT)을 통해 텍스트 데이터로 변환합니다.</p>
          </motion.div>

          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><Target size={24} /></div>
              <h4>객관적 지표 도출</h4>
            </div>
            <p>설교자 개인에 대한 가치 판단이 아닌, 텍스트 데이터에서 도출된 객관적 지표를 투명하게 제공하는 것을 핵심으로 합니다.</p>
          </motion.div>

          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><BarChart3 size={24} /></div>
              <h4>다각도 지향성 분석</h4>
            </div>
            <p>공공신학, 번영신학, 정치적 동원성, 권위주의 통제성 등 4가지 축을 중심으로 설교의 지향성을 수치화합니다.</p>
          </motion.div>

          <motion.div className="intro-card" variants={itemVariants}>
            <div className="card-header-inline">
              <div className="card-icon-small"><ShieldCheck size={24} /></div>
              <h4>학술적 신뢰도</h4>
            </div>
            <p>신학적 전문 지식과 데이터 사이언스 방법론을 결합하여 분석의 깊이와 기술적 타당성을 동시에 확보합니다.</p>
          </motion.div>
        </div>

        {/* Channel Selection Criteria Section */}
        <motion.div className="intro-criteria-section" variants={itemVariants}>
          <div className="section-header">
            <div className="header-icon"><ShieldCheck size={24} /></div>
            <h3>데이터 수집 및 정제 파이프라인 (3단계)</h3>
          </div>
          
          <div className="criteria-container">
            <div className="criteria-column">
              <div className="step-badge">Step 01</div>
              <h5>채널 후보 발굴 및 정량 필터링</h5>
              <div className="tech-tag">순수 알고리즘 기반</div>
              <ul>
                <li><strong>시계열 분할 탐색:</strong> 유튜브 검색 한계를 우회하는 Temporal Splitting 전략 사용</li>
                <li><strong>키워드 필터링:</strong> 키워드 기반 비설교 채널 1차 필터링</li>
                <li><strong>활동성 기준:</strong> 구독자 1,000명 / 영상 30개 이상의 활성 채널 확보</li>
              </ul>
            </div>

            <div className="criteria-column">
              <div className="step-badge">Step 02-03</div>
              <h5>AI 질적 검증 및 전략 수집</h5>
              <div className="tech-tag">모델: gemini-3.1-flash-lite</div>
              <ul>
                <li><strong>4대 지표 검증:</strong> 본질성, 국내성, 언어성, 식별성을 AI가 정성적으로 평가</li>
                <li><strong>고품질 선별:</strong> 평균 20분 이상의 정식 설교 영상만을 1차 타겟팅</li>
                <li><strong>채널 설교 목록 확보:</strong> 조건을 충족하는 각 채널의 설교 영상 목록 확보</li>
              </ul>
            </div>

            <div className="criteria-column">
              <div className="step-badge">Step 04-05</div>
              <h5>추출 및 AI 텍스트 교정</h5>
              <div className="tech-tag">모델: gemini-3.1-flash-lite</div>
              <ul>
                <li><strong>AI 정밀 교정:</strong> STT 오탈자 및 기독교 특수 용어 문맥 맞춤 교정</li>
                <li><strong>순수 본문 추출:</strong> 찬양, 광고, 인사 구간을 제거한 Refined Text 생성</li>
                <li><strong>최종 셋:</strong> 2023년 이후, 5k~25k자 범위의 상위 30개 채널 확정</li>
              </ul>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default ProjectIntroduction;
