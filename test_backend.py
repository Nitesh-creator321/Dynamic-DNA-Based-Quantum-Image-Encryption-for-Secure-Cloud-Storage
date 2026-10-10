import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from encryption.encryptor import QuantumDNAEncryptor
import numpy as np
import cv2

def test():
    img = cv2.imread('datasets/color/img1_Female (NTSC test image).tiff', cv2.IMREAD_UNCHANGED)
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    img = cv2.resize(img, (256, 256))
    
    key = {
        'a': 10.0, 'b': 2.6666666667, 'c': 28.0, 'd': -1.0,
        'x0': 0.123456789, 'y0': -0.456789123, 'z0': 0.789123456, 'w0': -0.123789456,
        'T': 50, 'B': 200, 'theta': 0.7853981634, 'sigma_0': 1.0, 'sigma_1': 0.0,
        't': 100, 'sigma_2': 0.0
    }
    encryptor = QuantumDNAEncryptor(key)
    print("Encrypting...")
    enc_img, px_info, profiling = encryptor.encrypt(img)
    print("Success")

if __name__ == "__main__":
    test()
