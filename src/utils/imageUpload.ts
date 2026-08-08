const MB = 1024 * 1024;
const COMPRESSED_MAX_BYTES = 5 * MB;
const ORIGINAL_MAX_BYTES = 10 * MB;

const COMPRESSIBLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function readAscii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

async function detectImageType(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.slice(0, 8).every((v, i) => v === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][i])) return "image/png";
  if (readAscii(bytes, 0, 6) === "GIF87a" || readAscii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (readAscii(bytes, 0, 2) === "BM") return "image/bmp";
  if (
    (readAscii(bytes, 0, 4) === "II*\u0000") ||
    (readAscii(bytes, 0, 4) === "MM\u0000*")
  ) return "image/tiff";

  if (readAscii(bytes, 4, 4) === "ftyp") {
    const brands = readAscii(bytes, 8, 24);
    if (/avif|avis/.test(brands)) return "image/avif";
    if (/heic|heix|hevc|hevx|mif1|msf1/.test(brands)) return "image/heic";
  }
  return null;
}

function replaceExtension(filename: string, extension: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base || "image"}.${extension}`;
}

async function compressToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const longestSide = Math.max(width, height);
    if (longestSide > 4096) {
      const ratio = 4096 / longestSide;
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    let quality = 0.88;
    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("当前浏览器不支持图片压缩");
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (!blob) throw new Error("当前浏览器不支持图片压缩");
      if (blob.size <= COMPRESSED_MAX_BYTES) {
        return new File([blob], replaceExtension(file.name, "webp"), {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
      quality = Math.max(0.55, quality - 0.06);
    }
  } finally {
    bitmap.close();
  }
  throw new Error("图片压缩后仍超过 5MB，请选择尺寸更小的图片");
}

/**
 * 校验并准备上传图片：
 * - JPEG/PNG/WebP/AVIF 超过 5MB 时压缩为不超过 5MB 的 WebP；
 * - GIF/HEIC/BMP/TIFF 等保留原文件，但不得超过 10MB；
 * - 通过文件头判断真实格式，拒绝仅伪装扩展名或 MIME 的文件。
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const detectedType = await detectImageType(file);
  if (!detectedType) {
    throw new Error("请选择有效的图片文件");
  }

  if (!COMPRESSIBLE_TYPES.has(detectedType)) {
    if (file.size > ORIGINAL_MAX_BYTES) {
      throw new Error("该图片格式无法压缩，文件不能超过 10MB");
    }
    return file;
  }

  if (file.size <= COMPRESSED_MAX_BYTES) return file;

  try {
    return await compressToWebp(file);
  } catch (error) {
    if (error instanceof Error && error.message.includes("压缩后仍超过")) throw error;
    throw new Error("图片无法压缩，请转换为 JPG、PNG 或 WebP 后重试");
  }
}
