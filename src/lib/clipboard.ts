
/**
 * Copies text to clipboard with fallback for non-secure contexts
 * @param text Text to copy
 * @returns Promise<boolean> indicating success
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    // Try Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Clipboard API failed', err);
        }
    }

    // Fallback to textarea + execCommand
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible but part of DOM
        // Use opacity 0 instead of left -9999px to avoid potential layout issues on some mobile browsers
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        return successful;
    } catch (err) {
        console.error('Fallback copy failed', err);
        return false;
    }
}
