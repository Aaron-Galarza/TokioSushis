'use client';

import { createElement, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface Props {
  categoryName: string;
  iconKey?: string;
  className?: string;
}

type DynamicCategoryIcon = ComponentType<{ name: string; className?: string }>;

export function CategoryIcon({ categoryName, iconKey, className }: Props) {
  const [DynamicIcon, setDynamicIcon] = useState<DynamicCategoryIcon | null>(null);
  const dynamicName = iconKey?.startsWith('lucide:') ? iconKey.slice(7) : null;

  useEffect(() => {
    if (!dynamicName) return;
    let active = true;
    import('./DynamicCategoryIcon').then(({ DynamicCategoryIcon }) => {
      if (active) setDynamicIcon(() => DynamicCategoryIcon);
    });
    return () => { active = false; };
  }, [dynamicName]);

  if (dynamicName) {
    return DynamicIcon ? <DynamicIcon name={dynamicName} className={className} /> : <span aria-hidden="true" className={className} />;
  }

  const Icon = getCategoryIcon(categoryName, iconKey);
  return createElement(Icon, { className });
}
