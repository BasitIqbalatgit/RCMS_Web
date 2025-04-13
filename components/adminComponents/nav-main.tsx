'use client';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, CreditCard, Settings2, Boxes } from 'lucide-react';

const items = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Manage Operators', url: '/admin/manageOperators', icon: Users },
  { title: 'Manage Inventory', url: '/admin/manageInventory', icon: Boxes },
  { title: 'Billing', url: '/admin/billing', icon: CreditCard },
  { title: 'Settings', url: '/admin/accountSettings', icon: Settings2 },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Link key={item.title} href={item.url} className={cn("rounded-none",
            pathname === item.url ? 'text-primary bg-primary/5' : 'text-muted-foreground'
          )}>
          <SidebarMenuItem >
            <SidebarMenuButton tooltip={item.title}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          </Link>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}