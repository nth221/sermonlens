import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Info, Map, Maximize2, RotateCcw } from 'lucide-react';


const getTopicNumber = (topicKey) => Number(topicKey.replace('topic_', ''));
const getTopicFallbackLabel = (topicKey) => topicKey.replace('topic_', 'Topic ');
const getKeywordKey = (topicKey) => topicKey.replace('topic_', '');


const SPHERE_RADIUS = 12;
const TOPIC_RADIUS_DEPTH = 1.8;
const VECTOR_PRECISION = 6;

const getSubTopicFallbackLabel = (index) => `sub-topic ${index + 1}`;

const normalizePoint = ([x, y], stats) => {
  const spanX = stats.maxX - stats.minX || 1;
  const spanY = stats.maxY - stats.minY || 1;
  const normalizedX = (x - stats.minX) / spanX;
  const normalizedY = (y - stats.minY) / spanY;
  const longitude = (normalizedX * 2 - 1) * Math.PI;
  const latitude = (normalizedY * 0.88 - 0.44) * Math.PI;

  return {
    longitude,
    latitude,
  };
};

const getLightnessVariant = (baseColor, index, total) => {
  if (total <= 1) return baseColor;

  const color = new THREE.Color(baseColor);
  const hsl = {};
  color.getHSL(hsl);

  const lightnessMin = THREE.MathUtils.clamp(hsl.l - 0.22, 0.22, 0.74);
  const lightnessMax = THREE.MathUtils.clamp(hsl.l + 0.22, 0.30, 0.82);
  const lightness = lightnessMax - ((lightnessMax - lightnessMin) * index) / (total - 1);
  color.setHSL(hsl.h, hsl.s, lightness);

  return `#${color.getHexString()}`;
};

const getPointIdentity = (vector, meta = {}) => {
  const x = Number(vector[0]).toFixed(VECTOR_PRECISION);
  const y = Number(vector[1]).toFixed(VECTOR_PRECISION);
  return `${x}|${y}|${meta.church || ''}|${meta.video_id || ''}`;
};

const getTopKeywords = (keywords, limit = 6) => (
  (keywords || [])
    .slice(0, limit)
    .map(item => item.word)
);

const useTopicModelMapData = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topicDataRes, rawTopicDataRes, mergedTopicKeywordsRes, rawTopicKeywordsRes, topicLabelDataRes, subTopicLabelDataRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_merged_map.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_map.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_merged_keywords_ctfidf.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/global_topic_keywords_ctfidf.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/topic_label.json`),
          fetch(`${import.meta.env.BASE_URL}data/topicmodel/sub_topic_label.json`)
        ]);

        const topicData = await topicDataRes.json();
        const rawTopicData = await rawTopicDataRes.json();
        const mergedTopicKeywords = await mergedTopicKeywordsRes.json();
        const rawTopicKeywords = await rawTopicKeywordsRes.json();
        const topicLabelData = await topicLabelDataRes.json();
        const subTopicLabelData = await subTopicLabelDataRes.json();

        const getTopicLabelInfo = (topicKey) => topicLabelData.labels?.[String(getTopicNumber(topicKey))]?.label || null;
        const getTopicLabel = (topicKey) => getTopicLabelInfo(topicKey)?.label || getTopicFallbackLabel(topicKey);
        const getTopicDescription = (topicKey) => getTopicLabelInfo(topicKey)?.description || '';
        const getSubTopicLabelInfo = (topicKey) => subTopicLabelData.labels?.[String(getTopicNumber(topicKey))]?.label || null;

        const topicKeys = Object.keys(topicData)
          .filter(key => key !== 'outlier')
          .sort((a, b) => getTopicNumber(a) - getTopicNumber(b));

        const rawTopicKeys = Object.keys(rawTopicData)
          .filter(key => key !== 'outlier')
          .sort((a, b) => getTopicNumber(a) - getTopicNumber(b));

        const palette = topicKeys.reduce((acc, topicKey, index) => {
          const color = new THREE.Color();
          color.setHSL(index / topicKeys.length, 0.68, 0.52);
          acc[topicKey] = `#${color.getHexString()}`;
          return acc;
        }, {});

        const rawTopicLookup = rawTopicKeys.reduce((acc, topicKey) => {
          const vectors = rawTopicData[topicKey].vectors || [];
          const meta = rawTopicData[topicKey].meta || [];

          vectors.forEach((vector, pointIndex) => {
            const identity = getPointIdentity(vector, meta[pointIndex]);
            if (!acc[identity]) acc[identity] = topicKey;
          });

          return acc;
        }, {});

        const xs = [];
        const ys = [];
        topicKeys.forEach(topicKey => {
          topicData[topicKey].vectors.forEach(([x, y]) => {
            xs.push(x);
            ys.push(y);
          });
        });

        const stats = {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
        };

        const topics = topicKeys.map((topicKey, index) => {
          const vectors = topicData[topicKey].vectors;
          const meta = topicData[topicKey].meta || [];
          const rawClusterCounts = {};
          const radius = SPHERE_RADIUS + (index / Math.max(topicKeys.length - 1, 1)) * TOPIC_RADIUS_DEPTH;
          const points = vectors.map((vector, pointIndex) => {
            const point = normalizePoint(vector, stats);
            const cosLat = Math.cos(point.latitude);
            const rawTopicKey = rawTopicLookup[getPointIdentity(vector, meta[pointIndex])] || null;

            if (rawTopicKey) {
              rawClusterCounts[rawTopicKey] = (rawClusterCounts[rawTopicKey] || 0) + 1;
            }

            return {
              x: radius * cosLat * Math.cos(point.longitude),
              y: radius * Math.sin(point.latitude),
              z: radius * cosLat * Math.sin(point.longitude),
              church: meta[pointIndex]?.church || 'Unknown',
              videoId: meta[pointIndex]?.video_id || '',
              rawTopicKey,
            };
          });
          
          const rawClusterEntries = Object.entries(rawClusterCounts)
            .sort((a, b) => b[1] - a[1] || getTopicNumber(a[0]) - getTopicNumber(b[0]));
          
          const rawClusters = rawClusterEntries
            .map(([rawTopicKey, count], clusterIndex) => {
              const labelInfo = getSubTopicLabelInfo(rawTopicKey);

              return {
                rawTopicKey,
                count,
                color: getLightnessVariant(palette[topicKey], clusterIndex, rawClusterEntries.length),
                label: labelInfo?.label || getSubTopicFallbackLabel(clusterIndex),
                description: labelInfo?.description || '',
                keywords: getTopKeywords(rawTopicKeywords[getKeywordKey(rawTopicKey)]),
              };
            });

          return {
            topicKey,
            topicIndex: index,
            color: palette[topicKey],
            points,
            count: points.length,
            label: getTopicLabel(topicKey),
            description: getTopicDescription(topicKey),
            keywords: getTopKeywords(mergedTopicKeywords[getKeywordKey(topicKey)], 8),
            rawClusters,
          };
        });

        setData(topics);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load map data", err);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return { topics: data || [], isLoading };
};

