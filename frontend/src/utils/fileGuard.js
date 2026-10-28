/**
 * fileGuard.js - Client-Side Pre-Flight MIME & Magic Byte Security Guard
 * Enforces strict boundaries between Universal File Encryption and Image Encryption.
 * Prevents MIME attacks, extension spoofing, and file confusion before network transfer.
 */

export const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif',
  '.gif', '.ico', '.svg', '.heic', '.avif'
];

export const ALLOWED_UNIVERSAL_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.txt', '.csv',
  // Audio
  '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.opus', '.aac',
  // Video
  '.mp4', '.mkv', '.avi', '.mov', '.webm',
  // Encrypted File Container
  '.enc'
];

/**
 * Checks if the leading bytes match known image magic signatures
 * @param {Uint8Array} bytes 
 * @returns {boolean}
 */
export function isImageHeader(bytes) {
  if (!bytes || bytes.length < 4) return false;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) return true;

  // TIFF (LE: 49 49 2A 00, BE: 4D 4D 00 2A)
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) ||
      (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A)) {
    return true;
  }

  // WEBP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return true;
    }
  }

  // ICO: 00 00 01 00
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return true;

  return false;
}

/**
 * Validates a file selected for Universal File Encryption (Audio, Video, PDF, Docs)
 * @param {File} file 
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateUniversalUpload(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  const filename = file.name || '';
  const ext = ('.' + filename.split('.').pop()).toLowerCase();

  // 1. Hard Block on Image Extensions
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Image format (${ext}) rejected. Only document, audio, and video files (PDF, DOCX, MP3, MP4, etc.) are accepted in this module.`
    };
  }

  // 2. Allowed Universal Extensions Check
  if (!ALLOWED_UNIVERSAL_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unauthorized format (${ext}). Universal File Encryption only supports Audio (.mp3, .wav), Video (.mp4, .mkv), PDF (.pdf), and Documents (.docx, .xlsx, .txt).`
    };
  }

  // 3. Deep Magic Byte Sniffing (First 64 bytes)
  try {
    const slice = file.slice(0, 64);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (isImageHeader(bytes)) {
      return {
        valid: false,
        error: `MIME Spoofing Blocked: File "${filename}" contains image binary signatures (JPEG/PNG/WEBP). Upload rejected.`
      };
    }

    // Specific structural checks
    if (ext === '.pdf') {
      const headerStr = String.fromCharCode.apply(null, bytes.slice(0, 5));
      if (!headerStr.startsWith('%PDF-')) {
        return {
          valid: false,
          error: `Corrupt or spoofed PDF: "${filename}" lacks the standard "%PDF-" file header.`
        };
      }
    }
  } catch (err) {
    console.warn('Pre-flight byte inspection warning:', err);
  }

  return { valid: true };
}

/**
 * Validates a file selected for Image Encryption
 * @param {File} file 
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateImageUpload(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  const filename = file.name || '';
  const ext = ('.' + filename.split('.').pop()).toLowerCase();

  // 1. Only Allowed Image Extensions
  const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'];
  if (!validImageExts.includes(ext)) {
    return {
      valid: false,
      error: `Non-image format (${ext}) rejected. Only standard image files (PNG, JPEG, WEBP, BMP, TIFF) are accepted in this module.`
    };
  }

  // 2. Deep Magic Byte Sniffing (First 64 bytes)
  try {
    const slice = file.slice(0, 64);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Disallow non-image magic headers disguised with image extension
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { valid: false, error: `Security Alert: "${filename}" is a PDF document disguised as an image. Rejected.` };
    }
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return { valid: false, error: `Security Alert: "${filename}" is a ZIP/Office archive disguised as an image. Rejected.` };
    }
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return { valid: false, error: `Security Alert: "${filename}" is an MP3 audio file disguised as an image. Rejected.` };
    }

    if (!isImageHeader(bytes)) {
      return {
        valid: false,
        error: `File "${filename}" lacks a valid image magic header. Only genuine images can be encrypted in this module.`
      };
    }
  } catch (err) {
    console.warn('Pre-flight byte inspection warning:', err);
  }

  return { valid: true };
}

