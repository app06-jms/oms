import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { Toaster } from '@/components/ui/toaster';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader onOpenMenu={() => setMobileMenuOpen(true)} />
      <div className="flex">
        <AppSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileNavDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <Toaster />
    </div>
  );
}