const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 9;
    controls.maxDistance = 46;
    controls.maxPolarAngle = Math.PI;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
};

const TopicCloud = ({ topic, selectedTopic, onSelect }) => {
  const geometryRef = useRef(null);
  const isSelected = selectedTopic === topic.topicKey;
  const isDimmed = selectedTopic && !isSelected;

  const visiblePoints = topic.points;

  const positions = useMemo(() => {
    const array = new Float32Array(visiblePoints.length * 3);
    visiblePoints.forEach((point, index) => {
      const offset = index * 3;
      array[offset] = point.x;
      array[offset + 1] = point.y;
      array[offset + 2] = point.z;
    });
    return array;
  }, [visiblePoints]);

  useEffect(() => {
    geometryRef.current?.computeBoundingSphere();
  }, [positions]);

  if (visiblePoints.length === 0) return null;

  if (isSelected) {
    const groupedPoints = topic.rawClusters
      .map(cluster => ({
        ...cluster,
        points: visiblePoints.filter(point => point.rawTopicKey === cluster.rawTopicKey),
      }))
      .filter(cluster => cluster.points.length > 0);

    return (
      <group>
        {groupedPoints.map(cluster => {
          const clusterPositions = new Float32Array(cluster.points.length * 3);
          cluster.points.forEach((point, index) => {
            const offset = index * 3;
            clusterPositions[offset] = point.x;
            clusterPositions[offset + 1] = point.y;
            clusterPositions[offset + 2] = point.z;
          });

          return (
            <points
              key={cluster.rawTopicKey}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(topic.topicKey);
              }}
              userData={{ topicKey: topic.topicKey, rawTopicKey: cluster.rawTopicKey }}
            >
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[clusterPositions, 3]} />
              </bufferGeometry>
              <pointsMaterial
                color={cluster.color}
                size={0.34}
                sizeAttenuation
                transparent
                opacity={0.92}
                depthWrite={false}
              />
            </points>
          );
        })}
      </group>
    );
  }

  return (
    <points
      onClick={(event) => {
        event.stopPropagation();
        onSelect(topic.topicKey);
      }}
      userData={{ topicKey: topic.topicKey }}
    >
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={topic.color}
        size={isSelected ? 0.30 : 0.20}
        sizeAttenuation
        transparent
        opacity={isDimmed ? 0.08 : isSelected ? 0.9 : 0.72}
        depthWrite={false}
      />
    </points>
  );
};

