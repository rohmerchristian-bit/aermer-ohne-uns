// "Link kopieren" buttons: copy the value of the referenced input, confirm briefly.

export function initCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach((button) => {
    const input = document.getElementById(button.dataset.copyTarget ?? '') as HTMLInputElement | null;
    if (!input) return;
    const label = button.textContent?.trim() ?? '';
    let timer: number | undefined;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(input.value);
      } catch {
        // Clipboard not available (e.g. insecure context): select the text so it can be copied by hand.
        input.select();
        return;
      }
      button.textContent = button.dataset.copiedLabel ?? 'Kopiert';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (button.textContent = label), 2000);
    });
    input.addEventListener('focus', () => input.select());
  });
}
