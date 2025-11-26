"use client";

import Link from "next/link";
import { useLocale } from "@/components/translation-provider";

export function AuthLogo() {
  const locale = useLocale();

  return (
    <div className="flex justify-center mb-8">
      <Link 
        href={`/${locale}`}
        className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span>Logo</span>
      </Link>
    </div>
  );
}