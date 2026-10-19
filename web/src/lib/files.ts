function read<T extends string | ArrayBuffer>(
  start: (reader: FileReader) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => resolve(reader.result as T);
    start(reader);
  });
}

// FileReader funciona em qualquer navegador e no jsdom dos testes.
export function readAsText(blob: Blob): Promise<string> {
  return read<string>((reader) => reader.readAsText(blob));
}

export function readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return read<ArrayBuffer>((reader) => reader.readAsArrayBuffer(blob));
}
