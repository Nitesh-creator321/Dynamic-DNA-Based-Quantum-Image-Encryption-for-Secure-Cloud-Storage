import os
import cv2
import numpy as np
import time
import urllib.request
import matplotlib.pyplot as plt

from encryption.encryptor import QuantumDNAEncryptor
from decryption.decryptor import QuantumDNADecryptor
from metrics.metrics import (calculate_psnr, calculate_mse, calculate_entropy, 
                              calculate_npcr, calculate_uaci, calculate_correlation, 
                              calculate_histogram_uniformity)

DEFAULT_KEY = {
    'a': 0.9, 'b': 0.2, 'c': 20.0, 'd': 2.0,
    'x0': 0.6382, 'y0': 0.8916, 'z0': 0.6725, 'w0': 0.8374,
    'T': 301, 't': 304, 'theta': 0.0, 
    'sigma_0': np.pi/3, 'sigma_1': np.pi/4, 'sigma_2': np.pi/6,
    'B': [0,1,1,0,1,0,1,1,1,0,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,0,1,0,1,1,0,0,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1]
}

DATASET_ROOT = "datasets"
EXAMPLE_OUT_DIR = "results"
example_saved = False

def setup_directories():
    os.makedirs(f"{DATASET_ROOT}/grayscale", exist_ok=True)
    os.makedirs(f"{DATASET_ROOT}/color", exist_ok=True)
    os.makedirs(EXAMPLE_OUT_DIR, exist_ok=True)

