import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
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
          
          // Optionally, you can send a confirmation email here
          
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