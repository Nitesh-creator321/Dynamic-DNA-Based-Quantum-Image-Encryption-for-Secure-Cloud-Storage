import unittest
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.file_guard import FileContentGuard, SecurityValidationError

class TestFileContentGuard(unittest.TestCase):
    def test_image_rejected_in_universal_module_by_extension(self):
        # A file with .png extension should be rejected immediately in universal module
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_universal_file(b"\x89PNG\r\n\x1a\n" + b"\x00" * 30, "test.png")
        self.assertIn("Image formats are strictly disallowed", str(ctx.exception))

    def test_image_rejected_in_universal_module_by_magic_bytes_spoofing(self):
        # A JPEG disguised as .pdf
        fake_pdf = b"\xFF\xD8\xFF\xE0" + b"\x00" * 30
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_universal_file(fake_pdf, "disguised_image.pdf")
        self.assertIn("MIME Attack / Bypass Detected", str(ctx.exception))

        # A PNG disguised as .mp4
        fake_mp4 = b"\x89PNG\r\n\x1a\n" + b"\x00" * 30
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_universal_file(fake_mp4, "disguised_image.mp4")
        self.assertIn("MIME Attack / Bypass Detected", str(ctx.exception))

    def test_universal_valid_files(self):
        # Valid PDF
        valid_pdf = b"%PDF-1.4\n" + b"\x00" * 30
        valid, mime = FileContentGuard.verify_universal_file(valid_pdf, "document.pdf")
        self.assertTrue(valid)
        self.assertEqual(mime, "application/pdf")

        # Valid MP3 (ID3)
        valid_mp3 = b"ID3\x03\x00\x00" + b"\x00" * 30
        valid, mime = FileContentGuard.verify_universal_file(valid_mp3, "audio.mp3")
        self.assertTrue(valid)
        self.assertEqual(mime, "audio/mpeg")

        # Valid WAV
        valid_wav = b"RIFF\x24\x00\x00\x00WAVEfmt "
        valid, mime = FileContentGuard.verify_universal_file(valid_wav, "sound.wav")
        self.assertTrue(valid)
        self.assertEqual(mime, "audio/wav")

        # Valid MP4
        valid_mp4 = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 20
        valid, mime = FileContentGuard.verify_universal_file(valid_mp4, "video.mp4")
        self.assertTrue(valid)
        self.assertEqual(mime, "video/mp4")

        # Valid DOCX (ZIP container)
        valid_docx = b"PK\x03\x04" + b"\x00" * 30
        valid, mime = FileContentGuard.verify_universal_file(valid_docx, "report.docx")
        self.assertTrue(valid)

    def test_image_module_rejects_non_images(self):
        # PDF disguised as .jpg
        fake_jpg = b"%PDF-1.5" + b"\x00" * 30
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_image_file(fake_jpg, "fake.jpg")
        self.assertIn("Security Alert", str(ctx.exception))

        # Audio disguised as .png
        fake_png = b"ID3\x03\x00" + b"\x00" * 30
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_image_file(fake_png, "fake.png")
        self.assertIn("Security Alert", str(ctx.exception))

        # Document extension uploaded to Image module
        with self.assertRaises(SecurityValidationError) as ctx:
            FileContentGuard.verify_image_file(b"%PDF-1.4", "doc.pdf")
        self.assertIn("Only valid image extensions", str(ctx.exception))

    def test_image_module_accepts_valid_image(self):
        valid_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 20
        valid, mime = FileContentGuard.verify_image_file(valid_png, "valid.png")
        self.assertTrue(valid)
        self.assertEqual(mime, "image/png")

if __name__ == "__main__":
    unittest.main()

