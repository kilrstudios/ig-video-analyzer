import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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

export async function POST(request) {
  try {
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