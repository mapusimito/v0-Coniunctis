-- Verificar si hay documentos en la base de datos
SELECT 
  id,
  title,
  user_id,
  created_at,
  updated_at
FROM documents 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar usuarios activos
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar políticas activas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('documents', 'shared_documents')
ORDER BY tablename, policyname;

-- Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('documents', 'shared_documents');
