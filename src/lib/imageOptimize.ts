// Converte imagens para WebP no client antes do upload, redimensionando se necessário.
// Mantém o nome original (troca extensão para .webp). PNG transparente também é convertido.
// Se o navegador não suportar WebP encoding, retorna o arquivo original.

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

const supportsWebpEncoding = (() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

export async function convertToWebp(file: File): Promise<File> {
  // Já é webp ou não é uma imagem suportada para conversão → retorna como está
  if (file.type === "image/webp") return file;
  if (!file.type.startsWith("image/")) return file;
  if (!supportsWebpEncoding) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Redimensiona mantendo proporção se exceder MAX_DIMENSION
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    // Se a conversão ficou maior que o original, mantém o original
    if (blob.size >= file.size && file.type !== "image/png") return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp", lastModified: Date.now() });
  } catch (err) {
    console.warn("WebP conversion failed, using original:", err);
    return file;
  }
}
