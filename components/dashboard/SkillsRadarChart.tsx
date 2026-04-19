'use client';

import * as React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';

export default function SkillsRadarChart({
  data,
}: {
  data: { subject: string; level: number }[];
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  const gridStroke = isDark ? '#334155' : '#E5E7EB';
  const angleColor = isDark ? '#CBD5E1' : '#4B5563';
  const radiusColor = isDark ? '#64748B' : '#9CA3AF';
  const stroke = isDark ? '#54CD98' : '#044272';
  const fill = '#54CD98';

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5">
      <p className="text-xs text-gray-500 dark:text-muted-foreground">
        Skills Radar
      </p>
      <p className="font-semibold text-gray-900 dark:text-foreground mb-4">
        Strength across subjects
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: angleColor, fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: radiusColor, fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="Level"
              dataKey="level"
              stroke={stroke}
              fill={fill}
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
