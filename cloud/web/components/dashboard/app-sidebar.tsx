"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@supabase/supabase-js";

interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    plan: string;
    scans_this_month: number;
    scan_limit: number;
}

const navItems = [
    { title: "Overview", href: "/dashboard", icon: "◎" },
    { title: "Sites", href: "/dashboard/sites", icon: "🌐" },
    { title: "Scans", href: "/dashboard/scans", icon: "📊" },
    { title: "Alerts", href: "/dashboard/alerts", icon: "🔔" },
    { title: "API Keys", href: "/dashboard/api-keys", icon: "🔑" },
    { title: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export function AppSidebar({ user, profile }: { user: User; profile: Profile | null }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
    const initials = displayName.slice(0, 2).toUpperCase();
    const plan = profile?.plan || "free";

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    }

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-border/40 p-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">◎</span>
                    </div>
                    <div>
                        <span className="font-bold text-sm tracking-tight">ETALON</span>
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 capitalize border-emerald-500/30 text-emerald-400">
                            {plan}
                        </Badge>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>
                                            <span className="text-base">{item.icon}</span>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Usage</SidebarGroupLabel>
                    <SidebarGroupContent className="px-3">
                        <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Scans this month</span>
                                <span className="font-medium">{profile?.scans_this_month ?? 0}/{profile?.scan_limit ?? 10}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                                    style={{ width: `${Math.min(100, ((profile?.scans_this_month ?? 0) / (profile?.scan_limit ?? 10)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/40">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="w-full">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-cyan-600 text-white text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
