import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AXES = [
  { id: 'public_theology', title: '공공신학', color: '#3b82f6' },
  { id: 'prosperity_theology', title: '번영신학', color: '#f59e0b' },
  { id: 'political_mobilization', title: '정치동원', color: '#10b981' },
  { id: 'authoritarian_control', title: '권위주의 통제', color: '#ef4444' },
];

const AXIS_LABELS = Object.fromEntries(AXES.map((axis) => [axis.id, axis.title]));
const CHART_TICKS = [0, 5, 10, 15, 20];

const VIEW_PRESETS = {
  full: {
    rootClassName: 'mt-4',
    chartCardClassName: 'card p-6 w-full mt-4',
    chartMaxWidth: '640px',
    chartMargin: { top: 18, right: 24, bottom: 42, left: 42 },
    tickFontSize: 12,
    labelFontSize: 13,
    xLabelOffset: 18,
    yAxisWidth: 46,
    yLabelOffset: 2,
    dotStrokeWidth: 1.2,
    axisButtonGap: '0.55rem',
    axisButtonPadding: undefined,
    axisButtonFontSize: undefined,
    badgeMinWidth: '1.6rem',
    badgeHeight: '1.6rem',
    badgeFontSize: '0.72rem',
    showAxisCards: true,
  },
  compact: {
    rootClassName: 'card p-6 bg-white flex flex-col gap-4',
    rootStyle: { minHeight: 'unset' },
    chartCardClassName: '',
    chartMaxWidth: '460px',
    chartMargin: { top: 18, right: 18, bottom: 38, left: 38 },
    tickFontSize: 11,
    labelFontSize: 12,
    xLabelOffset: 14,
    yAxisWidth: 42,
    yLabelOffset: 0,
    dotStrokeWidth: 1.1,
    axisButtonGap: '0.45rem',
    axisButtonPadding: '0.5rem 1rem',
    axisButtonFontSize: '0.88rem',
    badgeMinWidth: '1.4rem',
    badgeHeight: '1.4rem',
    badgeFontSize: '0.7rem',
    showAxisCards: false,
  },
};

const clampScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(20, Math.max(0, Math.round(n)));
};

const normalize = (value, min, max, outMin, outMax) => {
  if (max <= min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
};

const buildBuckets = (data, xAxisId, yAxisId, selectedChannel) => {
  const buckets = new Map();

  (data || []).forEach((church) => {
    (church.sermons || []).forEach((sermon) => {
      const scores = sermon?.scores || {};
      const x = xAxisId === 'fixed_10' ? 10 : clampScore(scores[xAxisId]);
      const y = clampScore(scores[yAxisId]);
      const key = `${x}:${y}`;

      if (!buckets.has(key)) {
        buckets.set(key, {
          x,
          y,
          totalCount: 0,
          selectedCount: 0,
        });
      }

      const bucket = buckets.get(key);
      bucket.totalCount += 1;
      if (selectedChannel && church.church === selectedChannel) {
        bucket.selectedCount += 1;
      }
    });
  });

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      selectedShare: selectedChannel && bucket.totalCount > 0 ? bucket.selectedCount / bucket.totalCount : 0,
    }))
    .filter((bucket) => bucket.totalCount > 0);
};

