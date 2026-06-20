import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const TARGET_MIN_BYTES = 50 * 1024;
const TARGET_MAX_BYTES = 100 * 1024;

function getFileSize(uri: string): number {
  try {
    const file = new File(uri);
    return file.exists ? file.size : 0;
  } catch {
    return 0;
  }
}

export async function compressImageForUpload(uri: string): Promise<string> {
  let width = 1024;
  let quality = 0.75;
  let currentUri = uri;

  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    currentUri = result.uri;
    const size = getFileSize(currentUri);

    if (size >= TARGET_MIN_BYTES && size <= TARGET_MAX_BYTES) {
      return currentUri;
    }

    if (size > TARGET_MAX_BYTES) {
      if (quality > 0.35) {
        quality -= 0.1;
      } else {
        width = Math.max(480, Math.round(width * 0.8));
        quality = 0.65;
      }
      continue;
    }

    if (size > 0 && size < TARGET_MIN_BYTES) {
      if (quality < 0.9) {
        quality = Math.min(0.9, quality + 0.08);
      } else if (width < 1280) {
        width = Math.round(width * 1.15);
      } else {
        return currentUri;
      }
    }
  }

  return currentUri;
}
