-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;
DROP POLICY IF EXISTS "shared_documents_select" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_insert" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_update" ON shared_documents;
DROP POLICY IF EXISTS "shared_documents_delete" ON shared_documents;

-- Crear políticas muy simples para documents
CREATE POLICY "documents_all_operations" ON documents
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Crear políticas simples para shared_documents
CREATE POLICY "shared_documents_all_operations" ON shared_documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Habilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas se crearon
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('documents', 'shared_documents');
