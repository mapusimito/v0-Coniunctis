-- Create function to search user by email
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE(id uuid, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to find in profiles table
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM profiles p
  WHERE p.email = user_email;
  
  -- If not found in profiles, try auth.users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT au.id, au.email::text, au.raw_user_meta_data->>'full_name' as full_name
    FROM auth.users au
    WHERE au.email = user_email;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;
