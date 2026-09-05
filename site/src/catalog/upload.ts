import { supabase } from '../lib/supabase'

/**
 * Envio da foto do cardápio para o Storage do Supabase.
 *
 * Antes, pôr foto num item era trabalho de desenvolvedor: publicar o arquivo
 * na pasta do site e colar o caminho no campo. A loja escolhe o arquivo do
 * computador ou do celular, o arquivo sobe para o bucket `cardapio` e o que
 * fica gravado no cadastro é a URL pública que o site já sabe exibir.
 *
 * O caminho local antigo ("/imagem/pote-500ml.webp") continua valendo: o campo
 * guarda uma string e tanto faz se ela aponta para a pasta do site ou para o
 * bucket.
 */

const BUCKET = 'cardapio'

/** Igual ao teto do bucket na migration 0006. */
const MAX_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS).join(',')

/** Pasta do bucket, para a foto de produto não se misturar com a do complemento. */
export type ImageFolder = 'produtos' | 'tamanhos' | 'complementos'

const uniqueName = (extension: string): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${extension}`

/**
 * Sobe o arquivo e devolve a URL pública para gravar no cadastro.
 *
 * Recusa cedo o que o bucket recusaria de qualquer jeito, para a loja ler um
 * aviso claro em vez de um erro de servidor.
 */
export const uploadCatalogImage = async (file: File, folder: ImageFolder): Promise<string> => {
  const extension = EXTENSIONS[file.type]
  if (!extension) {
    throw new Error('Formato não aceito. Envie uma imagem JPG, PNG, WebP, AVIF ou GIF.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Imagem acima de 5 MB. Reduza o tamanho e envie de novo.')
  }

  const path = `${folder}/${uniqueName(extension)}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
