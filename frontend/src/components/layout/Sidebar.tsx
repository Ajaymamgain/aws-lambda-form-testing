"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  ClockIcon,
  PlayIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Run Test", href: "/run-test", icon: PlayIcon },
  { name: "Test Results", href: "/test-results", icon: ChartBarIcon },
  { name: "Schedules", href: "/schedules", icon: ClockIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when changing routes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (sidebarOpen && 
          (event.target as HTMLElement).closest('.mobile-sidebar') === null && 
          (event.target as HTMLElement).closest('.sidebar-toggle') === null) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="fixed inset-0 flex z-40 md:hidden">
        <button
          type="button"
          className="sidebar-toggle fixed left-4 top-4 inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-600 bg-opacity-75 z-30 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div
        className={`mobile-sidebar fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent pathname={pathname} closeSidebar={() => setSidebarOpen(false)} isMobile={true} />
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent pathname={pathname} />
      </div>
    </>
  );
}

interface SidebarContentProps {
  pathname: string;
  closeSidebar?: () => void;
  isMobile?: boolean;
}

function SidebarContent({ pathname, closeSidebar, isMobile = false }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-primary-700">Form Testing</h2>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = 
              item.href === "/" 
                ? pathname === "/" 
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={isMobile ? closeSidebar : undefined}
                className={`${
                  isActive
                    ? "bg-primary-50 text-primary-700 sidebar-item active"
                    : "text-neutral-700 hover:bg-neutral-50 sidebar-item"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
              >
                <item.icon
                  className={`${
                    isActive ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-700"
                  } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
              <span className="text-sm font-medium">AT</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-700">Automated Testing</p>
            <p className="text-xs font-medium text-neutral-500">v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
