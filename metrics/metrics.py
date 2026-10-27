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

def calculate_file_metrics(plain_bytes: bytes, cipher_bytes: bytes, elapsed_sec: float = None):
    P = np.frombuffer(plain_bytes, dtype=np.uint8)
    C = np.frombuffer(cipher_bytes, dtype=np.uint8)
    
    n = min(len(P), len(C))
    if n == 0 or len(C) == 0:
        return {}
        
    hist, _ = np.histogram(C, bins=256, range=[0, 256])
    total_c = len(C)
    probs = hist[hist > 0] / total_c
    shannon_entropy = float(-np.sum(probs * np.log2(probs)))
    
    expected = np.full_like(hist, total_c / 256.0, dtype=np.float64)
    chi2, p_val = chisquare(f_obs=hist, f_exp=expected)
    
    P_aligned = P[:n].astype(np.float64)
    C_aligned = C[:n].astype(np.float64)
    npcr = float(np.mean(P[:n] != C[:n]) * 100.0)
    uaci = float(np.mean(np.abs(P_aligned - C_aligned) / 255.0) * 100.0)
    
    mse = float(np.mean((P_aligned - C_aligned) ** 2))
    psnr = float(20 * np.log10(255.0 / np.sqrt(mse))) if mse > 0 else 0.0
    
    c_float = C.astype(np.float64)
    if len(c_float) > 1:
        x = c_float[:-1]
        y = c_float[1:]
        if len(x) > 50000:
            indices = np.linspace(0, len(x) - 1, 50000, dtype=np.int64)
            x = x[indices]
            y = y[indices]
        ex, ey = np.mean(x), np.mean(y)
        dx, dy = x - ex, y - ey
        var_x, var_y = np.mean(dx**2), np.mean(dy**2)
        corr = float(np.mean(dx * dy) / np.sqrt(var_x * var_y)) if (var_x > 0 and var_y > 0) else 0.0
    else:
        corr = 0.0
        
    unique_bytes = int(np.count_nonzero(hist))
    
    metrics = {
        "entropy": round(shannon_entropy, 5),
        "chi2": round(float(chi2), 2),
        "chi2_p": round(float(p_val), 4),
        "npcr": round(npcr, 4),
        "uaci": round(uaci, 4),
        "mse": round(mse, 2),
        "psnr": round(psnr, 2),
        "adjacent_corr": round(corr, 5),
        "unique_bytes": unique_bytes,
        "byte_coverage": round((unique_bytes / 256.0) * 100.0, 2),
        "total_bytes": total_c
    }
    
    if elapsed_sec and elapsed_sec > 0:
        metrics["throughput_mbps"] = round((total_c * 8.0) / (elapsed_sec * 1e6), 3)
        metrics["throughput_mb_s"] = round(total_c / (1024.0 * 1024.0 * elapsed_sec), 3)
        metrics["elapsed_sec"] = round(elapsed_sec, 2)
        
    return metrics

