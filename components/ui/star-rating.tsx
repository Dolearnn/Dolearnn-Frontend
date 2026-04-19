'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const sizeClass: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

interface BaseProps {
  value: number;
  max?: number;
  size?: Size;
  className?: string;
}

interface ReadonlyProps extends BaseProps {
  readOnly: true;
  showValue?: boolean;
}

interface InteractiveProps extends BaseProps {
  readOnly?: false;
  onChange: (value: number) => void;
}

export function StarRating(props: ReadonlyProps | InteractiveProps) {
  const { value, max = 5, size = 'md', className } = props;
  const [hovered, setHovered] = React.useState<number | null>(null);
  const readOnly = 'readOnly' in props && props.readOnly === true;
  const display = hovered ?? value;

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const idx = i + 1;
        const filled = idx <= display;
        if (readOnly) {
          return (
            <Star
              key={idx}
              className={cn(
                sizeClass[size],
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300 dark:text-white/20',
              )}
            />
          );
        }
        return (
          <motion.button
            key={idx}
            type="button"
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.15 }}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => (props as InteractiveProps).onChange(idx)}
            aria-label={`Rate ${idx} of ${max}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <Star
              className={cn(
                sizeClass[size],
                'transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300 dark:text-white/20',
              )}
            />
          </motion.button>
        );
      })}
      {readOnly && (props as ReadonlyProps).showValue && (
        <span className="ml-1.5 text-xs font-medium text-gray-700 dark:text-foreground/90">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
