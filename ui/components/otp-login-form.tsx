"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, Mail, Shield } from "lucide-react";
import { useTranslations, useLocale } from "@/components/translation-provider";
import { AuthLogo } from "@/components/auth-logo";

interface OtpLoginFormProps {
  className?: string;
}

interface OtpLoginState {
  email: string;
  otp: string;
  step: 'email' | 'otp';
  isLoading: boolean;
  isResending: boolean;
  error: string | null;
  canResend: boolean;
  resendCountdown: number;
}

export function OtpLoginForm({ className }: OtpLoginFormProps) {
  const [state, setState] = useState<OtpLoginState>({
    email: "",
    otp: "",
    step: "email",
    isLoading: false,
    isResending: false,
    error: null,
    canResend: false,
    resendCountdown: 0,
  });
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();
  const locale = useLocale();

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.resendCountdown > 0) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          resendCountdown: prev.resendCountdown - 1,
        }));
      }, 1000);
    } else if (state.step === 'otp' && state.resendCountdown === 0) {
      setState(prev => ({ ...prev, canResend: true }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.resendCountdown, state.step]);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Enhanced error message parser
  const getErrorMessage = useCallback((error: unknown, context: 'send' | 'verify' | 'resend'): string => {
    if (!(error instanceof Error)) {
      return context === 'send' ? "Có lỗi xảy ra khi gửi OTP"
        : context === 'verify' ? "Có lỗi xảy ra khi xác thực OTP"
          : "Có lỗi xảy ra khi gửi lại OTP";
    }

    const errorMessage = error.message.toLowerCase();

    // Handle specific Supabase error cases
    if (errorMessage.includes('invalid_credentials') || errorMessage.includes('invalid login credentials')) {
      return "Thông tin đăng nhập không chính xác";
    }

    if (errorMessage.includes('email_not_confirmed')) {
      return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn";
    }

    if (errorMessage.includes('too_many_requests') || errorMessage.includes('rate limit')) {
      return t('auth.otp.errors.tooManyRequests');
    }

    if (errorMessage.includes('invalid_otp') || errorMessage.includes('otp_expired')) {
      return t('auth.otp.errors.otpExpired');
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return t('auth.otp.errors.networkError');
    }

    if (errorMessage.includes('signup') && errorMessage.includes('disabled')) {
      return t('auth.otp.errors.signupDisabled');
    }

    // Return original message if no specific case matches
    return error.message || (context === 'send' ? "Có lỗi xảy ra khi gửi OTP"
      : context === 'verify' ? "Có lỗi xảy ra khi xác thực OTP"
        : "Có lỗi xảy ra khi gửi lại OTP");
  }, [t]);

  // Verify OTP function
  const verifyOtp = useCallback(async () => {
    if (!state.otp || state.otp.length !== 6) {
      setState(prev => ({ ...prev, error: t('auth.otp.errors.invalidOtp') }));
      return;
    }

    const supabase = createClient();
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: state.email,
        token: state.otp,
        type: 'email',
      });

      if (error) throw error;

      // Redirect to dashboard on successful authentication
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error, 'verify')
      }));
    }
  }, [state.email, state.otp, router, locale, t, getErrorMessage]);

  // Auto-focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (state.step === 'otp' && otpInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [state.step]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (state.step === 'otp' && state.otp.length === 6 && !state.isLoading && !state.error) {
      // Small delay to allow user to see the complete OTP before submitting
      const timer = setTimeout(() => {
        verifyOtp();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [state.otp, state.step, state.isLoading, state.error, verifyOtp]);



  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format
    if (!isValidEmail(state.email)) {
      setState(prev => ({ ...prev, error: t('auth.otp.errors.invalidEmail') }));
      return;
    }

    const supabase = createClient();
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: state.email,
        options: {
          shouldCreateUser: true, // Allow both existing and new users
        },
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        step: "otp",
        isLoading: false,
        error: null,
        canResend: false,
        resendCountdown: 60
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error, 'send')
      }));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp();
  };

  const handleResendOtp = async () => {
    if (!state.canResend || state.isResending) return;

    const supabase = createClient();
    setState(prev => ({ ...prev, isResending: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: state.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        isResending: false,
        canResend: false,
        resendCountdown: 60,
        error: null
      }));
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isResending: false,
        error: getErrorMessage(error, 'resend')
      }));
    }
  };

  const handleBackToEmail = () => {
    setState(prev => ({
      ...prev,
      step: "email",
      otp: "",
      error: null,
      canResend: false,
      resendCountdown: 0
    }));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <AuthLogo />
      <Card className="overflow-hidden w-full">
        <CardHeader className="text-center space-y-3 md:space-y-4 px-4 md:px-6">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {state.step === "email" ? (
              <Mail className="w-6 h-6 md:w-8 md:h-8 text-white" />
            ) : (
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {state.step === "email" ? t('auth.otp.title') : t('auth.otp.enterOtpTitle')}
            </CardTitle>
            <CardDescription className="text-sm md:text-base px-2">
              {state.step === "email"
                ? t('auth.otp.description')
                : t('auth.otp.otpSentDescription').replace('{email}', state.email)
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            state.step === "email" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"
          )}>
            {state.step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4 md:space-y-6">
                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    {t('auth.otp.emailLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.login.emailPlaceholder')}
                      required
                      value={state.email}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        email: e.target.value,
                        error: null
                      }))}
                      className="pl-10 h-11 md:h-12 text-sm md:text-base border-2 focus:border-blue-500 transition-colors"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {state.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{state.error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 md:h-12 text-sm md:text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 touch-manipulation"
                  disabled={state.isLoading || !state.email}
                >
                  {state.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('auth.otp.sending')}
                    </div>
                  ) : (
                    t('auth.otp.sendOtp')
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className={cn(
            "transition-all duration-500 ease-in-out",
            state.step === "otp" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 hidden"
          )}>
            {state.step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <Label className="text-sm font-medium text-gray-700 block text-center">
                    {t('auth.otp.otpLabel')}
                  </Label>

                  <OtpInput
                    value={state.otp}
                    onChange={(value) => setState(prev => ({
                      ...prev,
                      otp: value,
                      error: null
                    }))}
                    disabled={state.isLoading}
                    className="justify-center"
                  />

                  {state.otp.length === 6 && !state.isLoading && !state.error && (
                    <div className="text-center">
                      <p className="text-xs text-blue-600 font-medium animate-pulse">
                        {t('auth.otp.autoVerifying')}
                      </p>
                    </div>
                  )}
                </div>

                {state.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{state.error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-11 md:h-12 text-sm md:text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 touch-manipulation"
                    disabled={state.isLoading || state.otp.length !== 6}
                  >
                    {state.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('auth.otp.verifying')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('auth.otp.verifyOtp')}
                      </div>
                    )}
                  </Button>

                  {/* Resend OTP button with circular progress */}
                  <div className="flex items-center justify-center gap-3">
                    {!state.canResend && state.resendCountdown > 0 && (
                      <CircularProgress
                        value={((60 - state.resendCountdown) / 60) * 100}
                        size={32}
                        className="text-blue-500"
                      >
                        <span className="text-xs font-medium text-gray-600">
                          {state.resendCountdown}
                        </span>
                      </CircularProgress>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      onClick={handleResendOtp}
                      disabled={!state.canResend || state.isResending || state.isLoading}
                    >
                      {state.isResending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          {t('auth.otp.resending')}
                        </div>
                      ) : state.canResend ? (
                        t('auth.otp.resendOtp')
                      ) : (
                        t('auth.otp.resendCountdown').replace('{seconds}', state.resendCountdown.toString())
                      )}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 md:h-11 text-sm border-2 hover:bg-gray-50 transition-colors touch-manipulation"
                    onClick={handleBackToEmail}
                    disabled={state.isLoading || state.isResending}
                  >
                    {t('auth.otp.backToEmail')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success animation overlay */}
      {state.step === "otp" && state.isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-gray-700">{t('auth.otp.verifying')}</p>
          </div>
        </div>
      )}
    </div>
  );
}