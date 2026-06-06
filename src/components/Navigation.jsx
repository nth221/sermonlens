import React, { useState } from 'react';
import { 
  LayoutDashboard, Cloud, BarChart2, BookOpen, 
  ChevronLeft, ChevronRight, Info, PieChart,
  ChevronDown, ChevronUp, Map, Network, Building2
} from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, isOpen, toggleSidebar }) => {
  const [expandedGroups, setExpandedGroups] = useState(['project', 'orientation', 'wordcloud', 'topicmodeling', 'summary']);

  const menuGroups = [
    {
      id: 'project',
      label: '프로젝트 소개',
      icon: <Info size={20} />,
      items: [
        { id: 'project_intro', label: 'SermonLens란?', icon: <BookOpen size={16} /> },
      ]
    },
    {
      id: 'orientation',
      label: '지향성 지수 테스트',
      icon: <LayoutDashboard size={20} />,
      items: [
        { id: 'orientation_task', label: '태스크 설명', icon: <Info size={16} /> },
        { id: 'orientation_guide', label: '지표 가이드', icon: <Info size={16} /> },
        { id: 'orientation_results', label: '분석 결과', icon: <PieChart size={16} /> },
      ]
    },
    {
      id: 'wordcloud',
      label: '워드클라우드',
      icon: <Cloud size={20} />,
      items: [
        { id: 'wordcloud_guide', label: '태스크 설명', icon: <Info size={16} /> },
        { id: 'wordcloud_results', label: '분석 결과', icon: <PieChart size={16} /> },
      ]
    },
    {
      id: 'topicmodeling',
      label: '토픽 모델링',
      icon: <Network size={20} />,
      items: [
        { id: 'topic_guide', label: '기술 가이드', icon: <Info size={16} /> },
        { id: 'topic_map_test', label: '토픽 지형도', icon: <Map size={16} /> },
        { id: 'topic_gallery', label: '토픽 키워드 갤러리', icon: <PieChart size={16} /> },
      ]
    },
    {
      id: 'summary',
      label: '종합 분석',
      icon: <Building2 size={20} />,
      items: [
        { id: 'church_summary', label: '교회별 결과 모아보기', icon: <Building2 size={16} /> },
      ]
    },
  ];

  const toggleGroup = (groupId) => {
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(expandedGroups.filter(id => id !== groupId));
    } else {
      setExpandedGroups([...expandedGroups, groupId]);
    }
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={`${import.meta.env.BASE_URL}hail.png`} alt="HAIL Lab Logo" className="sidebar-logo-img" />
          {isOpen && <h1 className="sidebar-title">SermonLens</h1>}
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          const hasActiveItem = group.items.some(item => item.id === activeTab);
          
          return (
            <div key={group.id} className="nav-group">
              <button 
                className={`nav-group-header ${hasActiveItem ? 'active' : ''}`}
                onClick={() => isOpen ? toggleGroup(group.id) : setActiveTab(group.items[0].id)}
              >
                <div className="flex items-center gap-3">
                  {group.icon}
                  {isOpen && <span className="group-label">{group.label}</span>}
                </div>
                {isOpen && (
                  isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                )}
              </button>
              
              {isOpen && isExpanded && (
                <div className="nav-group-items">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      className={`nav-sub-item ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {isOpen && (
        <div className="sidebar-footer">
          <p className="copyright-text">
            © 2026 HAIL Lab.<br/>
            Handong Global Univ.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Navigation;
