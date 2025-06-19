import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Don't initialize anything at import time - do it all at runtime
let stripeClient = null
let supabaseClient = null

function getStripeClient() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeClient
}

function getSupabaseClient() {
  // Enhanced environment variable detection with Railway fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndegjkqkerrltuemgydk.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
  
  console.log('🔍 Environment Variable Debug:')
  console.log('  NODE_ENV:', process.env.NODE_ENV)
  console.log('  NEXT_PUBLIC_SUPABASE_URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('  Using URL:', supabaseUrl?.substring(0, 30) + '...')
  console.log('  Using Key length:', supabaseKey?.length)

  if (!supabaseClient && supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      console.log('✅ Supabase client created successfully')
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error.message)
    }
  }
  return supabaseClient
}

export async function POST(request) {
  try {
    // Initialize services at runtime only
    const stripe = getStripeClient()
    const supabase = getSupabaseClient()
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    console.log('🚀 Webhook POST handler called')
    console.log('  Stripe available:', !!stripe)
    console.log('  Supabase available:', !!supabase)
    console.log('  Webhook secret available:', !!endpointSecret)

    // Check if services are available
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      )
    }

    if (!supabase) {
      console.error('❌ Supabase not available - check environment variables')
      console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
      return NextResponse.json(
        { error: 'Database service not available' },
        { status: 503 }
      )
    }

    if (!endpointSecret) {
      console.error('❌ Webhook endpoint secret not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        
        // Extract metadata
        const userId = session.metadata.userId
        const packType = session.metadata.packType
        const tokens = parseInt(session.metadata.tokens)
        
        console.log('💳 Processing payment completion:', {
          userId,
          packType,
          tokens,
          sessionId: session.id
        })
        
        if (!userId || !tokens) {
          console.error('❌ Missing metadata in webhook:', session.metadata)
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        try {
          // Add credits to user's account using the existing function
          console.log('🔄 Calling add_credits function...')
          const { data, error } = await supabase.rpc('add_credits', {
            user_id: userId,
            credits_to_add: tokens,
            transaction_description: `Token purchase - ${packType} (${tokens} tokens)`
          })

          if (error) {
            console.error('❌ Failed to add credits:', error)
            return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
          }

          console.log(`✅ Successfully added ${tokens} tokens to user ${userId}`)
          console.log('💾 RPC result:', data)
          
        } catch (supabaseError) {
          console.error('❌ Supabase error in webhook:', supabaseError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        break

      case 'payment_intent.payment_failed':
        console.log('💸 Payment failed:', event.data.object.id)
        // Handle failed payment - you could notify the user or log this
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 