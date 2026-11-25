'use client';

import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';

const validNames = new Set<string>(iconNames);

export function DynamicCategoryIcon({ name, className }: { name: string; className?: string }) {
  if (!validNames.has(name)) return null;
  return <DynamicIcon key={name} name={name as IconName} className={className} aria-hidden="true" />;
}
