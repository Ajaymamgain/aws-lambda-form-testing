"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Generate the title based on the current path
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/run-test") return "Run Test";
    if (pathname === "/test-results") return "Test Results";
    if (pathname.startsWith("/test-results/")) return "Test Details";
    if (pathname === "/schedules") return "Test Schedules";
    if (pathname.startsWith("/schedules/")) return "Schedule Details";
    if (pathname === "/settings") return "Settings";
    
    // Fallback
    return "Form Testing Platform";
  };

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center">
          <h1 className="text-lg md:text-xl font-semibold text-neutral-900">{getPageTitle()}</h1>
          
          {/* Breadcrumbs for deeper pages */}
          {(pathname.startsWith("/test-results/") || pathname.startsWith("/schedules/")) && (
            <div className="ml-4 flex items-center text-sm text-neutral-500">
              <Link 
                href={pathname.startsWith("/test-results/") ? "/test-results" : "/schedules"}
                className="hover:text-primary-600 transition-colors"
              >
                {pathname.startsWith("/test-results/") ? "Test Results" : "Schedules"}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-600">
                {pathname.split("/").pop()?.substring(0, 8)}...
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Quick help button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-1.5 text-neutral-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span className="sr-only">View help</span>
            <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          
          {/* Notifications dropdown */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full p-1.5 text-neutral-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              
              {/* Notification indicator */}
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm font-medium text-neutral-900 border-b border-neutral-100">
                    Notifications
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                      <div className="font-medium">Test Failed</div>
                      <div className="text-xs text-neutral-500">4 minutes ago</div>
                      <div className="mt-1">Form test for example.com failed with validation errors.</div>
                    </div>
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                      <div className="font-medium">Test Completed</div>
                      <div className="text-xs text-neutral-500">20 minutes ago</div>
                      <div className="mt-1">Weekly schedule ran successfully for login form.</div>
                    </div>
                  </div>
                  <div className="border-t border-neutral-100">
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-neutral-50"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Create new test button */}
          <Link
            href="/run-test"
            className="hidden sm:inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            New Test
          </Link>
        </div>
      </div>
    </header>
  );
}
