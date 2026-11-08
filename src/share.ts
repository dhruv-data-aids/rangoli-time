export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Open the iOS share sheet with a file (Save Image / Save to Files…), or download it where that isn't available. */
export async function shareFile(file: File): Promise<ShareResult> {
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: file.name });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'cancelled';
  }
  download(file);
  return 'downloaded';
}

export const stamp = (): string => new Date().toISOString().slice(0, 10);
