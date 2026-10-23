import sys
import os
import cv2
import time
import argparse
import numpy as np

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from encryption.encryptor import QuantumDNAEncryptor
from decryption.decryptor import QuantumDNADecryptor

# We use the strong default key configuration 
# matching the exact paper specification parameters
STRONG_KEY = {
    'a': 0.9, 'b': 0.2, 'c': 20.0, 'd': 2.0,
    'x0': 0.6382, 'y0': 0.8916, 'z0': 0.6725, 'w0': 0.8374,
    'T': 301, 't': 304, 'theta': 0.0, 
    'sigma_0': np.pi/3, 'sigma_1': np.pi/4, 'sigma_2': np.pi/6,
    'B': [0,1,1,0,1,0,1,1,1,0,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,0,1,0,1,1,0,0,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1]
}

def main():
    parser = argparse.ArgumentParser(description="QuantumDNA Strong Image Encryption/Decryption")
    parser.add_argument("image_path", help="Path to the image you want to encrypt")
    parser.add_argument("--resize", type=int, default=256, help="Resize image for performance (default 256). Pass 0 to keep original size.")
    parser.add_argument("--save-enc", default=None, help="Optional: Path to save the encrypted image (e.g., C:/Images/enc.png)")
    parser.add_argument("--save-dec", default=None, help="Optional: Path to save the decrypted image")
    args = parser.parse_args()

    image_path = args.image_path
    if not os.path.exists(image_path):
        print(f"Error: Image '{image_path}' not found.")
        sys.exit(1)

    print(f"[*] Loading Image: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        print("Error: Could not decode image format.")
        sys.exit(1)

    if args.resize > 0:
        print(f"[*] Resizing to {args.resize}x{args.resize} for performance...")
        img = cv2.resize(img, (args.resize, args.resize))
    
    print(f"[*] Original Shape: {img.shape} (Supports full RGB Color)")
    
    # 1. ENCRYPTION MODULE
    print("\n" + "="*50)
    print("▶ STARTING FULL ARCHITECTURE ENCRYPTION")
    print("="*50)
    print(" - Initializing 4D Hyperchaotic Sequence...")
    print(" - Generating Quantum Walk Probabilities...")
    print(" - Applying DNA Encoding & Confusion...")
    print(" - Applying Dynamic DNA Diffusion...")
    
    encryptor = QuantumDNAEncryptor(STRONG_KEY)
    
    start_time = time.time()
    encrypted_image, px_info, _ = encryptor.encrypt(img)
    enc_time = time.time() - start_time
    
    print(f"✅ Encryption Complete in {enc_time:.2f} seconds!")
    
    if args.save_enc:
        cv2.imwrite(args.save_enc, encrypted_image)
        print(f"📁 Saved encrypted image to: {args.save_enc}")
    else:
        print("💡 (In-Memory Run: Encrypted image not saved to disk)")

    # 2. DECRYPTION MODULE
    print("\n" + "="*50)
    print("▶ STARTING FULL ARCHITECTURE DECRYPTION")
    print("="*50)
    print(" - Re-initializing Sequence using Plain-Image Sensitivity (px_info)...")
    print(" - Reversing Dynamic DNA Diffusion...")
    print(" - Reversing DNA Confusion & Decoding...")
    print(" - Reversing Quantum Walk & Hyperchaotic Masking...")

    decryptor = QuantumDNADecryptor(STRONG_KEY)
    
    start_time = time.time()
    decrypted_image = decryptor.decrypt(encrypted_image, px_info)
    dec_time = time.time() - start_time
    
    print(f"✅ Decryption Complete in {dec_time:.2f} seconds!")
    
    if args.save_dec:
        cv2.imwrite(args.save_dec, decrypted_image)
        print(f"📁 Saved decrypted image to: {args.save_dec}")
    else:
        print("💡 (In-Memory Run: Decrypted duplicate not saved to disk)")

    # 3. VERIFICATION
    print("\n" + "="*50)
    print("▶ INTEGRITY VERIFICATION")
    print("="*50)
    difference = np.sum(np.abs(img.astype(np.int32) - decrypted_image.astype(np.int32)))
    if difference == 0:
        print("🟢 SUCCESS: The decrypted image matches the original PERFECTLY (Zero data loss).")
        print("The strong Quantum DNA architecture mathematically guarantees full restoration.")
    else:
        print(f"🔴 WARNING: Difference detected ({difference}).")

if __name__ == "__main__":
    main()
