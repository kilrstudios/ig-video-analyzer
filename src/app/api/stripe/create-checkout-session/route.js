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
  // Enhanced environment variable detection with Railway fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndegjkqkerrltuemgydk.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA'
  
  console.log('🔍 Checkout Session Environment Debug:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('  Using URL:', supabaseUrl?.substring(0, 30) + '...')
  console.log('  Using Key length:', supabaseKey?.length)

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey)
      console.log('✅ Supabase client created successfully for checkout')
      return client
    } catch (error) {
      console.error('❌ Failed to create Supabase client for checkout:', error.message)
      return null
    }
  }
  return null
}

function getSupabaseServiceClient() {
  // Service role client for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndegjkqkerrltuemgydk.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔧 Service Role Key available:', !!serviceRoleKey)
  
  if (supabaseUrl && serviceRoleKey) {
    try {
      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      console.log('✅ Supabase service client created for admin operations')
      return client
    } catch (error) {
      console.error('❌ Failed to create Supabase service client:', error.message)
      return null
    }
  }
  console.log('❌ Missing service role key or URL for admin operations')
  return null
}

export async function POST(request) {
  try {
    // Initialize services at runtime
    const stripe = getStripeClient()
    const supabase = getSupabaseClient()

    console.log('🛒 Checkout session creation requested')
    console.log('  Stripe available:', !!stripe)
    console.log('  Supabase available:', !!supabase)

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

    const { packType, userId } = await request.json()

    console.log('📦 Processing checkout request:', { packType, userId })

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

    console.log('💰 Selected pack:', pack)

    // Verify user exists in our database, create if missing
    console.log('👤 Verifying user exists...')
    let { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Database error during user verification:', userError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!user) {
      console.log('🆕 User profile not found, attempting to create it...')
      
      // First, try running the database function to create missing profiles
      console.log('🔧 Running create_missing_user_profiles function...')
      try {
        const { data: functionResult, error: functionError } = await supabase.rpc('create_missing_user_profiles')
        if (functionError) {
          console.warn('⚠️ Database function failed:', functionError)
        } else {
          console.log('✅ Database function created profiles:', functionResult)
          
          // Try to fetch the user profile again after running the function
          const { data: newUser, error: refetchError } = await supabase
            .from('user_profiles')
            .select('id, email')
            .eq('id', userId)
            .maybeSingle()
            
          if (!refetchError && newUser) {
            console.log('✅ Profile found after running database function:', newUser)
            user = newUser
          }
        }
      } catch (funcErr) {
        console.warn('⚠️ Exception running database function:', funcErr)
      }
    }
    
    if (!user) {
      console.log('🆕 User profile still not found, creating with basic info...')
      
      // Since the user is logged in and we have their userId, create a basic profile
      // The email will be updated by triggers if available
      const profileData = {
        id: userId,
        email: 'unknown@example.com', // Placeholder, will be updated by triggers
        full_name: 'User',
        credits_balance: 10
      }

      console.log('🆕 Creating basic user profile:', profileData)

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select('id, email')
        .single()

      if (createError) {
        console.error('❌ Failed to create user profile:', createError)
        
        // If it's a conflict (profile created by trigger), try to fetch it
        if (createError.code === '23505') {
          console.log('🔄 Profile conflict detected, trying to fetch existing...')
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait for trigger
          
          const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, email')
            .eq('id', userId)
            .single()
            
          if (!fetchError && existingProfile) {
            user = existingProfile
            console.log('✅ Found existing profile after conflict:', user)
          } else {
            return NextResponse.json(
              { error: 'User profile creation failed' },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }
      } else {
        user = newProfile
        console.log('✅ Created new user profile:', user)

        // Try to create welcome bonus transaction
        try {
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'bonus',
              credits_amount: 10,
              description: 'Welcome bonus - 10 free credits'
            })
          console.log('🎁 Welcome bonus transaction created')
        } catch (transactionError) {
          console.warn('⚠️ Failed to create welcome transaction (non-critical):', transactionError)
        }
      }
    }

    console.log('✅ User verified:', { id: user.id, email: user.email })

    // Create Stripe checkout session
    console.log('🔄 Creating Stripe checkout session...')
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

    console.log('✅ Checkout session created:', session.id)

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('💥 Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 