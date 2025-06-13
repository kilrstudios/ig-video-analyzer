-- Fix user creation issues
-- Add missing RLS policy for user profile insertion

-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Improve the trigger function with better error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, credits_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    10  -- Start with 10 free credits
  );
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

-- Manual function to create missing profiles
CREATE OR REPLACE FUNCTION create_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Find users without profiles
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data->>'full_name' as full_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO user_profiles (id, email, full_name, credits_balance)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.full_name, user_record.email),
      10
    )
    ON CONFLICT (id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create any missing profiles
SELECT create_missing_user_profiles(); 