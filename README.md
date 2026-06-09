# SermonLens

<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white" alt="D3.js" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
</p>

**SermonLens**는 머신러닝과 자연어 처리(NLP) 기술을 활용하여 한국 기독교 설교 텍스트의 신학적, 사회적, 정치적 지향성을 분석하고 시각화하는 데이터 대시보드 플랫폼입니다. 방대한 설교 텍스트 속에 담긴 담론의 흐름을 주관적 평가가 아닌 객관적인 데이터와 지표로 그려냅니다.

## 📌 주요 기능 (Key Features)

SermonLens는 설교 데이터를 3가지 주요 분석 파이프라인으로 나누어 처리하며, 이를 웹상에서 직관적으로 탐색할 수 있도록 제공합니다.

### 1. 지향성 지수 (Orientation Index)
*   설교 텍스트를 공공신학, 번영신학, 정치적 동원성, 권위주의 통제성 등 4가지 주요 축을 기준으로 정량화합니다.
*   대규모 언어 모델(`gemma-4-26b-a4b-it`)을 기반으로 한 다수결 원칙(Majority Vote)을 통해 설교의 지향성을 일관되고 신뢰성 있게 평가합니다.
*   **제공 뷰:** 전체 평균 통계, 교회 간 비교 분석, 전체 설교 산점도

### 2. 토픽 모델링 (Topic Modeling)
*   **BERTopic** 아키텍처(BGE-m3-ko 임베딩 + UMAP 차원 축소 + HDBSCAN 군집화)를 적용하여 단순 빈도가 아닌 문맥 기반의 주제를 군집화합니다.
*   **3D 토픽 지형도:** 군집화된 설교 데이터를 Three.js 기반의 인터랙티브 3D 공간으로 매핑하여 탐색할 수 있습니다.
*   **토픽 키워드 갤러리:** 각 클러스터를 대표하는 핵심 키워드를 c-TF-IDF 기반으로 가중치를 부여해 제공하며, 희소성 필터(Sparsity Filter)를 통해 특징적인 단어를 분별합니다.

### 3. 워드클라우드 심층 분석 (WordCloud)
*   카카오의 딥러닝 형태소 분석기 **Khaiii**를 활용하여 명사(NNG, NNP) 중심의 의미 있는 키워드를 추출합니다.
*   단순 출현 빈도(Frequency)와 문서군 내 특이성(TF-IDF) 가중치 방식을 모두 지원하여 교회별 어휘적 특성을 조망합니다.

### 4. 교회별 결과 종합 (Church Summary)
*   지향성 지수, 토픽 분포, 핵심 워드클라우드 등 개별 교회에 대한 모든 분석 결과를 한곳에서 종합적으로 확인할 수 있는 통합 대시보드를 제공합니다.

## 🛠 기술 스택 (Tech Stack)

SermonLens 프론트엔드는 빠르고 부드러운 상호작용과 대규모 데이터의 효율적인 시각화에 초점을 맞추어 구축되었습니다.

*   **Core:** React 18, Vite
*   **Styling & Animation:** Vanilla CSS, Framer Motion (부드러운 화면 전환 및 인터랙션)
*   **Data Visualization:** 
    *   `recharts`: 지향성 지수 통계, 바 차트, 산점도 등 2D 데이터 시각화
    *   `react-d3-cloud` / `d3`: 동적 워드클라우드 생성
*   **3D Rendering:** `@react-three/fiber`, `three` (3D 토픽 지형도 구현)
*   **Data Handling:** 런타임 최적화를 위해 방대한 분석 데이터를 분할된 정적 JSON 파일 형태로 `public` 디렉토리에서 비동기(`fetch`) 로드합니다.

## ⚙️ 데이터 파이프라인 (Data Pipeline)

웹 애플리케이션에 렌더링되는 모든 데이터는 다음의 백엔드 처리 과정을 거쳐 생성되었습니다.
1.  **후보 발굴 및 수집:** 활성 유튜브 교회 채널 수집 및 STT 기술을 통한 텍스트 변환
2.  **질적 검증:** AI(`gemini-3.1-flash-lite`)를 활용한 1차 데이터 고품질 선별
3.  **정밀 교정 및 추출:** STT 오탈자 및 종교 특수 용어 교정, 순수 본문(광고 및 인사 제외) 추출

## 🚀 로컬 실행 방법 (Getting Started)

프로젝트를 로컬 환경에서 실행하려면 Node.js가 설치되어 있어야 합니다.

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
https://hail.handong.edu/sermonlens/ 
```

## 👨‍💻 TEAM AIEC (HAIL Lab)

<img src="./public/hail.png" alt="HAIL Lab Logo" height="200" />

본 프로젝트는 한동대학교(Handong Global Univ.) HAIL Lab에서 진행되었습니다.
*   **팀원:** 정예준(21학번), 김한결(21학번)
*   **지도교수:** 홍참길 교수님