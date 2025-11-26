"use client";

import { LoginForm } from "@/components/login-form";
import { OtpLoginForm } from "@/components/otp-login-form";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/translation-provider";
import { useState } from "react";

export default function Page() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const t = useTranslations();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* Login method toggle */}
        <div className="mb-8 flex rounded-xl border-2 p-1 bg-gray-50">
          <Button
            variant={loginMethod === 'password' ? 'default' : 'ghost'}
            className={`flex-1 text-sm font-medium transition-all duration-200 ${
              loginMethod === 'password' 
                ? 'bg-white shadow-sm border-0 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => setLoginMethod('password')}
          >
            🔐 {t('auth.login.passwordLogin')}
          </Button>
          <Button
            variant={loginMethod === 'otp' ? 'default' : 'ghost'}
            className={`flex-1 text-sm font-medium transition-all duration-200 ${
              loginMethod === 'otp' 
                ? 'bg-white shadow-sm border-0 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => setLoginMethod('otp')}
          >
            📧 {t('auth.login.otpLogin')}
          </Button>
        </div>

        {/* Render appropriate form based on selected method */}
        {loginMethod === 'password' ? <LoginForm /> : <OtpLoginForm />}
      </div>
    </div>
  );
}
