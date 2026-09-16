import { NavLink, useLocation } from 'react-router-dom';
import { Bot, Flame, LayoutDashboard, Leaf, NotebookPen, Salad, Target } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { path: '/', label: '今日概况', icon: LayoutDashboard, end: true },
  { path: '/foods', label: '食物库', icon: Salad },
  { path: '/records', label: '饮食记录', icon: NotebookPen },
  { path: '/assistant', label: '智能助手', icon: Bot },
  { path: '/plan', label: '我的方案', icon: Target },
  { path: '/exercise', label: '运动消耗', icon: Flame },
];

export default function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">轻食计</p>
            <p className="truncate text-xs text-sidebar-foreground/60">减肥饮食助手</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>功能</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.end
                ? pathname === item.path
                : pathname.startsWith(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={active}>
                    <NavLink to={item.path} end={item.end}>
                      <Icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 py-2 text-xs leading-relaxed text-sidebar-foreground/50">
          数据仅保存在本机浏览器
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
