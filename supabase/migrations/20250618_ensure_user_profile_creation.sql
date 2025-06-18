-- Comprehensive user profile creation fix
-- This migration ensures reliable user profile creation with 10 credits

-- First, let's make sure the tables exist with correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  credits_balance INTEGER DEFAULT 10 NOT NULL,
  total_credits_purchased INTEGER DEFAULT 0 NOT NULL,
  total_credits_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund')),
  credits_amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on both tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "System can manage transactions" ON credit_transactions;

-- User profile policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Credit transaction policies
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" ON credit_transactions
  FOR ALL TO authenticated, anon USING (true);

-- Create or replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Check if profile already exists to avoid conflicts
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Insert the user profile
    INSERT INTO user_profiles (id, email, full_name, credits_balance)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, 'unknown@example.com'),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.user_metadata->>'full_name', 
        split_part(NEW.email, '@', 1),
        'User'
      ),
      10  -- Always start with 10 free credits
    );
    
    -- Add welcome bonus transaction
    INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
    VALUES (NEW.id, 'bonus', 10, 'Welcome bonus - 10 free credits');
    
    -- Log success
    RAISE LOG 'User profile created successfully for user: % (email: %)', NEW.id, NEW.email;
  ELSE
    -- Log that profile already exists
    RAISE LOG 'User profile already exists for user: % (email: %)', NEW.id, NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error with more detail but don't fail the auth process
    RAISE LOG 'Error creating user profile for user % (email: %): % - %', 
      NEW.id, NEW.email, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to manually create profiles for existing users who might be missing them
CREATE OR REPLACE FUNCTION ensure_user_profiles_exist()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Find auth users without profiles
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.user_metadata
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
      AND au.email IS NOT NULL
  LOOP
    BEGIN
      -- Create missing profile
      INSERT INTO user_profiles (id, email, full_name, credits_balance)
      VALUES (
        user_record.id,
        user_record.email,
        COALESCE(
          user_record.raw_user_meta_data->>'full_name',
          user_record.user_metadata->>'full_name',
          split_part(user_record.email, '@', 1),
          'User'
        ),
        10
      );
      
      -- Create welcome bonus transaction
      INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
      VALUES (user_record.id, 'bonus', 10, 'Welcome bonus - 10 free credits (retroactive)');
      
      created_count := created_count + 1;
      RAISE LOG 'Created missing profile for user: % (email: %)', user_record.id, user_record.email;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to create profile for user % (email: %): %', 
          user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix credit amounts (ensure all users have at least 10 credits if they haven't used any)
CREATE OR REPLACE FUNCTION fix_user_credit_balances()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Find users with incorrect credit amounts who haven't used credits yet
  FOR user_record IN 
    SELECT id, email, credits_balance
    FROM user_profiles 
    WHERE credits_balance != 10 
    AND total_credits_used = 0
    AND total_credits_purchased = 0
  LOOP
    -- Update to correct amount (10 credits)
    UPDATE user_profiles 
    SET credits_balance = 10,
        updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Update or create welcome bonus transaction
    UPDATE credit_transactions 
    SET credits_amount = 10, 
        description = 'Welcome bonus - 10 free credits (corrected)'
    WHERE user_id = user_record.id 
    AND transaction_type = 'bonus' 
    AND description LIKE '%Welcome bonus%';
    
    -- If no welcome transaction exists, create one
    IF NOT FOUND THEN
      INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
      VALUES (user_record.id, 'bonus', 10, 'Welcome bonus - 10 free credits (corrected)');
    END IF;
    
    fixed_count := fixed_count + 1;
    RAISE LOG 'Fixed credit balance for user: % (email: %) from % to 10', 
      user_record.id, user_record.email, user_record.credits_balance;
  END LOOP;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the functions to fix any existing issues
SELECT ensure_user_profiles_exist() as profiles_created;
SELECT fix_user_credit_balances() as balances_fixed;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON user_profiles TO authenticated, anon;
GRANT ALL ON credit_transactions TO authenticated, anon; 