const applyDensityStyle = (points, minRadius, maxRadius, minOpacity, maxOpacity, selectedChannel) => {
  if (!points.length) {
    return { baseSeries: [], selectedSeries: [] };
  }

  const densities = points.map((point) => Math.log1p(point.totalCount));
  const minDensity = Math.min(...densities);
  const maxDensity = Math.max(...densities);

  if (!selectedChannel) {
    return {
      baseSeries: points.map((point) => ({
        ...point,
        radius: normalize(Math.log1p(point.totalCount), minDensity, maxDensity, minRadius, maxRadius),
        opacity: normalize(Math.log1p(point.totalCount), minDensity, maxDensity, minOpacity, maxOpacity),
        fill: '#3b82f6',
      })),
      selectedSeries: [],
    };
  }

  const selectedPoints = points.filter((point) => point.selectedCount > 0);
  const selectedCounts = selectedPoints.map((point) => Math.log1p(point.selectedCount));
  const minSelectedCount = Math.min(...selectedCounts);
  const maxSelectedCount = Math.max(...selectedCounts);

  return {
    baseSeries: points.map((point) => ({
      ...point,
      radius: normalize(Math.log1p(point.totalCount), minDensity, maxDensity, minRadius, maxRadius),
      opacity: normalize(Math.log1p(point.totalCount), minDensity, maxDensity, 0.4, 0.6),
      fill: '#2071f3',
    })),
    selectedSeries: selectedPoints.map((point) => ({
      ...point,
      radius: normalize(
        Math.log1p(point.selectedCount),
        minSelectedCount,
        maxSelectedCount,
        minRadius * 0.8,
        maxRadius * 0.8
      ),
      opacity: normalize(Math.log1p(point.selectedCount), minSelectedCount, maxSelectedCount, 0.6, 0.8),
      fill: '#e10d0d',
    })),
  };
};

const AxisButton = ({ axis, selectedAxes, axisMode, preset, onClick }) => {
  const selectedIndex = selectedAxes.indexOf(axis.id);
  const isSelected = selectedIndex !== -1;
  const badge = axisMode === 'single'
    ? (isSelected ? 'Y' : '')
    : (selectedIndex === 0 ? 'X' : selectedIndex === 1 ? 'Y' : '');

  return (
    <button
      key={axis.id}
      onClick={() => onClick(axis.id)}
      className={`axis-tab ${isSelected ? 'active' : ''}`}
      style={{
        '--tab-color': axis.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: preset.axisButtonGap,
        justifyContent: 'center',
        fontSize: preset.axisButtonFontSize,
        padding: preset.axisButtonPadding,
      }}
    >
      <span>{axis.title}</span>
      {badge ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: preset.badgeMinWidth,
            height: preset.badgeHeight,
            padding: preset.badgeMinWidth === '1.6rem' ? '0 0.35rem' : undefined,
            borderRadius: '999px',
            background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(15, 23, 42, 0.08)',
            color: isSelected ? 'white' : 'var(--color-text-secondary)',
            fontSize: preset.badgeFontSize,
            fontWeight: 800,
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
};

const ScatterTooltip = ({ active, payload, selectedChannel, selectedEntityLabel }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-white p-3 shadow-md rounded-md max-w-xs" style={{ border: '1px solid var(--color-border)' }}>
      <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-brand-primary)' }}>
        좌표 정보
      </p>
      <p className="text-xs text-gray-600 mb-2">
        x: {point.x}, y: {point.y}
      </p>
      <p className="text-sm font-semibold mb-1">이 좌표의 설교 수: {point.totalCount}개</p>
      {selectedChannel ? (
        <>
          <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
            {selectedEntityLabel} 설교 수: {point.selectedCount}개
          </p>
          <p className="text-xs text-gray-500 mt-1">
            선택 비율: {((point.selectedShare || 0) * 100).toFixed(1)}%
          </p>
        </>
      ) : null}
    </div>
  );
};

const ScatterChartCanvas = ({ baseSeries, selectedSeries, xAxisLabel, yAxisLabel, preset }) => {
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={payload.radius}
        fill={payload.fill || '#3b82f6'}
        fillOpacity={payload.opacity}
        stroke="none"
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={preset.chartMargin}>
        <CartesianGrid strokeDasharray="4 4" stroke="#dbe4ee" vertical horizontal />
        <XAxis
          dataKey="x"
          type="number"
          domain={[-1, 21]}
          ticks={CHART_TICKS}
          axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
          tickLine={false}
          tick={{ fill: '#475569', fontSize: preset.tickFontSize, fontWeight: 600 }}
          label={{
            value: xAxisLabel,
            position: 'bottom',
            offset: preset.xLabelOffset,
            fill: '#334155',
            fontSize: preset.labelFontSize,
            fontWeight: 700,
          }}
        />
        <YAxis
          dataKey="y"
          type="number"
          domain={[-1, 21]}
          ticks={CHART_TICKS}
          axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
          tickLine={false}
          tick={{ fill: '#475569', fontSize: preset.tickFontSize, fontWeight: 600 }}
          width={preset.yAxisWidth}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: 'insideLeft',
            offset: preset.yLabelOffset,
            fill: '#334155',
            fontSize: preset.labelFontSize,
            fontWeight: 700,
          }}
        />
        <Tooltip
          content={<ScatterTooltip selectedChannel={preset.selectedChannel} selectedEntityLabel={preset.selectedEntityLabel} />}
          cursor={{ strokeDasharray: '4 4', stroke: '#94a3b8' }}
        />
        <Scatter data={baseSeries} shape={renderDot} isAnimationActive={false} />
        {selectedSeries.length ? (
          <Scatter data={selectedSeries} shape={renderDot} isAnimationActive={false} />
        ) : null}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

