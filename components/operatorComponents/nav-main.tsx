"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { LayoutDashboard, Users, CreditCard, Settings2, Boxes, Hammer, FlaskConical } from "lucide-react";

const items = [
  {
    title: "Apply Modifications",
    url: '/operator/applyModification',
    icon: Hammer,
  },
  {
    title: "Samples",
    url: '/operator/recentWork',
    icon: FlaskConical,
  },
  {
    title: "Inventory",
    url: '/operator/inventory',
    icon: Boxes, 
  },
  
  {
    title: "Settings",
    url: '/operator/accountSettings',
    icon: Settings2,
  },
]


export function NavMain(
) {


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