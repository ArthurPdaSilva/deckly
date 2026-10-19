import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import {
  deleteAudioFile,
  isStoredAudioUri,
  persistAudioFile,
  pickAudioFile,
} from "../../../features/cards/audioStorage";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    write: jest.fn(),
  })),
}));
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("audio storage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the picked audio file", async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/passport.mp3", name: "passport.mp3" }],
    } as never);

    await expect(pickAudioFile()).resolves.toEqual({
      uri: "file:///cache/passport.mp3",
      name: "passport.mp3",
    });
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: "audio/*" }),
    );
  });

  it("returns null when the picker is canceled", async () => {
    jest
      .mocked(DocumentPicker.getDocumentAsync)
      .mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(pickAudioFile()).resolves.toBeNull();
  });

  it("copies the audio into the app document directory", async () => {
    const uri = await persistAudioFile(
      { uri: "file:///cache/Passport.MP3", name: "Passport.MP3" },
      () => "42",
    );

    expect(uri).toBe("file:///docs/card-audio/audio-42.mp3");
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      "file:///docs/card-audio/",
      { intermediates: true },
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: "file:///cache/Passport.MP3",
      to: uri,
    });
  });

  it("only deletes files stored by the app", async () => {
    expect(isStoredAudioUri("file:///docs/card-audio/audio-1.mp3")).toBe(true);
    expect(isStoredAudioUri("file:///cache/other.mp3")).toBe(false);

    await deleteAudioFile("file:///cache/other.mp3");
    await deleteAudioFile(null);
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();

    await deleteAudioFile("file:///docs/card-audio/audio-1.mp3");
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      "file:///docs/card-audio/audio-1.mp3",
      { idempotent: true },
    );
  });

  it("falls back to reading and writing the file when copyAsync cannot read it", async () => {
    jest
      .mocked(FileSystem.copyAsync)
      .mockRejectedValueOnce(new Error("Location isn't readable"));
    const bytes = new Uint8Array([1, 2, 3]);
    globalThis.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    }) as never;

    const uri = await persistAudioFile(
      { uri: "file:///cache/DocumentPicker/a.mp3", name: "a.mp3" },
      () => "7",
    );

    expect(uri).toBe("file:///docs/card-audio/audio-7.mp3");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "file:///cache/DocumentPicker/a.mp3",
    );
    expect(File).toHaveBeenCalledWith(uri);
    const instance = jest.mocked(File).mock.results[0].value;
    expect(instance.create).toHaveBeenCalledWith({
      intermediates: true,
      overwrite: true,
    });
    expect(instance.write).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
  });
});
