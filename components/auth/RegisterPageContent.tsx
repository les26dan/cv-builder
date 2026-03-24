"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MathCaptcha from "./MathCaptcha";
import SocialLoginButton from "./SocialLoginButton";
import { account } from "../../config/texts/index";

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tosAccepted: boolean;
}

export default function RegisterPageContent() {
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaSessionId, setCaptchaSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>();

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

  const password = watch("password");

  const handleCaptchaValidation = (isValid: boolean, sessionId?: string) => {
    setCaptchaValid(isValid);
    if (sessionId) {
      setCaptchaSessionId(sessionId);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!captchaValid || !captchaSessionId) {
      setError("root", { message: account.errors.captchaIncorrect });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          captchaAnswer: captchaValue,
          captchaSessionId: captchaSessionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store user session data in localStorage for cross-app authentication
        if (result.user) {
          localStorage.setItem('okbuddy_user', JSON.stringify(result.user));
          localStorage.setItem('okbuddy_auth_token', result.user.id); // Simple token based on user ID
        }
        
        // Redirect new users to CV Upload page as per Product Spec
        window.location.href = '/cv-upload';
      } else {
        const errorData = await response.json();
        setError("root", { message: errorData.error || account.errors.registrationFailed });
      }
    } catch (error) {
      setError("root", { message: account.errors.registrationFailed });
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
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            {account.register.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {account.register.subtitle}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <SocialLoginButton
            provider="google"
            text={account.register.social.google.button}
            onClick={() => handleSocialLogin('google')}
            loading={socialLoading === 'google'}
            disabled={socialLoading !== null}
          />
          {/* LinkedIn login temporarily disabled due to OAuth configuration issues */}
          {/* <SocialLoginButton
            provider="linkedin"
            text={account.register.social.linkedin.button}
            onClick={() => handleSocialLogin('linkedin')}
            loading={socialLoading === 'linkedin'}
            disabled={socialLoading !== null}
          /> */}
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-sm text-gray-400">{account.register.social.divider}</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.register.form.fullName.label}
            </label>
            <input
              type="text"
              {...register("fullName", { 
                required: account.errors.required 
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.register.form.fullName.placeholder}
            />
            {errors.fullName && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.register.form.email.label}
            </label>
            <input
              type="email"
              {...register("email", { 
                required: account.errors.required,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: account.errors.invalidEmail
                }
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.register.form.email.placeholder}
            />
            {errors.email && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.register.form.password.label}
            </label>
            <input
              type="password"
              {...register("password", { 
                required: account.errors.required,
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự"
                }
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.register.form.password.placeholder}
            />
            {errors.password && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {account.register.form.confirmPassword.label}
            </label>
            <input
              type="password"
              {...register("confirmPassword", { 
                required: account.errors.required,
                validate: (value) => 
                  value === password || account.errors.passwordMismatch
              })}
              className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder={account.register.form.confirmPassword.placeholder}
            />
            {errors.confirmPassword && (
              <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* CAPTCHA */}
          <div className="flex justify-center py-2">
            <MathCaptcha
              value={captchaValue}
              onChange={setCaptchaValue}
              onValidation={handleCaptchaValidation}
              error={errors.root?.message}
            />
          </div>

          {/* Terms of Service Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              {...register("tosAccepted", { 
                required: account.errors.required 
              })}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
            />
                        <label className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {account.register.form.tosCheckbox}{" "}
              <Link 
                href="/terms-of-service" 
                className="text-primary hover:underline"
                target="_blank"
              >
                {account.register.form.tosLink}
              </Link>
              {account.register.form.linkSeparator}
              <Link 
                href="/privacy-policy" 
                className="text-primary hover:underline"
                target="_blank"
              >
                {account.register.form.privacyLink}
              </Link>
            </label>
          </div>
          {errors.tosAccepted && (
            <p className="text-xs sm:text-sm text-red-500">{errors.tosAccepted.message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !captchaValid}
            className="w-full h-11 sm:h-12 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base mt-6"
          >
            {isSubmitting ? account.register.form.loading : account.register.form.submitButton}
          </button>

          {/* Error Message */}
          {errors.root && (
            <p className="text-xs sm:text-sm text-red-500 text-center">{errors.root.message}</p>
          )}
        </form>

        {/* Login Link */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-400">
            {account.register.form.signupLink.text}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {account.register.form.signupLink.link}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 