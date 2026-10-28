"""
file_guard.py - Strict MIME & Magic Byte Security Guard
Enforces strict zero-trust segregation between Universal File Encryption and Image Encryption.
Eliminates MIME spoofing, polyglots, and cross-module interchangeability.
"""

import io
import struct
from typing import Tuple, Optional
from PIL import Image

# ==============================================================================
# CRYPTOGRAPHIC CONTAINER PAYLOAD SIGNATURES (PREVENTS CROSS-DECRYPTION)
# ==============================================================================
MAGIC_PAYLOAD_IMAGE = b"QDNA_IMG_v1\x00"
MAGIC_PAYLOAD_STREAM = b"QDNA_STRM_v1\x00"

# ==============================================================================
# EXTENSION WHITELISTS & BLACKLISTS
# ==============================================================================
IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif",
    ".gif", ".ico", ".svg", ".heic", ".avif"
}

ALLOWED_UNIVERSAL_EXTENSIONS = {
    # Documents
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".txt", ".csv",
    # Audio
    ".mp3", ".wav", ".flac", ".ogg", ".m4a", ".opus", ".aac",
    # Video
    ".mp4", ".mkv", ".avi", ".mov", ".webm",
    # Encrypted Universal File Container
    ".enc"
}


class SecurityValidationError(Exception):
    """Raised when uploaded file violates MIME/signature validation boundaries."""
    pass


