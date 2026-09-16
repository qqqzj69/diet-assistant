import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Leaf } from 'lucide-react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import Iridescence from './Iridescence';

export const Layout = () => {
  const location = useLocation();
  return (
    <SidebarProvider>
      {/* 全站珠光背景：深青绿基底 + 青绿珠光流动（Iridescence 官方效果，不挡交互） */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[#03110f]">
        <Iridescence
          color={[0.3, 0.75, 0.7]}
          mouseReact={false}
          amplitude={0.1}
          speed={1.0}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* 移动端顶栏：汉堡打开侧边栏抽屉 */}
          <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/40 bg-background/80 px-3 py-2 backdrop-blur-lg md:hidden">
            <SidebarTrigger className="size-8" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">轻食计</span>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            {/* 内容浮层：浅色玻璃卡片浮在深色珠光上，四周露出珠光背景 */}
            <div className="mx-auto w-full max-w-6xl p-3 sm:p-8">
              <div className="rounded-3xl border border-white/40 bg-background/90 p-3 shadow-2xl backdrop-blur-xl sm:p-6">
                <div key={location.pathname} className="page-enter">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
};
