-- Deshabilitar RLS temporalmente
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update accessible documents" ON documents;
DROP POLICY IF EXISTS "Users can view accessible documents" ON documents;
DROP POLICY IF EXISTS "documents_all_operations" ON documents;
DROP POLICY IF EXISTS "Document owners can delete shares" ON shared_documents;
DROP POLICY IF EXISTS "Document owners can share" ON shared_documents;
DROP POLICY IF EXISTS "Document owners can update shares" ON shared_documents;
DROP POLICY IF EXISTS "Users can view shared documents" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_all_operations" ON shared_documents;

-- Crear políticas muy simples y básicas
CREATE POLICY "simple_documents_policy" ON documents
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_shared_policy" ON shared_documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Habilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Verificar que solo tenemos las políticas simples
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('documents', 'shared_documents');
