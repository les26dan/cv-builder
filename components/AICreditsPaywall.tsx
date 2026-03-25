/**
 * ===================================================================
 * AI CREDITS PAYWALL COMPONENT
 * ===================================================================
 * 
 * MISSION CRITICAL: This component implements the core monetization 
 * paywall for OkBuddy's AI features based on product specification.
 * 
 * Features:
 * - Credit Packages tab ONLY (no subscription)
 * - Automatic market detection (Vietnam/International)
 * - Vietnam pricing: VND with MoMo, Vietcombank
 * - International pricing: USD with Cards, PayPal
 * - Manual payment processing initially
 * - Real-time timer promotions
 * ===================================================================
 */

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XIcon, CreditCardIcon, SparklesIcon, ClockIcon, CheckIcon } from 'lucide-react'

interface AICreditsPaywallProps {
  isOpen: boolean
  onClose: () => void
  currentCredits?: number
  userId?: string
  reason?: 'no_credits' | 'low_credits' | 'guest_user'
}

interface CreditPackage {
  id: string
  credits: number
  priceUSD: number
  priceVND: number
  originalPriceUSD?: number
  originalPriceVND?: number
  popular?: boolean
  promotion?: string
  description: string
  bonusText?: string
}

interface GeolocationData {
  isVietnam: boolean
  currency: 'USD' | 'VND'
  paymentMethods: string[]
}

