'use client';

import { useParams } from 'next/navigation';

export function useBranchPath() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  return (path = '') => slug ? `/s/${slug}${path}` : (path || '/');
}
