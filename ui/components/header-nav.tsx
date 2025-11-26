"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "./translation-provider";

interface HeaderNavProps {
  isAuthenticated: boolean;
  locale: string;
}

const getNavItems = (locale: string, t: (key: string) => string) => {
  const publicNavItems = [
    { href: `/${locale}`, label: t('navigation.home') },
  ];

  const protectedNavItems = [
    { href: `/${locale}`, label: t('navigation.home') },
    { href: `/${locale}/dashboard`, label: t('navigation.dashboard') },
    { href: `/${locale}/results`, label: t('navigation.results') },
    { href: `/${locale}/messages`, label: t('navigation.messages') },
    { href: `/${locale}/history`, label: t('navigation.history') },
    { href: `/${locale}/settings`, label: t('navigation.settings') },
    { href: `/${locale}/assessment`, label: t('navigation.assessment') },
  ];

  return { publicNavItems, protectedNavItems };
};

export function HeaderNav({ isAuthenticated, locale }: HeaderNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations();

  const { publicNavItems, protectedNavItems } = getNavItems(locale, t);
  let navItems = publicNavItems;
  if (isAuthenticated) {
    navItems = protectedNavItems;
  }
  const showNavigation = navItems.length > 1;

  if (!showNavigation) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg z-50">
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}