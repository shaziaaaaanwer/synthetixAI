
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import { Logo } from '../icons/logo'
import { ThemeToggle } from '../common/theme-toggle'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const isPublicPage = ['/login'].includes(pathname);
    const isHomepage = pathname === '/';

    // Allow anyone to see the homepage
    if (isHomepage) return;

    // If user is not logged in and not on a public page, redirect to login
    if (!user && !isPublicPage) {
      router.push('/login');
    }

    // If user is logged in and on the login page, redirect to dashboard
    if (user && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Logo className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  // Render public pages without the main sidebar layout
  if (['/', '/login'].includes(pathname)) {
    return <>{children}</>;
  }

  // For protected pages, ensure user is logged in before rendering the layout
  // This prevents flashing the protected content before the redirect can happen.
  if (!user) {
    return null;
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center justify-between border-b bg-background px-4 sticky top-0 z-10 lg:h-14 lg:px-6">
                <div className="lg:hidden">
                    <SidebarTrigger />
                </div>
                <div className="hidden lg:block" />
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