const SphereShell = () => {
  const shellRef = useRef(null);

  useEffect(() => {
    if (shellRef.current) {
      shellRef.current.raycast = () => null;
    }
  }, []);

  return (
    <mesh ref={shellRef}>
      <sphereGeometry args={[SPHERE_RADIUS, 36, 18]} />
      <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.18} />
    </mesh>
  );
};

const TopicScene = ({ topics, selectedTopic, onSelect }) => {
  return (
    <>
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[10, 16, 8]} intensity={1.1} />
      <SphereShell />
      {topics.map(topic => (
        <TopicCloud
          key={topic.topicKey}
          topic={topic}
          selectedTopic={selectedTopic}
          onSelect={onSelect}
        />
      ))}
      <CameraControls />
    </>
  );
};

const TopicDetailPanel = ({ topic }) => {
  if (!topic) return null;

  const visiblePoints = topic.points;
  const visibleCounts = visiblePoints.reduce((acc, point) => {
    if (point.rawTopicKey) {
      acc[point.rawTopicKey] = (acc[point.rawTopicKey] || 0) + 1;
    }
    return acc;
  }, {});
  const visibleRawClusters = topic.rawClusters
    .map(cluster => ({
      ...cluster,
      visibleCount: visibleCounts[cluster.rawTopicKey] || 0,
    }))
    .filter(cluster => cluster.visibleCount > 0);

  return (
    <aside className="topic-map-3d-detail">
      <div className="topic-detail-section">
        <div className="topic-detail-eyebrow">Cluster</div>
        <div className="topic-detail-title-row">
          <span
            className="topic-detail-color"
            style={{ background: topic.color }}
          />
          <h4>{topic.label}</h4>
          <span>{visiblePoints.length.toLocaleString()} points</span>
        </div>
        {topic.description && (
          <p className="topic-detail-description">{topic.description}</p>
        )}
        <div className="topic-keyword-row">
          {topic.keywords.map(keyword => (
            <span key={keyword} className="topic-keyword">#{keyword}</span>
          ))}
        </div>
      </div>

      {visibleRawClusters.length > 1 && (
        <div className="topic-detail-section">
          <div className="topic-detail-eyebrow">Detailed Clusters</div>
          <div className="raw-cluster-list">
            {visibleRawClusters.map(cluster => (
              <div key={cluster.rawTopicKey} className="raw-cluster-item">
                <div className="raw-cluster-heading">
                  <span
                    className="topic-detail-color"
                    style={{ background: cluster.color }}
                  />
                  <strong>{cluster.label}</strong>
                  <span>{cluster.visibleCount.toLocaleString()}</span>
                </div>
                {cluster.description && (
                  <p className="topic-detail-description raw-cluster-description">{cluster.description}</p>
                )}
                <div className="raw-keyword-row">
                  {cluster.keywords.slice(0, 5).map(keyword => (
                    <span key={keyword}>#{keyword}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

const TopicModelMap = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const containerRef = useRef(null);

  const { topics, isLoading } = useTopicModelMapData();

  const selectedTopicInfo = selectedTopic
    ? topics.find(topic => topic.topicKey === selectedTopic)
    : null;
  const selectedTopicVisibleCount = selectedTopicInfo
    ? selectedTopicInfo.points.length
    : 0;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleTopicChange = (event) => {
    setSelectedTopic(event.target.value === 'all' ? null : event.target.value);
  };

  const handleSelectTopic = (topicKey) => {
    setSelectedTopic(current => current === topicKey ? null : topicKey);
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

  return (
    <div className="guide-wrapper full-height-wrapper topic-map-3d-page">
      <div className="page-header compact">
        <div className="page-header-main">
          <div className="title-area">
            <h2 className="page-title">3D 토픽 지형도</h2>
          </div>

          <div className="header-controls">
            {isLoading ? (
              <div className="text-sm text-slate-500 mr-4">로딩 중...</div>
            ) : (
              <div className="control-group">
              <label className="control-label">토픽 선택</label>
              <div className="select-wrapper">
                <select
                  value={selectedTopic || 'all'}
                  onChange={handleTopicChange}
                  className="view-select"
                >
                  <option value="all">전체 토픽 보기</option>
                  {topics.map(topic => (
                    <option key={topic.topicKey} value={topic.topicKey}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`topic-map-3d-stage ${isFullscreen ? 'fullscreen-card' : ''}`}
        ref={containerRef}
      >
        <div className="topic-map-3d-toolbar">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-blue-600" />
            <h3 className="text-md font-bold">
              {selectedTopicInfo
                ? `${selectedTopicInfo.label} 클러스터`
                : 'Topic WorldMap'}
            </h3>
            {selectedTopicInfo && (
              <span className="topic-map-3d-count">{selectedTopicVisibleCount.toLocaleString()} points</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="topic-map-3d-hint"><Info size={12} /> 드래그: 회전 / 휠: 확대 / 클릭: 클러스터 강조</span>
            {selectedTopic && (
              <button
                onClick={() => setSelectedTopic(null)}
                className="topic-map-3d-button"
              >
                <RotateCcw size={12} /> 전체 보기
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="topic-map-3d-button"
            >
              <Maximize2 size={12} /> {isFullscreen ? '창 모드로 보기' : '전체 화면'}
            </button>
          </div>
        </div>

        <div className="topic-map-3d-canvas">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              <span>지형도 데이터를 렌더링하는 중입니다...</span>
            </div>
          ) : (
            <Canvas
            camera={{ position: [0, 6, 34], fov: 46, near: 0.1, far: 120 }}
            raycaster={{ params: { Points: { threshold: 0.35 } } }}
            onPointerMissed={() => setSelectedTopic(null)}
          >
            <TopicScene
              topics={topics}
              selectedTopic={selectedTopic}
              onSelect={handleSelectTopic}
            />
          </Canvas>
          )}
          {!isLoading && <TopicDetailPanel topic={selectedTopicInfo} />}
        </div>
      </div>

      <style>{`
        .topic-map-3d-page {
          overflow: hidden;
        }

        .topic-map-3d-stage {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .topic-map-3d-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          background: rgba(255, 255, 255, 0.86);
          border-bottom: 1px solid #e2e8f0;
          backdrop-filter: blur(10px);
          z-index: 2;
        }

        .topic-map-3d-count {
          font-size: 0.72rem;
          font-weight: 800;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.18rem 0.5rem;
          border-radius: 999px;
        }

        .topic-map-3d-hint {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }

        .topic-map-3d-button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          border-radius: 0.5rem;
          padding: 0.35rem 0.55rem;
          font-weight: 700;
          transition: background 160ms ease, border-color 160ms ease;
        }

        .topic-map-3d-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .topic-map-3d-canvas {
          position: relative;
          flex: 1;
          min-height: 520px;
          height: 100%;
        }

        .topic-map-3d-canvas canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .topic-map-3d-stage.fullscreen-card {
          height: 100vh;
          width: 100vw;
        }

        .topic-map-3d-detail {
          position: absolute;
          right: 1rem;
          top: 1rem;
          bottom: 1rem;
          width: min(360px, calc(100% - 2rem));
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          overflow: hidden;
          pointer-events: auto;
        }

        .topic-detail-section {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
          padding: 0.9rem;
          backdrop-filter: blur(12px);
        }

        .topic-detail-section:last-child {
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .topic-detail-eyebrow {
          margin-bottom: 0.45rem;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #64748b;
        }

        .topic-detail-title-row,
        .raw-cluster-heading {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
        }

        .topic-detail-title-row h4,
        .raw-cluster-heading strong {
          min-width: 0;
          flex: 1;
          margin: 0;
          color: #0f172a;
          font-size: 0.95rem;
          font-weight: 900;
        }

        .topic-detail-title-row span:last-child,
        .raw-cluster-heading span:last-child {
          color: #475569;
          font-size: 0.72rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .topic-detail-color {
          width: 0.72rem;
          height: 0.72rem;
          flex: 0 0 0.72rem;
          border-radius: 999px;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.14);
        }

        .topic-keyword-row,
        .raw-keyword-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.65rem;
        }

        .topic-keyword,
        .raw-keyword-row span {
          max-width: 100%;
          overflow-wrap: anywhere;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 999px;
          padding: 0.16rem 0.42rem;
          color: #334155;
          font-size: 0.68rem;
          font-weight: 800;
          line-height: 1.35;
        }

        .topic-detail-description {
          margin: 0.55rem 0 0;
          color: #475569;
          font-size: 0.78rem;
          font-weight: 600;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .raw-cluster-description {
          font-size: 0.72rem;
          line-height: 1.45;
        }

        .raw-cluster-list {
          display: flex;
          min-height: 0;
          flex-direction: column;
          gap: 0.55rem;
          overflow: auto;
          padding-right: 0.15rem;
        }

        .raw-cluster-item {
          border: 1px solid #e2e8f0;
          border-radius: 0.45rem;
          background: rgba(248, 250, 252, 0.86);
          padding: 0.65rem;
        }

        @media (max-width: 900px) {
          .topic-map-3d-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .topic-map-3d-hint {
            white-space: normal;
          }

          .topic-map-3d-detail {
            left: 0.75rem;
            right: 0.75rem;
            top: auto;
            bottom: 0.75rem;
            width: auto;
            max-height: 44%;
          }
        }
      `}</style>
    </div>
  );
};

export default TopicModelMap;
