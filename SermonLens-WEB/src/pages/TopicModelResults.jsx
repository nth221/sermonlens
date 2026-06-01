import React, { useState, useEffect } from 'react';
import Plotly from 'plotly.js-gl2d-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { Map, Info, Maximize2 } from 'lucide-react';
import topicData from '../data/topicmodel/global_topic_map.json';
import { maskChurchName } from '../utils/masking';

const Plot = createPlotlyComponent(Plotly);

const getTopicLabel = (topicKey) => topicKey.replace('topic_', 'Topic ');

const TopicModelResults = () => {
  const [plotData, setPlotData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState('all');
  const [churchList, setChurchList] = useState([]);
  const containerRef = React.useRef(null);

  useEffect(() => {
    // 1. Get unique churches for the dropdown
    const churches = new Set();
    Object.keys(topicData).forEach(key => {
      if (topicData[key].meta) {
        topicData[key].meta.forEach(m => {
          if (m.church) churches.add(m.church);
        });
      }
    });
    setChurchList(['all', ...Array.from(churches).sort()]);

    // 2. Initial data process
    updatePlotData('all');
    setLoading(false);

    // Fullscreen listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const updatePlotData = (churchFilter) => {
    const traces = Object.keys(topicData)
      .filter(key => key !== 'outlier')
      .map((topicKey) => {
        const vectors = topicData[topicKey].vectors;
        const meta = topicData[topicKey].meta || [];
        
        let filteredX = [];
        let filteredY = [];
        let hoverText = [];

        for (let i = 0; i < vectors.length; i++) {
          const m = meta[i] || {};
          if (churchFilter === 'all' || m.church === churchFilter) {
            filteredX.push(vectors[i][0]);
            filteredY.push(vectors[i][1]);
            hoverText.push(`${getTopicLabel(topicKey)}<br>${maskChurchName(m.church) || 'Unknown'}<br>${m.video_id || ''}`);
          }
        }

        if (filteredX.length === 0) return null;

        return {
          x: filteredX,
          y: filteredY,
          mode: 'markers',
          type: 'scattergl',
          name: getTopicLabel(topicKey),
          text: hoverText,
          hoverinfo: 'text',
          marker: {
            size: churchFilter === 'all' ? 5 : 7,
            opacity: churchFilter === 'all' ? 0.6 : 0.9,
            line: {
              width: 0.5,
              color: 'white'
            }
          }
        };
      })
      .filter(t => t !== null);

    setPlotData(traces);
  };

  const handleChurchChange = (e) => {
    const val = e.target.value;
    setSelectedChurch(val);
    updatePlotData(val);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const layout = {
    autosize: true,
    height: isFullscreen ? window.innerHeight - 40 : undefined,
    margin: { l: 30, r: 30, b: 30, t: 30, pad: 4 },
    hovermode: 'closest',
    showlegend: selectedChurch === 'all',
    legend: {
      font: { family: 'Inter, sans-serif', size: 11 },
      itemclick: 'toggleothers',
    },
    dragmode: 'pan',
    xaxis: { showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
    yaxis: { showgrid: true, gridcolor: '#f1f5f9', zeroline: false, showticklabels: false },
    plot_bgcolor: isFullscreen ? '#f8fafc' : '#ffffff',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif' }
  };

  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'resetScale2d'],
    displayModeBar: true,
    scrollZoom: true
  };

  return (
    <div className="guide-wrapper full-height-wrapper">
      <div className="page-header compact">
        <div className="page-header-main">
          <div className="title-area">
            <h2 className="page-title">병합 토픽 클러스터 맵</h2>
          </div>
          
          <div className="header-controls">
            <div className="control-group">
              <label className="control-label">대상 교회</label>
              <div className="select-wrapper">
                <select 
                  value={selectedChurch} 
                  onChange={handleChurchChange}
                  className="view-select"
                >
                  {churchList.map(c => (
                    <option key={c} value={c}>{c === 'all' ? '전체 교회 보기' : maskChurchName(c)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="intro-content fill-remaining">
        <div 
          className={`card static-card fill-card ${isFullscreen ? 'fullscreen-card' : ''}`}
          ref={containerRef}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Map size={18} className="text-blue-600" />
              <h3 className="text-md font-bold">토픽 지형도 분석</h3>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Info size={12} /> 드래그: 이동 / 휠: 확대</span>
              <button 
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-slate-700 font-medium"
              >
                <Maximize2 size={12} /> {isFullscreen ? '창 모드로 보기' : '전체 화면'}
              </button>
            </div>
          </div>

          <div className="plot-flex-container">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Plot
                data={plotData}
                layout={layout}
                config={config}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicModelResults;