def download_sample_images():
    print("Checking dataset samples...")
    # Using small images to keep terminal tests fast, avoiding huge downloads
    # but we will resize them to 512x512 as requested to validate large data properties.
    samples = [
        {"url": "https://sipi.usc.edu/database/download.php?vol=misc&img=4.1.04", "name": "lena.tiff", "type": "color"},
        {"url": "https://sipi.usc.edu/database/download.php?vol=misc&img=5.1.12", "name": "clock.tiff", "type": "grayscale"}
    ]
    
    for sample in samples:
        target_path = os.path.join(DATASET_ROOT, sample["type"], sample["name"])
        if not os.path.exists(target_path):
            print(f"Downloading {sample['name']} from USC-SIPI...")
            try:
                # Add headers to avoid 403 Forbidden
                req = urllib.request.Request(sample["url"], headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Saved to {target_path}")
            except Exception as e:
                print(f"Failed to download {sample['name']}: {e}")
                # Create a placeholder test image if download fails
                img = np.random.randint(0, 256, (512, 512), dtype=np.uint8)
                cv2.imwrite(target_path, img)

def process_image(filepath, category):
    filename = os.path.basename(filepath)
    print(f"\n" + "="*50)
    print(f"Processing Image: {filename} [{category}]")
    print("="*50)

    # 1. Load and Resize to 512x512
    img = cv2.imread(filepath)
    if img is None:
        print("Error: Could not read image.")
        return

    # Convert to grayscale to align with 2D DNA sequences mathematically
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
    img = cv2.resize(img, (512, 512))
    print(f"Loaded and resized to {img.shape}")

    # 2. Encrypt
    print("Encrypting (512x512 matrix)...")
    encryptor = QuantumDNAEncryptor(DEFAULT_KEY)
    start_time = time.time()
    enc_img, px_info, _ = encryptor.encrypt(img)
    enc_time = time.time() - start_time
    print(f"Encryption Time: {enc_time:.2f} s")

    # 3. Decrypt
    print("Decrypting (512x512 matrix)...")
    decryptor = QuantumDNADecryptor(DEFAULT_KEY)
    start_time = time.time()
    dec_img = decryptor.decrypt(enc_img, px_info)
    dec_time = time.time() - start_time
    print(f"Decryption Time: {dec_time:.2f} s")

    # 4. Metrics
    print("Calculating Cryptographic Metrics...")
    psnr = calculate_psnr(img, enc_img)
    mse = calculate_mse(img, enc_img)
    npcr = calculate_npcr(img, enc_img)
    uaci = calculate_uaci(img, enc_img)
    corr_h = calculate_correlation(enc_img, 'h')
    corr_v = calculate_correlation(enc_img, 'v')
    corr_d = calculate_correlation(enc_img, 'd')
    chi2, p_val = calculate_histogram_uniformity(enc_img)
    ent = calculate_entropy(enc_img)
    ent_orig = calculate_entropy(img)
    
    psnr_dec = calculate_psnr(img, dec_img)

    # 5. Key Sensitivity Test
    print("Testing Key Sensitivity (Avalanche Effect)...")
    MODIFIED_KEY = DEFAULT_KEY.copy()
    MODIFIED_KEY['x0'] += 1e-16
    encryptor_mod = QuantumDNAEncryptor(MODIFIED_KEY)
    enc_img_mod, _, _ = encryptor_mod.encrypt(img)
    
    npcr_key = calculate_npcr(enc_img, enc_img_mod)
    uaci_key = calculate_uaci(enc_img, enc_img_mod)

    print("\n--- RESULTS FOR REPORT ---")
    print(f"- PSNR (Orig vs Enc): {psnr:.2f} dB")
    print(f"- PSNR (Orig vs Dec): {'Infinity (Perfect/Lossless)' if psnr_dec == float('inf') else round(psnr_dec, 2)} dB")
    print(f"- MSE               : {mse:.2f}")
    print(f"- NPCR              : {npcr:.4f}% (Ideal: >99.6%)")
    print(f"- UACI              : {uaci:.4f}% (Ideal: ~33.4%)")
    print(f"- Correlation (H)   : {corr_h:.5f} (Ideal: ~0)")
    print(f"- Correlation (V)   : {corr_v:.5f} (Ideal: ~0)")
    print(f"- Correlation (D)   : {corr_d:.5f} (Ideal: ~0)")
    print(f"- Hist Chi-Square   : {chi2:.2f} (p-value: {p_val:.4f})")
    print(f"- Entropy (Orig)    : {ent_orig:.4f}")
    print(f"- Entropy (Cipher)  : {ent:.4f} (Ideal: ~8)")
    print(f"- Key Sens. NPCR    : {npcr_key:.4f}% (Ideal: >99.6%)")
    print(f"- Key Sens. UACI    : {uaci_key:.4f}% (Ideal: ~33.4%)")

    global example_saved
    
    if not example_saved:
        cv2.imwrite(f"{EXAMPLE_OUT_DIR}/1_original_image.png", img)
        cv2.imwrite(f"{EXAMPLE_OUT_DIR}/2_encrypted_image.png", enc_img)
        cv2.imwrite(f"{EXAMPLE_OUT_DIR}/3_decrypted_image.png", dec_img)
        
        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        axes[0].imshow(img, cmap='gray', vmin=0, vmax=255)
        axes[0].set_title("Original")
        axes[0].axis('off')
        
        axes[1].imshow(enc_img, cmap='gray', vmin=0, vmax=255)
        axes[1].set_title("Encrypted")
        axes[1].axis('off')
        
        axes[2].imshow(dec_img, cmap='gray', vmin=0, vmax=255)
        axes[2].set_title("Decrypted")
        axes[2].axis('off')
        
        fig.tight_layout()
        fig.savefig(f"{EXAMPLE_OUT_DIR}/4_visual_comparison.png", dpi=150)
        plt.close(fig)
        
        print("\n[FOLDER] [EXAMPLE SAVED]")
        print("As requested, exactly ONE example image has been saved into the 'results/' folder:")
        print("  - results/1_original_image.png")
        print("  - results/2_encrypted_image.png")
        print("  - results/3_decrypted_image.png")
        print("  - results/4_visual_comparison.png")
        print("All underlying testing will continue purely in-memory to keep the workspace clean.")
        example_saved = True
    else:
        print("\n[INFO] (In-Memory Evaluation: Extra images evaluated mathematically without saving files)")

def main():
    setup_directories()
    download_sample_images()
    
    any_processed = False
    for category in ["grayscale", "color"]:
        folder_path = os.path.join(DATASET_ROOT, category)
        for f in os.listdir(folder_path):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp')):
                file_path = os.path.join(folder_path, f)
                process_image(file_path, category)
                any_processed = True

    if not any_processed:
        print("\nNo dataset images found to process.")

if __name__ == "__main__":
    main()
