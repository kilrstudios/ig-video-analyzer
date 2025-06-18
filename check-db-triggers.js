import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ndegjkqkerrltuemgydk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgwNTQ1NiwiZXhwIjoyMDY1MzgxNDU2fQ.k2h1qbpNtkmBDBNoSN2u1nH71j5DBO-'

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseConfiguration() {
  console.log('🔍 Checking database configuration...')
  
  try {
    // 1. Check if user_profiles table exists and its structure
    console.log('\n1️⃣ Checking user_profiles table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ user_profiles table error:', tableError)
    } else {
      console.log('✅ user_profiles table exists')
    }
    
    // 2. Check current user profiles
    console.log('\n2️⃣ Checking existing user profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, credits_balance, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
    } else {
      console.log('📊 Recent user profiles:')
      profiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.credits_balance} credits) [${profile.created_at}]`)
      })
    }
    
    // 3. Check credit_transactions table
    console.log('\n3️⃣ Checking credit_transactions table...')
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('user_id, transaction_type, credits_amount, description, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (transError) {
      console.error('❌ Error fetching transactions:', transError)
    } else {
      console.log('💳 Recent transactions:')
      transactions.forEach(trans => {
        console.log(`  - ${trans.transaction_type}: ${trans.credits_amount} (${trans.description}) [${trans.created_at}]`)
      })
    }
    
    // 4. Check trigger function exists
    console.log('\n4️⃣ Checking trigger function...')
    const { data: functions, error: funcError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_name = 'create_user_profile'
          AND routine_schema = 'public'
        `
      })
      .catch(() => null)
    
    if (functions) {
      console.log('✅ create_user_profile function exists')
    } else {
      console.log('⚠️ Cannot verify function existence (RPC may be disabled)')
    }
    
    // 5. Check trigger exists on auth.users
    console.log('\n5️⃣ Checking database triggers...')
    const { data: triggers, error: trigError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE trigger_name = 'create_user_profile_trigger'
        `
      })
      .catch(() => null)
    
    if (triggers && triggers.length > 0) {
      console.log('✅ create_user_profile_trigger exists')
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`)
      })
    } else {
      console.log('⚠️ Cannot verify trigger existence (RPC may be disabled)')
    }
    
    // 6. Test manual user profile creation
    console.log('\n6️⃣ Testing manual profile creation...')
    const testUserId = `test-${Date.now()}`
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        credits_balance: 10
      })
      .select()
      .single()
    
    if (testError) {
      console.error('❌ Manual profile creation failed:', testError)
    } else {
      console.log('✅ Manual profile creation works:', testProfile)
      
      // Clean up test profile
      await supabase.from('user_profiles').delete().eq('id', testUserId)
      console.log('🧹 Test profile cleaned up')
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', error)
  }
}

async function testAuthUserCreation() {
  console.log('\n\n🧪 Testing auth user creation...')
  
  const testEmail = `test-auth-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  try {
    // Create auth user using service role
    console.log('📧 Creating auth user:', testEmail)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        full_name: 'Test Auth User'
      },
      email_confirm: true // Auto-confirm for testing
    })
    
    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check if profile was auto-created
    const { data: autoProfile, error: autoError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()
    
    if (autoError) {
      console.error('❌ Error checking auto-created profile:', autoError)
    } else if (autoProfile) {
      console.log('✅ Profile auto-created by trigger:', autoProfile)
    } else {
      console.log('⚠️ No profile auto-created - trigger may not be working')
    }
    
    // Check for welcome transaction
    const { data: welcomeTrans, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('transaction_type', 'bonus')
    
    if (transError) {
      console.error('❌ Error checking welcome transaction:', transError)
    } else if (welcomeTrans.length > 0) {
      console.log('✅ Welcome bonus created:', welcomeTrans[0])
    } else {
      console.log('⚠️ No welcome bonus found')
    }
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.log('🧹 Test auth user cleaned up')
    
  } catch (error) {
    console.error('💥 Auth test failed:', error)
  }
}

// Run all checks
checkDatabaseConfiguration()
  .then(() => testAuthUserCreation())
  .then(() => console.log('\n✅ All checks completed'))
  .catch(error => console.error('\n💥 Checks failed:', error)) 