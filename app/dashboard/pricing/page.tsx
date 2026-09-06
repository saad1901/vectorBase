'use client'

import { useState } from 'react'
import { Check, CreditCard, LockKeyhole, Sparkles, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_replace_me'

type RazorpayInstance = { open: () => void }
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

type Plan = {
  id: string
  name: string
  tokens: string
  amount: string
  amountValue: number
  description: string
  featured?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: '10M',
    amount: '₹249',
    amountValue: 249,
    description: 'A light start for prototypes and small support teams.',
    features: ['10 million tokens', 'Knowledge base RAG', 'Widget and API access', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    tokens: '25M',
    amount: '₹449',
    amountValue: 449,
    description: 'More room for a growing customer-facing assistant.',
    featured: true,
    features: ['25 million tokens', 'Everything in Starter', 'Priority processing', 'Usage insights'],
  },
  {
    id: 'scale',
    name: 'Scale',
    tokens: '50M',
    amount: '₹799',
    amountValue: 799,
    description: 'A larger reserve for high-volume knowledge workflows.',
    features: ['50 million tokens', 'Everything in Growth', 'Dedicated support queue', 'Flexible API usage'],
  },
]

const TOKEN_ADD_ON: Plan = {
  id: 'token-addon',
  name: 'Token Add-on',
  tokens: '1M',
  amount: '₹29 / 1M',
  amountValue: 29,
  description: 'Add as many extra 1M-token units as your workspace needs.',
  features: ['1M tokens per unit', 'Buy repeatedly with any plan', 'One-time purchase per unit'],
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [checkoutState, setCheckoutState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentReference, setPaymentReference] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  function openCheckout(plan: Plan) {
    setSelectedPlan(plan)
    setCheckoutState('idle')
    setPaymentReference('')
    setCheckoutError('')
  }

  function closeCheckout() {
    if (checkoutState === 'processing') return
    setSelectedPlan(null)
  }

  async function startRazorpayCheckout() {
    if (!selectedPlan) return
    setCheckoutState('processing')
    setCheckoutError('')

    try {
      const razorpayScript = 'https://checkout.razorpay.com/v1/checkout.js'
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = razorpayScript
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
          document.body.appendChild(script)
        })
      }

      const Razorpay = window.Razorpay as RazorpayConstructor | undefined
      if (!Razorpay) throw new Error('Razorpay Checkout is unavailable.')

      const checkout = new Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: selectedPlan.amountValue * 100,
        currency: 'INR',
        name: 'vectorbase',
        description: `${selectedPlan.tokens} token top-up`,
        theme: { color: '#2563eb' },
        handler: (response: { razorpay_payment_id?: string }) => {
          setPaymentReference(response.razorpay_payment_id || '')
          setCheckoutState('success')
        },
        modal: {
          ondismiss: () => setCheckoutState('idle'),
        },
      })
      checkout.open()
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Could not start Razorpay Checkout.')
      setCheckoutState('error')
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Token plans</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add token capacity to your workspace and keep your knowledge assistant running smoothly.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5 text-primary" /> Razorpay Checkout
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
              plan.featured ? 'border-primary ring-1 ring-primary/20' : 'border-border'
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                <Sparkles className="size-3" /> Most popular
              </span>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">{plan.tokens}</p>
                <p className="mt-1 text-xs text-muted-foreground">tokens per top-up</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Zap className="size-5" />
              </span>
            </div>
            <p className="mt-5 min-h-10 text-sm leading-5 text-muted-foreground">{plan.description}</p>
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-2xl font-semibold">{plan.amount}</p>
              <p className="mt-1 text-xs text-muted-foreground">One-time token purchase</p>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-7 h-10 w-full gap-2 rounded-xl"
              variant={plan.featured ? 'default' : 'outline'}
              onClick={() => openCheckout(plan)}
            >
              <CreditCard className="size-4" /> Choose {plan.name}
            </Button>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Flexible top-up</p>
          <h2 className="mt-2 text-lg font-semibold">Add tokens as you go</h2>
          <p className="mt-1 text-sm text-muted-foreground">Purchase additional capacity in 1M-token units at {TOKEN_ADD_ON.amount}.</p>
        </div>
        <Button className="h-10 gap-2 rounded-xl sm:shrink-0" variant="outline" onClick={() => openCheckout(TOKEN_ADD_ON)}>
          <CreditCard className="size-4" /> Add 1M tokens
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Billing integration</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Payments are currently in demo mode. The checkout surface is ready for Razorpay order creation and signature verification when the production keys and backend endpoint are available.
            </p>
          </div>
        </div>
      </section>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Razorpay checkout</p>
                <h2 id="checkout-title" className="mt-2 text-xl font-semibold">{checkoutState === 'success' ? 'Payment authorized' : `Buy ${selectedPlan.tokens} tokens`}</h2>
              </div>
              <button type="button" aria-label="Close checkout" onClick={closeCheckout} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground" disabled={checkoutState === 'processing'}>
                <X className="size-4" />
              </button>
            </div>

            {checkoutState === 'success' ? (
              <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                Razorpay returned a successful payment for {selectedPlan.amount}.
                {paymentReference && <span className="mt-2 block break-all font-mono text-xs">Payment ID: {paymentReference}</span>}
                <span className="mt-2 block text-xs">Token crediting will be enabled after the server-side signature verification endpoint is connected.</span>
              </div>
            ) : checkoutState === 'error' ? (
              <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                {checkoutError}
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{selectedPlan.name} plan</span>
                    <span className="font-semibold">{selectedPlan.amount}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedPlan.tokens} tokens</p>
                </div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Using Razorpay Checkout with a dummy key. Replace <code className="rounded bg-muted px-1">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> with your Razorpay public key before launch.
                </p>
                <Button type="button" className="mt-6 h-10 w-full rounded-xl" onClick={startRazorpayCheckout} disabled={checkoutState === 'processing'}>
                  {checkoutState === 'processing' ? 'Opening Razorpay…' : `Pay ${selectedPlan.amount}`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
