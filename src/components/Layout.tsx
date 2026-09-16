import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';

export const Layout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
};
