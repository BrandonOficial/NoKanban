/**
 * Utilitários para o HTML do webview.
 * O template completo permanece no provider para manter uma única fonte de verdade;
 * esta função é usada ao montar o HTML.
 */
export function sanitizeForJson(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
