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
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}

export async function POST(request) {
  try {
    // Initialize services at runtime only
    const stripe = getStripeClient()
    const supabase = getSupabaseClient()
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    // Check if services are available
    if (!stripe) {
      console.error('Stripe not initialized - missing STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      )
    }

    if (!supabase) {
      console.error('Supabase not available - missing environment variables')
      return NextResponse.json(
        { error: 'Database service not available' },
        { status: 503 }
      )
    }

    if (!endpointSecret) {
      console.error('Webhook endpoint secret not configured')
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
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
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
        
        if (!userId || !tokens) {
          console.error('Missing metadata in webhook:', session.metadata)
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        try {
          // Add credits to user's account using the existing function
          const { data, error } = await supabase.rpc('add_credits', {
            user_id: userId,
            credits_to_add: tokens,
            transaction_description: `Token purchase - ${packType} (${tokens} tokens)`
          })

          if (error) {
            console.error('Failed to add credits:', error)
            return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
          }

          console.log(`✅ Successfully added ${tokens} tokens to user ${userId}`)
          
        } catch (supabaseError) {
          console.error('Supabase error in webhook:', supabaseError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
        break

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object)
        // Handle failed payment - you could notify the user or log this
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 