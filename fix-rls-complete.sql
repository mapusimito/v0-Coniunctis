-- Deshabilitar RLS temporalmente para limpiar todo
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;
DROP POLICY IF EXISTS "shared_documents_select_policy" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_insert_policy" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_update_policy" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_delete_policy" ON shared_documents;

-- Habilitar RLS nuevamente
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples y funcionales para documents
CREATE POLICY "documents_select" ON documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM shared_documents sd 
    WHERE sd.document_id = documents.id 
    AND sd.shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "documents_insert" ON documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update" ON documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM shared_documents sd 
    WHERE sd.document_id = documents.id 
    AND sd.shared_with_user_id = auth.uid() 
    AND sd.permission = 'edit'
  )
);

CREATE POLICY "documents_delete" ON documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Crear políticas para shared_documents
CREATE POLICY "shared_documents_select" ON shared_documents
FOR SELECT
TO authenticated
USING (
  shared_with_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = shared_documents.document_id 
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_insert" ON shared_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = document_id 
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_update" ON shared_documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = shared_documents.document_id 
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "shared_documents_delete" ON shared_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = shared_documents.document_id 
    AND d.user_id = auth.uid()
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('documents', 'shared_documents');
