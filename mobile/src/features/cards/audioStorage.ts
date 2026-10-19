import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";

const AUDIO_DIRECTORY = "card-audio/";

export interface PickedAudio {
  uri: string;
  name: string;
}

export async function pickAudioFile(): Promise<PickedAudio | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "audio/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name };
}

export async function pickAudioFiles(): Promise<PickedAudio[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "audio/*",
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({ uri: asset.uri, name: asset.name }));
}

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]{1,5})$/.exec(name);
  return match ? `.${match[1].toLowerCase()}` : ".audio";
}

export function isStoredAudioUri(uri: string): boolean {
  return uri.includes(`/${AUDIO_DIRECTORY}`);
}

async function copyThroughFetch(from: string, to: string): Promise<void> {
  const response = await fetch(from);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const file = new File(to);
  file.create({ intermediates: true, overwrite: true });
  file.write(bytes);
}

export async function persistAudioFile(
  picked: PickedAudio,
  createId: () => string = () => `${Date.now()}`,
): Promise<string> {
  const baseDirectory = FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("Armazenamento local indisponível");
  }

  const directory = `${baseDirectory}${AUDIO_DIRECTORY}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}audio-${createId()}${extensionOf(picked.name)}`;
  try {
    await FileSystem.copyAsync({ from: picked.uri, to: target });
  } catch {
    // Em alguns ambientes (ex.: Expo Go) o cache do seletor não é legível
    // pelo copyAsync; ler o arquivo e gravá-lo no destino contorna isso.
    await copyThroughFetch(picked.uri, target);
  }
  return target;
}

export async function readAudioAsBase64(uri: string): Promise<string | null> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

export async function saveAudioFromBase64(
  name: string,
  base64: string,
  createId: () => string = () => `${Date.now()}`,
): Promise<string> {
  const baseDirectory = FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("Armazenamento local indisponível");
  }

  const directory = `${baseDirectory}${AUDIO_DIRECTORY}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}audio-${createId()}${extensionOf(name)}`;
  await FileSystem.writeAsStringAsync(target, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return target;
}

export async function deleteAudioFile(
  uri: string | null | undefined,
): Promise<void> {
  if (!uri || !isStoredAudioUri(uri)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Arquivo órfão não deve impedir a operação principal.
  }
}
