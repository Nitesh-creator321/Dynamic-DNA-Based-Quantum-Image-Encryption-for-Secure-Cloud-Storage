import cv2
import numpy as np
import sys
import os

# Add to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from encryption.encryptor import QuantumDNAEncryptor
from decryption.decryptor import QuantumDNADecryptor

# generate a dummy image
img = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)

key = {
    'a': 10.0, 'b': 2.6666666667, 'c': 28.0, 'd': -1.0,
    'x0': 0.123456789, 'y0': -0.456789123, 'z0': 0.789123456, 'w0': -0.123789456,
    'T': 50, 'B': 200, 'theta': 0.7853981634, 'sigma_0': 1.0, 'sigma_1': 0.0,
    't': 100, 'sigma_2': 0.0
}

# Encrypt
enc = QuantumDNAEncryptor(key)
cipher, px_info, _ = enc.encrypt(img)

# Decrypt with WRONG key
key_wrong = key.copy()
key_wrong['x0'] = 0.123656789

dec = QuantumDNADecryptor(key_wrong)
plain_wrong = dec.decrypt(cipher, px_info)

diff = np.sum(np.abs(img - plain_wrong))
print(f"Difference with wrong key: {diff}")

# Decrypt with correct key
dec_correct = QuantumDNADecryptor(key)
plain_correct = dec_correct.decrypt(cipher, px_info)

diff_correct = np.sum(np.abs(img - plain_correct))
print(f"Difference with correct key: {diff_correct}")
