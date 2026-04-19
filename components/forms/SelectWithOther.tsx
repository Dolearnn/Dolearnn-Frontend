'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const OTHER_VALUE = 'Other';

interface SelectWithOtherProps {
  value: string;
  onValueChange: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  otherPlaceholder?: string;
  id?: string;
  disabled?: boolean;
}

export function SelectWithOther({
  value,
  onValueChange,
  otherValue,
  onOtherChange,
  options,
  placeholder = 'Select an option',
  otherPlaceholder = 'Please specify',
  id,
  disabled,
}: SelectWithOtherProps) {
  const showOther = value === OTHER_VALUE;
  return (
    <div className="space-y-2">
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AnimatePresence initial={false}>
        {showOther && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Input
              placeholder={otherPlaceholder}
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
