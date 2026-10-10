import numpy as np
from scipy.stats import entropy, chisquare

def calculate_psnr(img1, img2):
    mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
    if mse == 0:
        return float('inf')
    return 20 * np.log10(255.0 / np.sqrt(mse))

def calculate_mse(img1, img2):
    return np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)

def calculate_mae(img1, img2):
    return np.mean(np.abs(img1.astype(np.float64) - img2.astype(np.float64)))

def calculate_entropy(img):
    hist, _ = np.histogram(img.flatten(), bins=256, range=[0,256])
    if np.sum(hist) == 0:
        return 0
    hist = hist / np.sum(hist)
    return entropy(hist, base=2)

def calculate_npcr(img1, img2):
    return np.mean(img1 != img2) * 100

def calculate_uaci(img1, img2):
    diff = np.abs(img1.astype(np.float64) - img2.astype(np.float64))
    return np.mean(diff / 255.0) * 100

def calculate_correlation(img, direction='h'):
    img = img.astype(np.float64)
    if direction == 'h':
        x = img[:, :-1].flatten()
        y = img[:, 1:].flatten()
    elif direction == 'v':
        x = img[:-1, :].flatten()
        y = img[1:, :].flatten()
    elif direction == 'd':
        x = img[:-1, :-1].flatten()
        y = img[1:, 1:].flatten()
    else:
        raise ValueError("Invalid direction")
    
    if len(x) > 3000:
        np.random.seed(42)
        indices = np.random.choice(len(x), 3000, replace=False)
        x = x[indices]
        y = y[indices]
        
    ex = np.mean(x)
    ey = np.mean(y)
    dx = x - ex
    dy = y - ey
    dx_var = np.mean(dx**2)
    dy_var = np.mean(dy**2)
    
    if dx_var == 0 or dy_var == 0:
        return 0.0
    return np.mean(dx * dy) / np.sqrt(dx_var * dy_var)

def calculate_histogram_uniformity(img):
    hist, _ = np.histogram(img.flatten(), bins=256, range=[0,256])
    expected = np.full_like(hist, len(img.flatten()) / 256.0)
    chi2, p = chisquare(f_obs=hist, f_exp=expected)
    return chi2, p
