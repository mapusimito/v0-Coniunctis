-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;
DROP POLICY IF EXISTS "Users can update shared documents with edit permission" ON documents;

-- Disable RLS temporarily to recreate policies
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies without recursion

-- Policy for viewing documents (own + shared)
CREATE POLICY "documents_select_policy" ON documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  id IN (
    SELECT document_id 
    FROM shared_documents 
    WHERE shared_with_user_id = auth.uid()
  )
);

-- Policy for inserting documents (only own)
CREATE POLICY "documents_insert_policy" ON documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy for updating documents (own + shared with edit permission)
CREATE POLICY "documents_update_policy" ON documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  id IN (
    SELECT document_id 
    FROM shared_documents 
    WHERE shared_with_user_id = auth.uid() 
    AND permission = 'edit'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  id IN (
    SELECT document_id 
    FROM shared_documents 
    WHERE shared_with_user_id = auth.uid() 
    AND permission = 'edit'
  )
);

-- Policy for deleting documents (only own)
CREATE POLICY "documents_delete_policy" ON documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Ensure shared_documents policies are correct
DROP POLICY IF EXISTS "Users can view own shares" ON shared_documents;
DROP POLICY IF EXISTS "Users can insert own shares" ON shared_documents;
DROP POLICY IF EXISTS "Users can update own shares" ON shared_documents;
DROP POLICY IF EXISTS "Users can delete own shares" ON shared_documents;

-- Shared documents policies
CREATE POLICY "shared_documents_select_policy" ON shared_documents
FOR SELECT
TO authenticated
USING (
  shared_with_user_id = auth.uid()
  OR
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_insert_policy" ON shared_documents
FOR INSERT
TO authenticated
WITH CHECK (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_update_policy" ON shared_documents
FOR UPDATE
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_delete_policy" ON shared_documents
FOR DELETE
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);