const ScatterPlotView = ({
  data,
  selectedChannel,
  selectedEntityName,
  selectedEntityLabel = '선택된 교회',
  variant = 'full',
  title,
  description,
}) => {
  const [selectedAxes, setSelectedAxes] = useState(['public_theology']);
  const preset = VIEW_PRESETS[variant] || VIEW_PRESETS.full;

  const axisMode = selectedAxes.length === 1 ? 'single' : 'double';
  const xAxisId = axisMode === 'single' ? 'fixed_10' : selectedAxes[0];
  const yAxisId = selectedAxes[selectedAxes.length - 1];
  const xAxisLabel = axisMode === 'single' ? (variant === 'compact' ? '중앙값 10 고정' : '축 설정되지 않음') : AXIS_LABELS[xAxisId];
  const yAxisLabel = AXIS_LABELS[yAxisId];

  const buckets = useMemo(
    () => buildBuckets(data, xAxisId, yAxisId, selectedChannel),
    [data, xAxisId, yAxisId, selectedChannel]
  );

  const { baseSeries, selectedSeries } = useMemo(
    () => applyDensityStyle(buckets, 3, 18, 0.6, 0.9, selectedChannel),
    [buckets, selectedChannel]
  );

  const handleAxisClick = (axisId) => {
    setSelectedAxes((current) => {
      if (current.includes(axisId)) {
        if (current.length === 1) return current;
        return current.filter((id) => id !== axisId);
      }

      if (current.length < 2) return [...current, axisId];
      return [current[1], axisId];
    });
  };

  const axisCards = [
    {
      slot: 'X축',
      label: axisMode === 'single' ? '중앙값 10' : xAxisLabel,
      status: axisMode === 'single' ? '고정' : '선택',
    },
    {
      slot: 'Y축',
      label: yAxisLabel,
      status: '선택',
    },
  ];

  const chartTitle = title || (axisMode === 'single' ? `${yAxisLabel} 산점도` : `${xAxisLabel} × ${yAxisLabel} 산점도`);
  const chartPreset = { ...preset, selectedChannel, selectedEntityLabel };
  const responsiveStyles = `
    .scatter-axis-info {
      min-width: 0;
    }
    @media (max-width: 860px) {
      .scatter-axis-controls {
        gap: 0.9rem;
      }
      .scatter-axis-tabs {
        flex: 1 1 100%;
      }
      .scatter-axis-info {
        flex: 1 1 100%;
        justify-content: flex-start;
      }
    }
  `;

  const axisControls = (
    <div className="scatter-axis-controls flex items-start justify-between gap-3 flex-wrap w-full">
      <div className={variant === 'compact' ? 'scatter-axis-tabs flex gap-2 flex-wrap items-center justify-start flex-1 min-w-0' : 'scatter-axis-tabs flex gap-4 flex-wrap flex-1 min-w-0'}>
        {AXES.map((axis) => (
          <AxisButton
            key={axis.id}
            axis={axis}
            selectedAxes={selectedAxes}
            axisMode={axisMode}
            preset={preset}
            onClick={handleAxisClick}
          />
        ))}
      </div>

      {preset.showAxisCards ? (
        <div className="scatter-axis-info flex items-center justify-end gap-2 flex-wrap ml-auto max-w-full w-full">
          {axisCards.map((item) => (
            <div
              key={item.slot}
              className="rounded-full border bg-slate-50/70 px-3 py-2 flex items-center gap-2"
              style={{ borderColor: 'var(--color-border)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              <span className="text-slate-400 font-bold">{item.slot}</span>
              <span className="font-extrabold text-slate-800">{item.label}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--color-brand-primary)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.14)',
                  borderRadius: '999px',
                  padding: '0.15rem 0.45rem',
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="scatter-axis-info flex items-center justify-end gap-3 flex-wrap ml-auto max-w-full w-full">
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-brand-primary)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '999px',
              padding: '0.35rem 0.7rem',
              whiteSpace: 'nowrap',
            }}
          >
            최대 2축 선택
          </span>
          <span className="text-slate-500" style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            X: {axisMode === 'single' ? '중앙값 10' : xAxisLabel}
          </span>
          <span className="text-slate-500" style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Y: {yAxisLabel}
          </span>
        </div>
      )}
    </div>
  );

  const chartCanvas = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flex: '1 1 auto', minHeight: 0 }}>
      <div
        style={{
          width: variant === 'compact' ? `min(100%, ${preset.chartMaxWidth})` : '100%',
          aspectRatio: '1 / 1',
          position: 'relative',
          maxWidth: variant === 'compact' ? undefined : preset.chartMaxWidth,
          margin: variant === 'compact' ? undefined : '0 auto',
          flex: variant === 'compact' ? '0 0 auto' : undefined,
        }}
      >
        <ScatterChartCanvas
          baseSeries={baseSeries}
          selectedSeries={selectedSeries}
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
          preset={chartPreset}
        />
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className={preset.rootClassName} style={{ ...preset.rootStyle, width: '100%' }}>
        <div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{chartTitle}</h4>
          <p className="text-slate-400" style={{ fontSize: '0.82rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
            {description || (selectedChannel
              ? `${selectedEntityName || selectedChannel} 기준으로 분포를 확인합니다.`
              : '교회를 선택하면 해당 교회가 빨간색으로 강조됩니다.')}
          </p>
        </div>

        {axisControls}
        {chartCanvas}

        <p className="text-slate-400 mt-4" style={{ fontSize: '0.83rem', marginBottom: 0, lineHeight: '1.45' }}>
          * 파란색은 전체 모집단, 빨간색은 선택된 교회입니다. 점의 크기와 투명도는 같은 좌표에 몰린 설교 수를 반영합니다.
        </p>
        <style>{responsiveStyles}</style>
      </div>
    );
  }

  return (
    <div className={preset.rootClassName}>
      <div className="bg-white p-4 rounded-lg mb-6 flex flex-col gap-4" style={{ border: '1px solid var(--color-border)' }}>
        <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
          <strong>산점도(Scatter Plot):</strong> 최대 2개의 지향성을 골라 2차원 좌표로 보여줍니다. 하나만 고르면 y축만 반영되고 x축은 10으로 고정됩니다. 점은 같은 좌표에 몰린 설교 수에 따라 크기와 투명도가 달라집니다.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: 'var(--color-brand-primary)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.16)',
                  borderRadius: '999px',
                  padding: '0.35rem 0.7rem',
                }}
              >
                축 선택
              </span>
              <span className="text-secondary" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                최대 2개의 지향성을 골라 2차원 좌표로 보여줍니다.
              </span>
            </div>
          </div>

          {axisControls}
        </div>
      </div>

      <div className={preset.chartCardClassName}>
        <h4 className="text-center font-bold mb-3 text-xl" style={{ color: 'var(--color-text-primary)' }}>
          {chartTitle}
        </h4>
        <p className="text-center text-secondary mb-5" style={{ fontSize: '0.9rem' }}>
          0부터 20까지 정수 단위의 점수입니다.
        </p>

        {chartCanvas}
        <style>{responsiveStyles}</style>
      </div>
    </div>
  );
};

export default ScatterPlotView;