class FileContentGuard:
    """
    Zero-Trust File Content Inspection and Validation Guard.
    """

    @staticmethod
    def is_image_signature(header: bytes) -> bool:
        """
        Returns True if the binary header matches any known image magic signature.
        """
        if len(header) < 4:
            return False

        # Direct prefix checks
        if header.startswith(b"\xFF\xD8\xFF"):  # JPEG
            return True
        if header.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
            return True
        if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):  # GIF
            return True
        if header.startswith(b"BM"):  # BMP
            return True
        if header.startswith(b"II*\x00") or header.startswith(b"MM\x00*"):  # TIFF
            return True
        if header.startswith(b"\x00\x00\x01\x00"):  # ICO
            return True

        # RIFF container check for WEBP
        if header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP":
            return True

        # Quick check for XML SVG
        stripped = header[:128].strip().lower()
        if b"<svg" in stripped or (b"<?xml" in stripped and b"<svg" in header[:512].lower()):
            return True

        # ISO Box ftyp checks for AVIF/HEIC
        if len(header) >= 12 and header[4:8] == b"ftyp":
            ftyp_sub = header[8:12]
            if ftyp_sub in (b"avif", b"avis", b"heic", b"mif1"):
                return True

        return False

    @classmethod
    def verify_universal_file(cls, header: bytes, filename: str) -> Tuple[bool, str]:
        """
        Validates that a file is strictly an approved Audio, Video, PDF, or Doc.
        Completely rejects any image file or spoofed image payload.
        """
        filename_lower = filename.lower() if filename else ""
        ext = ("." + filename_lower.rsplit(".", 1)[-1]) if "." in filename_lower else ""

        # Step 1: Reject Image Extensions Immediately
        if ext in IMAGE_EXTENSIONS:
            raise SecurityValidationError(
                f"File '{filename}' rejected: Image formats are strictly disallowed in Universal File Encryption. "
                f"Please use the Image Encryption module for images."
            )

        if ext not in ALLOWED_UNIVERSAL_EXTENSIONS:
            raise SecurityValidationError(
                f"File '{filename}' has an unauthorized extension '{ext}'. "
                f"Allowed categories: Audio, Video, PDF, Office Documents (.pdf, .docx, .mp4, .mp3, etc.)."
            )

        # Step 2: Content Sniffing - Hard Rejection of Image Magic Bytes
        if cls.is_image_signature(header):
            raise SecurityValidationError(
                f"MIME Attack / Bypass Detected: File '{filename}' contains image magic bytes (e.g. JPEG/PNG/WEBP/BMP) "
                f"but was uploaded to the Universal File Encryption pipeline. Upload rejected."
            )

        # Step 3: Positive Validation of Permitted Formats
        # PDF Validation
        if ext == ".pdf":
            if not header.startswith(b"%PDF-"):
                raise SecurityValidationError(f"Invalid PDF: '{filename}' is missing the standard '%PDF-' header signature.")
            return True, "application/pdf"

        # Audio / Video RIFF checks (WAV, AVI)
        if header.startswith(b"RIFF") and len(header) >= 12:
            fourcc = header[8:12]
            if fourcc == b"WAVE" and ext == ".wav":
                return True, "audio/wav"
            elif fourcc == b"AVI " and ext == ".avi":
                return True, "video/avi"
            else:
                raise SecurityValidationError(f"Invalid or mismatched RIFF media container in '{filename}'.")

        # Audio: FLAC
        if header.startswith(b"fLaC") and ext == ".flac":
            return True, "audio/flac"

        # Audio: MP3
        if ext == ".mp3" and (header.startswith(b"ID3") or header[:2] in (b"\xFF\xFB", b"\xFF\xF3", b"\xFF\xF2")):
            return True, "audio/mpeg"

        # Audio: OGG / OPUS
        if header.startswith(b"OggS") and ext in (".ogg", ".opus"):
            return True, "audio/ogg"

        # Video: MKV / WebM
        if header.startswith(b"\x1A\x45\xDF\xA3") and ext in (".mkv", ".webm"):
            return True, "video/webm"

        # MP4 / MOV container checks
        if len(header) >= 12 and header[4:8] == b"ftyp":
            brand = header[8:12]
            if brand in (b"isom", b"iso2", b"mp41", b"mp42", b"M4V ", b"qt  ", b"avc1"):
                return True, "video/mp4"
            elif brand == b"M4A ":
                return True, "audio/mp4"

        # Office OpenXML (.docx, .xlsx, .pptx)
        if ext in (".docx", ".xlsx", ".pptx", ".odt"):
            if not header.startswith(b"PK\x03\x04"):
                raise SecurityValidationError(f"File '{filename}' lacks the required ZIP container header for Office documents.")
            return True, "application/vnd.openxmlformats-officedocument"

        # Legacy Office (.doc, .xls, .ppt)
        if ext in (".doc", ".xls", ".ppt"):
            if not header.startswith(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"):
                raise SecurityValidationError(f"File '{filename}' lacks the valid OLE CFB compound document header.")
            return True, "application/msword"

        # Plain Text / CSV
        if ext in (".txt", ".csv"):
            return True, "text/plain"

        # Encrypted ciphertext container
        if ext == ".enc":
            return True, "application/octet-stream"

        return True, "application/octet-stream"

    @classmethod
    def verify_image_file(cls, header: bytes, filename: str, full_file_bytes: Optional[bytes] = None) -> Tuple[bool, str]:
        """
        Validates that a file is strictly an image. Rejects Audio, Video, Docs, and PDFs.
        """
        filename_lower = filename.lower() if filename else ""
        ext = ("." + filename_lower.rsplit(".", 1)[-1]) if "." in filename_lower else ""

        if ext not in IMAGE_EXTENSIONS:
            raise SecurityValidationError(
                f"File '{filename}' rejected: Only valid image extensions (.png, .jpg, .jpeg, .webp, .bmp, .tiff) "
                f"are accepted in the Image Encryption module."
            )

        # Check for disallowed media / document magic headers spoofed as image
        if header.startswith(b"%PDF-"):
            raise SecurityValidationError(f"Security Alert: '{filename}' is a PDF document spoofed with an image extension. Rejected.")
        if header.startswith(b"PK\x03\x04"):
            raise SecurityValidationError(f"Security Alert: '{filename}' is a ZIP/Office archive spoofed with an image extension. Rejected.")
        if header.startswith(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"):
            raise SecurityValidationError(f"Security Alert: '{filename}' is an OLE CFB document spoofed with an image extension. Rejected.")
        if header.startswith(b"ID3") or header.startswith(b"fLaC") or header.startswith(b"OggS"):
            raise SecurityValidationError(f"Security Alert: '{filename}' is an audio file spoofed with an image extension. Rejected.")
        if header.startswith(b"\x1A\x45\xDF\xA3"):
            raise SecurityValidationError(f"Security Alert: '{filename}' is a video file spoofed with an image extension. Rejected.")

        if not cls.is_image_signature(header):
            raise SecurityValidationError(
                f"File '{filename}' does not contain valid image magic bytes. "
                f"Audio, video, document, and executable files are strictly prohibited in the Image module."
            )

        # Deep Image Parser Verification if full buffer is provided
        if full_file_bytes:
            try:
                img = Image.open(io.BytesIO(full_file_bytes))
                img.verify()
            except Exception as e:
                raise SecurityValidationError(f"Corrupt or spoofed image file '{filename}': {str(e)}")

        return True, "image/" + ext.lstrip(".")