export default function AICreditsPaywall({
  isOpen,
  onClose,
  currentCredits = 0,
  userId,
  reason = 'no_credits'
}: AICreditsPaywallProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [geolocation, setGeolocation] = useState<GeolocationData>({
    isVietnam: false,
    currency: 'USD',
    paymentMethods: ['card']
  })
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60) // 24 hours for promotion

  // Credit packages with promotional pricing
  const creditPackages: CreditPackage[] = [
    {
      id: 'starter',
      credits: 10,
      priceUSD: 9.99,
      priceVND: 249000,
      description: 'Perfect for occasional AI assistance',
      bonusText: 'Most popular for trying out'
    },
    {
      id: 'popular',
      credits: 25,
      priceUSD: 14.99,
      priceVND: 369000,
      originalPriceUSD: 24.99,
      originalPriceVND: 619000,
      popular: true,
      promotion: 'Limited Time: 40% OFF',
      description: 'Best value for regular users',
      bonusText: 'Save $10 with this bundle'
    },
    {
      id: 'power',
      credits: 50,
      priceUSD: 34.99,
      priceVND: 869000,
      description: 'For power users and professionals',
      bonusText: 'Maximum value per credit'
    }
  ]

  // Detect geolocation and set payment methods
  useEffect(() => {
    const detectGeolocation = async () => {
      try {
        // Simple IP-based detection (you can enhance this)
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        
        const isVietnam = data.country_code === 'VN'
        
        setGeolocation({
          isVietnam,
          currency: isVietnam ? 'VND' : 'USD',
          paymentMethods: isVietnam 
            ? ['momo', 'vietcombank', 'card'] 
            : ['card', 'paypal']
        })
        
        // Set default payment method
        setSelectedPaymentMethod(isVietnam ? 'momo' : 'card')
        
      } catch (error) {
        console.error('Geolocation detection failed:', error)
        // Default to international
        setGeolocation({
          isVietnam: false,
          currency: 'USD',
          paymentMethods: ['card', 'paypal']
        })
        setSelectedPaymentMethod('card')
      }
    }

    if (isOpen) {
      detectGeolocation()
      // Set default package
      setSelectedPackage('popular')
    }
  }, [isOpen])

  // Countdown timer for promotion
  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatPrice = (priceUSD: number, priceVND: number): string => {
    if (geolocation.currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(priceVND)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(priceUSD)
  }

  const getReasonTitle = (): string => {
    switch (reason) {
      case 'guest_user':
        return 'Login Required for AI Features'
      case 'low_credits':
        return 'Running Low on AI Credits'
      case 'no_credits':
      default:
        return 'Out of AI Credits'
    }
  }

  const getReasonDescription = (): string => {
    switch (reason) {
      case 'guest_user':
        return 'Create an account to unlock AI-powered features and get 5 free credits to start.'
      case 'low_credits':
        return `You have ${currentCredits} credits remaining. Top up now to continue using AI features.`
      case 'no_credits':
      default:
        return 'You\'ve used all your AI credits. Purchase more to continue improving your CV with AI assistance.'
    }
  }

  const handlePayment = async () => {
    if (!selectedPackage || !selectedPaymentMethod) return

    setIsProcessingPayment(true)
    
    try {
      const selectedPkg = creditPackages.find(pkg => pkg.id === selectedPackage)
      if (!selectedPkg) throw new Error('Package not found')

      // Simulate payment processing
      console.log('Processing payment:', {
        package: selectedPackage,
        paymentMethod: selectedPaymentMethod,
        amount: geolocation.currency === 'VND' ? selectedPkg.priceVND : selectedPkg.priceUSD,
        currency: geolocation.currency,
        userId
      })

      // For now, show manual payment instructions
      if (geolocation.isVietnam && (selectedPaymentMethod === 'momo' || selectedPaymentMethod === 'vietcombank')) {
        showVietnamesePaymentInstructions(selectedPkg)
      } else {
        showInternationalPaymentInstructions(selectedPkg)
      }

    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment processing failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const showVietnamesePaymentInstructions = (pkg: CreditPackage) => {
    const amount = pkg.priceVND
    const message = selectedPaymentMethod === 'momo' 
      ? `Chuyển khoản MoMo:\nSố điện thoại: 0123456789\nSố tiền: ${amount.toLocaleString()} VND\nNội dung: AI Credits ${pkg.credits} - ${userId}`
      : `Chuyển khoản Vietcombank:\nSố tài khoản: 1234567890\nTên: CONG TY OKBUDDY\nSố tiền: ${amount.toLocaleString()} VND\nNội dung: AI Credits ${pkg.credits} - ${userId}`
    
    alert(message + '\n\nSau khi chuyển khoản, credits sẽ được cộng tự động trong 15 phút.')
  }

  const showInternationalPaymentInstructions = (pkg: CreditPackage) => {
    const amount = pkg.priceUSD
    alert(`Manual Payment Required:\nAmount: $${amount}\nEmail: payment@okbuddy.com\nSubject: AI Credits ${pkg.credits} - ${userId}\n\nCredits will be added within 24 hours after payment verification.`)
  }

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'momo': return 'MoMo'
      case 'vietcombank': return 'Vietcombank'
      case 'card': return 'Credit/Debit Card'
      case 'paypal': return 'PayPal'
      default: return method
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getReasonTitle()}</h2>
              <p className="text-gray-600 text-sm">{getReasonDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Promotion Timer */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 m-6 rounded-lg">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-800">
              Limited Time Promotion ends in: {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6">Choose Your AI Credits Package</h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                } ${pkg.popular ? 'ring-2 ring-orange-400 ring-opacity-50' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {pkg.promotion && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {pkg.promotion}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {pkg.credits} Credits
                  </h4>
                  
                  <div className="mb-3">
                    {pkg.originalPriceUSD && pkg.originalPriceVND && (
                      <span className="text-gray-400 line-through text-lg mr-2">
                        {formatPrice(pkg.originalPriceUSD, pkg.originalPriceVND)}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(pkg.priceUSD, pkg.priceVND)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                  
                  {pkg.bonusText && (
                    <p className="text-green-600 text-sm font-medium">{pkg.bonusText}</p>
                  )}
                  
                  <div className="mt-4 text-gray-500 text-xs">
                    ${(geolocation.currency === 'VND' ? pkg.priceVND / 25000 : pkg.priceUSD) / pkg.credits} per credit
                  </div>
                </div>

                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 right-4">
                    <CheckIcon className="w-6 h-6 text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Payment Method</h4>
            <div className="grid md:grid-cols-3 gap-3">
              {geolocation.paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedPaymentMethod === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCardIcon className="w-5 h-5" />
                  {getPaymentMethodLabel(method)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handlePayment}
              disabled={!selectedPackage || !selectedPaymentMethod || isProcessingPayment}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isProcessingPayment ? 'Processing...' : 'Purchase Credits'}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>🔒 Secure payment processing • Money-back guarantee • 24/7 support</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
