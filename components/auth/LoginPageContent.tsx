"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SocialLoginButton from "./SocialLoginButton";
import { account } from "../../config/texts/vi/account";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>();

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = account.errors.oauthGenericError;
      
      switch (error) {
        case 'oauth_cancelled':
          errorMessage = account.errors.oauthCancelled;
          break;
        case 'oauth_failed':
          errorMessage = account.errors.oauthFailed;
          break;
        case 'oauth_invalid_request':
        case 'oauth_invalid_grant':
          errorMessage = account.errors.oauthInvalidGrant;
          break;
        case 'oauth_session_expired':
          errorMessage = account.errors.oauthGenericError;
          break;
        case 'oauth_init_failed':
        case 'oauth_error':
          errorMessage = account.errors.oauthNetworkError;
          break;
      }
      
      setError("root", { message: errorMessage });
    }
  }, [searchParams, setError]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store user session data in localStorage for cross-app authentication
        if (result.user) {
          localStorage.setItem('okbuddy_user', JSON.stringify(result.user));
          localStorage.setItem('okbuddy_auth_token', result.user.id); // Simple token based on user ID
          
          console.log('✅ User data stored in localStorage:', result.user);
        }
        
        // Check if user is admin and redirect accordingly
        const isAdmin = result.user?.email === 'admin@example.com';
        const redirectPath = isAdmin ? '/admin' : '/cv-workspace';
        
        console.log(`🔄 Redirecting ${isAdmin ? 'admin' : 'user'} to ${redirectPath}...`);
        
        try {
          // Use unified app routing with role-based redirect
          window.location.href = redirectPath;
          
          // Fallback redirect
          setTimeout(() => {
            if (window.location.pathname !== redirectPath) {
              console.log('🔄 Fallback redirect attempt...');
              window.location.replace(redirectPath);
            }
          }, 1000);
          
        } catch (redirectError) {
          console.error('❌ Redirect error:', redirectError);
          // Use Next.js router as fallback
          window.location.pathname = redirectPath;
        }
      } else {
        const errorResult = await response.json();
        setError("root", { message: errorResult.error || account.errors.loginFailed });
      }
    } catch (error) {
      setError("root", { message: account.errors.loginFailed });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    try {
      setSocialLoading(provider);
      
      // Redirect to OAuth endpoint
      window.location.href = `/api/auth/${provider}/signin`;
    } catch (error) {
      console.error(`❌ ${provider} OAuth error:`, error);
      setSocialLoading(null);
    }
  };

  return (
    <main className="flex-1 flex justify-center items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
        {/* Form Header */}
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            {account.login.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {account.login.subtitle}
          </p>
        </header>

        {/* Social Login Section */}
        <section className="space-y-3 mb-6" aria-label="Đăng nhập bằng mạng xã hội">
          <SocialLoginButton
            provider="google"
            text={account.login.social.google.button}
            onClick={() => handleSocialLogin('google')}
            loading={socialLoading === 'google'}
            disabled={socialLoading !== null}
          />
          <SocialLoginButton
            provider="linkedin"
            text={account.login.social.linkedin.button}
            onClick={() => handleSocialLogin('linkedin')}
            loading={socialLoading === 'linkedin'}
            disabled={socialLoading !== null}
          />
        </section>

        {/* Divider */}
        <div className="flex items-center my-6" role="separator" aria-label="Hoặc">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-sm text-gray-400">{account.login.social.divider}</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.login.form.email.label}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email", { 
                required: account.errors.required,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: account.errors.invalidEmail
                }
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.login.form.email.placeholder}
            />
            {errors.email && (
              <p id="email-error" className="text-xs sm:text-sm text-red-500 mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.login.form.password.label}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password", { 
                required: account.errors.required 
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.login.form.password.placeholder}
            />
            {errors.password && (
              <p id="password-error" className="text-xs sm:text-sm text-red-500 mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-describedby={errors.root ? "form-error" : undefined}
            className="w-full h-11 sm:h-12 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base mt-6"
          >
            {isSubmitting ? "Đang xử lý..." : account.login.form.submitButton}
          </button>

          {/* Error Message */}
          {errors.root && (
            <p id="form-error" className="text-xs sm:text-sm text-red-500 text-center" role="alert">
              {errors.root.message}
            </p>
          )}
        </form>

        {/* Register Link */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-400">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 