import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import WordCloudChart from 'react-d3-cloud';
import * as d3 from 'd3';

const WordCloud = ({ 
  words, 
  minFontSize = 10, 
  maxFontSize = 30, 
  delay = 0, 
  width = 180, 
  height = 180, 
  limit = 20, 
  padding = 1,
  squashFactor = 1.0 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(false);
    const timer = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timer);
  }, [delay, width, height, limit, words?.length]);

  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeTableau10), []);

  const data = useMemo(() => {
    if (!words || words.length === 0) return [];
    const sorted = [...words].sort((a, b) => b.value - a.value);
    const maxVal = sorted[0]?.value || 0;
    if (maxVal === 0) return [];

    return sorted
      .slice(0, limit)
      .map((w, i) => ({ 
        text: w.text, 
        rank: i,
        value: (Math.pow(w.value, squashFactor) / Math.pow(maxVal, squashFactor)) * 100
      }));
  }, [words, limit, squashFactor]);

  const getRotation = (d) => {
    const hash = d.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 30) - 15;
  };

  if (!words || words.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-300 text-[10px] italic">Empty</div>
  );

  if (!shouldRender) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-slate-50/50 rounded-lg">
      <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analyzing...</span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div className="w-full h-full pointer-events-none">
        <WordCloudChart
          data={data}
          width={width}
          height={height}
          font="Pretendard, sans-serif"
          fontSize={(word) => (word.value / 100) * (maxFontSize - minFontSize) + minFontSize}
          rotate={getRotation}
          spiral="archimedean"
          padding={padding}
          fill={(d, i) => colorScale(i)}
        />
      </div>
    </motion.div>
  );
};

export default WordCloud;
