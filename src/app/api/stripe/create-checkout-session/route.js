import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Token pack configurations based on user's pricing
const TOKEN_PACKS = {
  pack_10: {
    tokens: 10,
    price: 250, // $2.50 in cents
    name: '10 Tokens',
    description: 'Perfect for getting started'
  },
  pack_50: {
    tokens: 50,
    price: 1150, // $11.50 in cents  
    name: '50 Tokens',
    description: 'Great value with 8% savings'
  },
  pack_100: {
    tokens: 100,
    price: 2200, // $22.00 in cents
    name: '100 Tokens', 
    description: 'Best value with 12% savings'
  },
  pack_500: {
    tokens: 500,
    price: 10000, // $100.00 in cents
    name: '500 Tokens',
    description: 'Maximum savings with 20% off'
  }
}

// Runtime initialization functions
function getStripeClient() {
  if (process.env.STRIPE_SECRET_KEY) {
    return new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return null
}

function getSupabaseClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return null
}

export async function POST(request) {
  try {
    // Initialize services at runtime
    const stripe = getStripeClient()
    const supabase = getSupabaseClient()

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

    const { packType, userId } = await request.json()

    if (!packType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const pack = TOKEN_PACKS[packType]
    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid pack type' },
        { status: 400 }
      )
    }

    // Verify user exists in our database
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.name,
              description: pack.description,
              images: [], // You can add product images here
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?canceled=true`,
      metadata: {
        userId: userId,
        packType: packType,
        tokens: pack.tokens.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 