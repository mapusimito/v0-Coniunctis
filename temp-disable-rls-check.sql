-- Temporalmente deshabilitar RLS para verificar datos
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents DISABLE ROW LEVEL SECURITY;

-- Verificar documentos existentes
SELECT 
  id,
  title,
  user_id,
  created_at,
  word_count
FROM documents 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar shared_documents
SELECT 
  id,
  document_id,
  shared_with_user_id,
  permission,
  created_at
FROM shared_documents 
ORDER BY created_at DESC 
LIMIT 10;
