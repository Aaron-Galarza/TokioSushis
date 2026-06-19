'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './Footer';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrivateRoute = pathname?.startsWith('/admin') || pathname === '/login';

  if (isPrivateRoute) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </>
  );
}
