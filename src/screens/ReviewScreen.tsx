/**
 * Formulário de avaliação: nota, título, comentário e fotos.
 *
 * A foto sobe SOZINHA, assim que é escolhida (POST /uploads -> mediaId), e a
 * avaliação leva só os ids. Assim um erro no upload não joga fora o texto, e
 * o envio final é instantâneo.
 *
 * Galeria negada (RF-40): o formulário CONTINUA funcionando, só sem foto, e a
 * tela diz isso com todas as letras — e como liberar, se a pessoa quiser.
 */
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateReview } from '@/hooks/useReviews';
import { fileFromUri, uploadImage } from '@/services/uploads';
import { StarRatingInput } from '@/components/Stars';
import { PressableScale } from '@/components/motion/PressableScale';
import { LoadingDots } from '@/components/motion/LoadingDots';
import { Button, Notice, TextField } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation';
import { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const MAX_PHOTOS = 3;
const COMMENT_MIN = 10;
const COMMENT_MAX = 2000;
const TITLE_MAX = 120;

type Photo =
  | { key: string; uri: string; status: 'uploading' }
  | { key: string; uri: string; status: 'done'; mediaId: string };

/** 'unknown' = ainda não perguntamos; 'blocked' = negado e o sistema não pergunta mais. */
type GalleryAccess = 'unknown' | 'granted' | 'denied' | 'blocked';

interface FormErrors {
  rating?: string;
  title?: string;
  comment?: string;
}

/** RF-38: tudo validado ANTES de ir para a rede. */
function validate(rating: number, title: string, comment: string): FormErrors {
  const errors: FormErrors = {};
  if (rating < 1 || rating > 5) errors.rating = 'Escolha uma nota de 1 a 5 estrelas.';
  if (title.trim().length > TITLE_MAX) errors.title = `O título pode ter até ${TITLE_MAX} caracteres.`;
  const commentLength = comment.trim().length;
  if (commentLength < COMMENT_MIN) errors.comment = `Escreva pelo menos ${COMMENT_MIN} caracteres sobre o produto.`;
  else if (commentLength > COMMENT_MAX) errors.comment = `O comentário pode ter até ${COMMENT_MAX} caracteres.`;
  return errors;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function ReviewScreen({ route, navigation }: Props) {
  const { productId, productName } = route.params;
  const theme = useTheme();
  const createReview = useCreateReview(productId);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryAccess>('unknown');
  const [triedSubmit, setTriedSubmit] = useState(false);

  const errors = validate(rating, title, comment);
  const hasErrors = Object.keys(errors).length > 0;
  const isUploading = photos.some((photo) => photo.status === 'uploading');

  // Só LÊ o estado (não abre diálogo): se a galeria já foi bloqueada antes,
  // o aviso aparece de cara, em vez de a pessoa descobrir ao tocar no "+".
  useEffect(() => {
    ImagePicker.getMediaLibraryPermissionsAsync()
      .then((permission) => {
        if (permission.granted) setGallery('granted');
        else if (!permission.canAskAgain) setGallery('blocked');
      })
      .catch(() => undefined);
  }, []);

  async function addPhoto() {
    setUploadError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setGallery(permission.canAskAgain ? 'denied' : 'blocked');
      return;
    }
    setGallery('granted');

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // 0.6 derruba uma foto de 4 MB para algumas centenas de KB, sem diferença
      // visível num card de avaliação — e o upload fica segundos mais rápido.
      quality: 0.6,
    });
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;

    const key = `${Date.now()}`;
    setPhotos((current) => [...current, { key, uri: asset.uri, status: 'uploading' }]);
    try {
      const media = await uploadImage(fileFromUri(asset.uri, asset.mimeType));
      setPhotos((current) =>
        current.map((photo) => (photo.key === key ? { key, uri: photo.uri, status: 'done', mediaId: media.id } : photo)),
      );
    } catch (error) {
      setPhotos((current) => current.filter((photo) => photo.key !== key));
      setUploadError(errorMessage(error, 'Não foi possível enviar a foto. O texto da avaliação continua salvo aqui.'));
    }
  }

  function removePhoto(key: string) {
    setPhotos((current) => current.filter((photo) => photo.key !== key));
  }

  function submit() {
    setTriedSubmit(true);
    if (hasErrors || isUploading) return;

    createReview.mutate(
      {
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        mediaIds: photos.flatMap((photo) => (photo.status === 'done' ? [photo.mediaId] : [])),
      },
      {
        // RF-41: a mutation invalida lista, can-review e produto; ao voltar,
        // o detalhe já está buscando a média nova — sem sair e entrar de novo.
        onSuccess: () => navigation.goBack(),
        // 403 (não comprou) e 409 (já avaliou): a mensagem vem pronta da API.
        onError: (error) => Alert.alert('Não foi possível publicar', errorMessage(error, 'Tente novamente.')),
      },
    );
  }

  const galleryUnavailable = gallery === 'denied' || gallery === 'blocked';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.product}>{productName}</Text>

        <Text style={styles.label}>Sua nota</Text>
        <StarRatingInput value={rating} onChange={setRating} />
        {triedSubmit && errors.rating && <Text style={styles.error}>{errors.rating}</Text>}

        <Text style={styles.label}>Título (opcional)</Text>
        <TextField value={title} onChangeText={setTitle} placeholder="Resuma em poucas palavras" maxLength={TITLE_MAX} />
        {triedSubmit && errors.title && <Text style={styles.error}>{errors.title}</Text>}

        <Text style={styles.label}>Comentário</Text>
        <TextField
          value={comment}
          onChangeText={setComment}
          placeholder="Como foi usar? Sensor, pegada, switches, acabamento…"
          multiline
          maxLength={COMMENT_MAX}
          style={[styles.input, styles.multiline]}
        />
        <Text style={styles.counter}>
          {comment.trim().length}/{COMMENT_MAX}
        </Text>
        {triedSubmit && errors.comment && <Text style={styles.error}>{errors.comment}</Text>}

        <Text style={styles.label}>
          Fotos ({photos.length}/{MAX_PHOTOS})
        </Text>

        {galleryUnavailable ? (
          <Notice
            tone="warning"
            title="Sem acesso às suas fotos"
            message="Você pode publicar a avaliação normalmente — ela só vai sem foto. Para anexar uma imagem, libere o acesso à galeria."
            actionLabel={gallery === 'blocked' ? 'Abrir ajustes do aparelho' : 'Permitir acesso'}
            onAction={gallery === 'blocked' ? () => Linking.openSettings() : addPhoto}
          />
        ) : null}

        <View style={styles.photos}>
          {photos.map((photo) => (
            <View key={photo.key}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              {photo.status === 'uploading' ? (
                <View style={styles.photoOverlay}>
                  <LoadingDots />
                </View>
              ) : (
                <PressableScale
                  onPress={() => removePhoto(photo.key)}
                  style={styles.removePhoto}
                  hitSlop={8}
                  accessibilityLabel="Remover foto"
                >
                  <Text style={styles.removePhotoText}>×</Text>
                </PressableScale>
              )}
            </View>
          ))}

          {photos.length < MAX_PHOTOS && !galleryUnavailable && (
            <PressableScale
              onPress={addPhoto}
              style={[styles.addPhoto, { borderColor: theme.primary }]}
              accessibilityLabel="Adicionar foto da galeria"
            >
              <Text style={[styles.addPhotoText, { color: theme.primary }]}>+</Text>
            </PressableScale>
          )}
        </View>
        {uploadError && <Text style={styles.error}>{uploadError}</Text>}

        <View style={styles.submit}>
          <Button
            label={createReview.isPending ? 'Publicando…' : isUploading ? 'Aguardando a foto subir…' : 'Publicar avaliação'}
            onPress={submit}
            disabled={createReview.isPending || isUploading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  product: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  counter: { fontSize: 11, color: colors.textSoft, textAlign: 'right' },
  error: { fontSize: 12, color: colors.danger },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.border },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 17 },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: { fontSize: 30, fontWeight: '300' },
  submit: { marginTop: 20 },
});
