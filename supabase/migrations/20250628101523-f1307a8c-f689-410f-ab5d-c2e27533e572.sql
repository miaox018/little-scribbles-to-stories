
-- Add missing RLS policies for user_roles table to allow proper functionality

-- Allow users to insert their own roles (needed for admin assignment)
CREATE POLICY "Allow admin assignment" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to insert roles for any user
CREATE POLICY "Admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

-- Allow updates to roles (for admin management)
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Allow deletion of roles (for admin management)
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));
