-- Fix user profile creation to include email and ensure 10 credits
-- This migration ensures consistent user profile creation with 10 credits

-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Improve the trigger function to include email and set 10 credits consistently
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, credits_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    10  -- Always start with 10 free credits
  );
  
  -- Add welcome bonus transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (NEW.id, 'bonus', 10, 'Welcome bonus - 10 free credits');
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to fix existing users who might have inconsistent credit amounts
CREATE OR REPLACE FUNCTION fix_existing_user_credits()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Find users with 100 credits (from old AuthContext logic) and reset to 10
  FOR user_record IN 
    SELECT id, email
    FROM user_profiles 
    WHERE credits_balance = 100 
    AND total_credits_purchased = 0 
    AND total_credits_used = 0
  LOOP
    -- Reset to 10 credits for users who haven't used any credits yet
    UPDATE user_profiles 
    SET credits_balance = 10
    WHERE id = user_record.id;
    
    -- Update any existing welcome bonus transactions
    UPDATE credit_transactions 
    SET credits_amount = 10, description = 'Welcome bonus - 10 free credits (corrected)'
    WHERE user_id = user_record.id 
    AND transaction_type = 'bonus' 
    AND credits_amount = 100;
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to fix any existing inconsistencies
SELECT fix_existing_user_credits(); 