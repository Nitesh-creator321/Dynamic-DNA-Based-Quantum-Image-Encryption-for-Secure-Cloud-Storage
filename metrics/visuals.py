import matplotlib.pyplot as plt
import numpy as np

def plot_histogram(plain_img, cipher_img):
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    
    # Modern sleek colors
    color_plain = '#3b82f6'  # Blue
    color_cipher = '#ef4444' # Red
    
    # Plot Plain Image Histogram
    axes[0].hist(plain_img.flatten(), bins=256, range=(0, 256), color=color_plain, alpha=0.8, density=True)
    axes[0].set_title('Plain Image Distribution', fontsize=14, fontweight='bold', pad=15, color='#1e293b')
    axes[0].set_xlabel('Pixel Intensity (0-255)', fontsize=12, color='#475569')
    axes[0].set_ylabel('Density', fontsize=12, color='#475569')
    axes[0].set_xlim([0, 255])
    
    # Plot Cipher Image Histogram
    axes[1].hist(cipher_img.flatten(), bins=256, range=(0, 256), color=color_cipher, alpha=0.8, density=True)
    axes[1].set_title('Cipher Image Distribution', fontsize=14, fontweight='bold', pad=15, color='#1e293b')
    axes[1].set_xlabel('Pixel Intensity (0-255)', fontsize=12, color='#475569')
    axes[1].set_xlim([0, 255])
    
    # Apply clean styling to both
    for ax in axes:
        ax.grid(True, linestyle='--', alpha=0.5, color='#cbd5e1')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#94a3b8')
        ax.spines['bottom'].set_color('#94a3b8')
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
    
    # Plot correlation using an aesthetic scatter
    ax.scatter(x[indices], y[indices], s=3, alpha=0.6, color='#8b5cf6', edgecolors='none')
    
    ax.set_title(title, fontsize=14, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel('Pixel Value (x, y)', fontsize=12, color='#475569')
    ax.set_ylabel('Adjacent Pixel Value', fontsize=12, color='#475569')
    ax.set_xlim([0, 255])
    ax.set_ylim([0, 255])
    
    # Styling
    ax.grid(True, linestyle='--', alpha=0.5, color='#cbd5e1')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#94a3b8')
    ax.spines['bottom'].set_color('#94a3b8')
    ax.tick_params(colors='#64748b')
    ax.set_facecolor('#f8fafc')
    
    fig.patch.set_facecolor('#ffffff')
    fig.tight_layout()
    return fig
