import React, { useState, Suspense, lazy } from 'react';
import Navigation from './Navigation';

// Lazy load pages to reduce build-time memory usage and bundle size
const ProjectIntroduction = lazy(() => import('../pages/ProjectIntroduction'));
const OrientationDashboard = lazy(() => import('../pages/OrientationDashboard'));
const OrientationGuide = lazy(() => import('../pages/OrientationGuide'));
const OrientationTask = lazy(() => import('../pages/OrientationTask'));
const WordCloudTask = lazy(() => import('../pages/WordCloudTask'));
const WordCloudResults = lazy(() => import('../pages/WordCloudResults'));

const TopicModelMap = lazy(() => import('../pages/TopicModelMap'));
const TopicMapGallery = lazy(() => import('../pages/TopicMapGallery'));
const TopicModelTask = lazy(() => import('../pages/TopicModelTask'));
const ChurchSummary = lazy(() => import('../pages/ChurchSummary'));



const Layout = () => {
  const [activeTab, setActiveTab] = useState('project_intro');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'project_intro':
        return <ProjectIntroduction />;
      case 'church_summary':
        return <ChurchSummary />;
      case 'orientation_task':
        return <OrientationTask />;
      case 'orientation_guide':
        return <OrientationGuide />;
      case 'orientation_results':
        return <OrientationDashboard />;
      case 'wordcloud_guide':
        return <WordCloudTask />;
      case 'wordcloud_results':
        return <WordCloudResults />;

      case 'topic_map_test':
        return <TopicModelMap />;
      case 'topic_gallery':
        return <TopicMapGallery />;
      case 'topic_guide':
        return <TopicModelTask />;
      default:
        return <OrientationGuide />;
    }
  };

  return (
    <div className="app-container">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="main-content">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        }>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

export default Layout;
