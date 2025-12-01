"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/#dashboard",
        color: "text-sky-500",
    },
    {
        label: "Assets",
        icon: Wallet,
        href: "/#assets",
        color: "text-violet-500",
    },
    {
        label: "Analytics",
        icon: PieChart,
        href: "/analytics",
        color: "text-pink-700",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "#",
        color: "text-gray-400",
    },
];

export function MobileNav() {
    const pathname = usePathname();

    const handleNavClick = (e: React.MouseEvent, href: string) => {
        if (href === "#") {
            e.preventDefault();
            alert("Settings feature coming soon!");
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-gray-800 md:hidden">
            <div className="flex justify-around items-center h-16">
                {routes.map((route) => {
                    const isActive = (pathname === "/" && route.href.startsWith("/#")) || pathname === route.href;
                    return (
                        <Link
                            key={route.label}
                            href={route.href}
                            onClick={(e) => handleNavClick(e, route.href)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            <route.icon className={cn("h-5 w-5", isActive && route.color)} />
                            <span className="text-[10px] font-medium">{route.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
