import matplotlib.pyplot as plt
import numpy as np

def plot_histogram(plain_img, cipher_img):
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    
    # Modern cohesive colors matching File Encryption
    color_plain = '#3b82f6'  # Blue for Plain
    color_cipher = '#10b981' # Emerald Green for Cipher
    
    # 1. Plain Image Histogram
    p_flat = plain_img.flatten()
    h_plain, _ = np.histogram(p_flat, bins=256, range=(0, 256))
    axes[0].bar(np.arange(256), h_plain, width=1.0, color=color_plain, alpha=0.85, edgecolor='none')
    axes[0].set_title('Plain Image Distribution', fontsize=13, fontweight='bold', pad=12, color='#0f172a')
    axes[0].set_xlabel('Pixel Intensity (0-255)', fontsize=11, color='#64748b')
    axes[0].set_ylabel('Pixel Frequency', fontsize=11, color='#64748b')
    axes[0].set_xlim([0, 255])
    
    # Smart Y-scaling: if solid background color (0 or 255) dominates, prevent it from flattening the content
    sorted_p = np.sort(h_plain)
    if len(sorted_p) > 2 and sorted_p[-1] > sorted_p[-2] * 2.5:
        y_max = sorted_p[-2] * 1.5
    else:
        y_max = np.max(h_plain) * 1.15
    if y_max > 0:
        axes[0].set_ylim([0, y_max])
    
    # 2. Cipher Image Histogram (Uniform Flat Distribution)
    c_flat = cipher_img.flatten()
    h_cipher, _ = np.histogram(c_flat, bins=256, range=(0, 256))
    axes[1].bar(np.arange(256), h_cipher, width=1.0, color=color_cipher, alpha=0.85, edgecolor='none')
    axes[1].set_title('Cipher Image Distribution (Uniform)', fontsize=13, fontweight='bold', pad=12, color='#0f172a')
    axes[1].set_xlabel('Pixel Intensity (0-255)', fontsize=11, color='#64748b')
    axes[1].set_ylabel('Pixel Frequency', fontsize=11, color='#64748b')
    axes[1].set_xlim([0, 255])
    
    # Expected Uniform Reference Line
    expected = len(c_flat) / 256.0
    axes[1].axhline(y=expected, color='#f59e0b', linestyle='--', linewidth=1.5, label=f'Expected Uniform ({int(expected)})')
    axes[1].set_ylim([0, expected * 1.6])
    axes[1].legend(loc='upper right', framealpha=0.9, fontsize=9)
    
    # Apply clean styling to both subplots
    for ax in axes:
        ax.grid(True, linestyle='--', alpha=0.7, color='#e2e8f0')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#cbd5e1')
        ax.spines['bottom'].set_color('#cbd5e1')
        ax.tick_params(colors='#64748b')
        ax.set_facecolor('#f8fafc')
    
    fig.patch.set_facecolor('#ffffff')
    fig.tight_layout()
    return fig

def plot_correlation(img, direction='h', title="Correlation"):
    fig, ax = plt.subplots(figsize=(6, 6))
    if direction == 'h':
        x = img[:, :-1].flatten()
        y = img[:, 1:].flatten()
    elif direction == 'v':
        x = img[:-1, :].flatten()
        y = img[1:, :].flatten()
    else: # 'd'
        x = img[:-1, :-1].flatten()
        y = img[1:, 1:].flatten()

    sample_size = min(4000, len(x))
    np.random.seed(42)
    indices = np.random.choice(len(x), sample_size, replace=False)
    
    # Plot correlation using an aesthetic emerald scatter
    ax.scatter(x[indices], y[indices], s=3, alpha=0.65, color='#10b981', edgecolors='none')
    
    # Diagonal reference line (y = x)
    ax.plot([0, 255], [0, 255], linestyle='--', color='#cbd5e1', alpha=0.8, linewidth=1.2)
    
    ax.set_title(title, fontsize=13, fontweight='bold', pad=12, color='#0f172a')
    ax.set_xlabel('Pixel Position (x, y)', fontsize=11, color='#64748b')
    ax.set_ylabel('Adjacent Pixel Value', fontsize=11, color='#64748b')
    ax.set_xlim([0, 255])
    ax.set_ylim([0, 255])
    
    # Styling
    ax.grid(True, linestyle='--', alpha=0.7, color='#e2e8f0')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#cbd5e1')
    ax.spines['bottom'].set_color('#cbd5e1')
    ax.tick_params(colors='#64748b')
    ax.set_facecolor('#f8fafc')
    
    fig.patch.set_facecolor('#ffffff')
    fig.tight_layout()
    return fig

