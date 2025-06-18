import { createClient } from '@supabase/supabase-js'

// Use production Supabase URL and key
const supabaseUrl = 'https://ndegjkqkerrltuemgydk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgwNjkzMzQsImV4cCI6MjAzMzY0NTMzNH0.6vPIxo4SWVMOeQ85I4LM6AX-DXwWQ0ovfHYeNNzgCqM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserSignup() {
  console.log('🧪 Testing user signup and profile creation...')
  
  // Test email
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testFullName = 'Test User'
  
  console.log('📧 Test user:', testEmail)
  
  try {
    // Step 1: Sign up user
    console.log('\n1️⃣ Signing up user...')
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName,
        },
        emailRedirectTo: 'https://ig-video-analyzer-production-8760.up.railway.app'
      }
    })
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError)
      return
    }
    
    console.log('✅ Signup successful:', {
      userId: signupData.user?.id,
      email: signupData.user?.email,
      confirmed: signupData.user?.email_confirmed_at !== null
    })
    
    const userId = signupData.user?.id
    
    if (!userId) {
      console.error('❌ No user ID returned from signup')
      return
    }
    
    // Step 2: Wait a moment for trigger to execute
    console.log('\n2️⃣ Waiting for database trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Check if profile was created by trigger
    console.log('\n3️⃣ Checking user_profiles table...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (profileError) {
      console.error('❌ Error checking profile:', profileError)
    } else if (profileData) {
      console.log('✅ Profile found via trigger:', profileData)
    } else {
      console.log('⚠️ No profile found, trigger may not be working')
    }
    
    // Step 4: Check credit transactions
    console.log('\n4️⃣ Checking credit_transactions table...')
    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
    
    if (transactionError) {
      console.error('❌ Error checking transactions:', transactionError)
    } else {
      console.log('📊 Credit transactions:', transactionData)
    }
    
    // Step 5: Check auth.users table
    console.log('\n5️⃣ Checking auth.users table...')
    // Note: We can't directly query auth.users from client, but we can check the user object
    console.log('👤 Auth user object:', {
      id: signupData.user.id,
      email: signupData.user.email,
      user_metadata: signupData.user.user_metadata,
      raw_user_meta_data: signupData.user.raw_user_meta_data
    })
    
    // Step 6: Test manual profile creation (if trigger failed)
    if (!profileData) {
      console.log('\n6️⃣ Testing manual profile creation...')
      const { data: manualProfile, error: manualError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: testEmail,
          full_name: testFullName,
          credits_balance: 10
        })
        .select()
        .single()
      
      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError)
      } else {
        console.log('✅ Manual profile created:', manualProfile)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

async function checkDatabaseTriggers() {
  console.log('\n🔍 Checking database triggers...')
  
  // Check if trigger function exists
  const { data: functions, error: funcError } = await supabase
    .rpc('get_trigger_functions')
    .catch(() => ({ data: null, error: 'RPC not available' }))
    
  console.log('Database functions check:', { functions, funcError })
}

// Run the test
testUserSignup()
  .then(() => console.log('\n✅ Test completed'))
  .catch(error => console.error('\n💥 Test failed:', error)) 