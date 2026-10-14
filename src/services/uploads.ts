import { http } from './http';
import type { UploadedMedia } from '@/types/api';

/**
 * Arquivo local no formato que o FormData do React Native entende: não é um
 * Blob nem um File do navegador, é o caminho (`uri`) que o ImagePicker
 * devolve — a plataforma lê o arquivo na hora de enviar.
 */
export interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * POST /uploads em multipart/form-data. Devolve a mídia criada; o `id` dela é
 * o `mediaId` que a avaliação referencia (não a URL).
 *
 */
export async function uploadImage(file: LocalFile, folder = 'avaliacoes'): Promise<UploadedMedia> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  form.append('folder', folder);

  const { data } = await http.post<UploadedMedia>('/uploads', form, {
    // Foto de celular é pesada; o timeout padrão de 15 s derrubaria envios legítimos.
    timeout: 60000,
  });
  return data;
}

/** Nome e tipo a partir da uri do ImagePicker (".../IMG_0042.jpg"). */
export function fileFromUri(uri: string, mimeType?: string | null): LocalFile {
  const name = uri.split('/').pop() || `foto-${Date.now()}.jpg`;
  const extension = name.split('.').pop()?.toLowerCase();
  const guessed = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  return { uri, name, type: mimeType ?? guessed };
}
