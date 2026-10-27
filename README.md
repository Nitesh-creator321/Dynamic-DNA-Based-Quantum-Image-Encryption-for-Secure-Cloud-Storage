# Quantum-DNA Cryptosystem

## 📖 Introduction

In an increasingly connected digital world, ensuring the confidentiality of multimedia and binary data—such as medical images, confidential documents, videos, and audio communications—has become paramount. Traditional ciphers like AES and RSA, while robust for text, often struggle with the sheer data volume and intense spatial/temporal correlation inherent in multimedia content. Furthermore, emerging quantum computing capabilities pose significant threats to conventional cryptographic infrastructures.

This project introduces a future-proof, high-performance cryptosystem based on the research paper **"A Robust Image Encryption Scheme Based on Quantum Walks and Dynamic DNA for Secure Cloud Applications"** published in **IEEE Access (2025)**. 

The system integrates **4D Hyperchaotic Systems**, **Discrete-Time Quantum Walks (DTQW)**, and **Dynamic Biological DNA Cryptography** into a lossless encryption and decryption pipeline. It features a modern, clean web dashboard and a FastAPI backend server supporting:
1. **Lossless Image Cryptosystem & Cryptanalysis**: High-resolution image encryption with multi-directional correlation analysis and histogram evaluation.
2. **Universal File Encryption (Audio, Video, PDF, Docs)**: A stateful streaming chunk architecture capable of encrypting arbitrary binary files of any size with near-zero memory footprint.
3. **Comprehensive Cryptographic Performance Benchmark Suites**: Evaluating Shannon Entropy, Chi-Square ($\chi^2$) Uniformity, Byte-level NPCR, UACI, Adjacent Correlation, and Throughput across both images and generic binary files.
4. **Interactive Cryptographic Representation Charts**: In-browser vector charts for Byte Frequency Histograms, Block-by-Block Local Entropy Profiles, and Adjacent Byte Correlation Phase Portraits.

---

## 📄 Academic Reference & Foundation

* **Paper Title**: *A Robust Image Encryption Scheme Based on Quantum Walks and Dynamic DNA for Secure Cloud Applications*
* **Authors**: Ahmed A. Abd El-Latif, May Almousa, Bassem Abd-El-Atty
* **Journal**: **IEEE Access**, Volume 13, Pages 119110–119130, 2025
* **Digital Object Identifier (DOI)**: [10.1109/ACCESS.2025.3582705](https://doi.org/10.1109/ACCESS.2025.3582705)

### Standard Paper Parameters Configured in System:
* **4D Hyperchaotic Map**: $a = 0.9$, $b = 0.2$, $c = 20.0$, $d = 2.0$, $x_0 = 0.6382$, $y_0 = 0.8916$, $z_0 = 0.6725$, $w_0 = 0.8374$
* **Discrete-Time Quantum Walk (DTQW)**: Odd nodes $T = 301$, Walk steps $t = 304$, Coin angle $\theta = 0.0$, Coin rotation angles $\sigma_0 = \pi/3$, $\sigma_1 = \pi/4$, $\sigma_2 = \pi/6$
* **Quantum Control Bitstring ($B$)**: 48-bit binary sequence (`011010111001100101101011000101100011101010101011`)
* **Dynamic DNA Rules**: 8 Biological coding rules with dynamic rule selection per byte, paired with 4 DNA operations (XOR, XNOR, Addition, Subtraction).

---

## 🌟 Key Features

### 1. Image Cryptosystem & Security Analytics
* **Lossless Cryptography**: Complete bit-for-bit exact reconstruction of original image matrices upon authorized decryption.
* **Plaintext-Dependent Feedback ($PxInfo$)**: Sum of pre-diffused pixels dynamically updates initial chaotic states and quantum control bits, ensuring strict sensitivity against chosen-plaintext and differential attacks without external hashes (SHA-256).
* **Cryptographic Benchmark Dashboard**: Real-time evaluation of:
  * **Information Entropy**: Approaching ideal $8.0000\text{ bits/pixel}$ ($\ge 7.999$).
  * **Differential Sensitivity (NPCR)**: Exceeds benchmark $> 99.60\%$.
  * **Unified Average Changing Intensity (UACI)**: Uniform deviation $\approx 33.46\%$.
  * **Multi-Directional Correlation**: Horizontal ($r_H$), Vertical ($r_V$), and Diagonal ($r_D$) correlations dropping from $> 0.95$ to $\approx 0.0000$.
  * **Dissimilarity Metrics**: Peak Signal-to-Noise Ratio ($\text{PSNR} < 10\text{ dB}$, typically $6\text{–}8.5\text{ dB}$) and high Mean Squared Error ($\text{MSE} > 8000$).
* **Interactive Directional Phase Portrait**: Toggle between Horizontal, Vertical, and Diagonal adjacent pixel correlation distributions.

### 2. Universal File Encryption (Audio, Video, PDF, Docs)
* **Format-Agnostic Processing**: Encrypts any binary file (e.g., `.mp3`, `.wav`, `.mp4`, `.mkv`, `.pdf`, `.docx`, `.zip`, `.bin`).
* **Stateful 1MB Chunk Architecture**: Reads and streams data in 1MB chunks. Memory overhead remains bounded ($< 50\text{MB}$ RAM) even when processing files in excess of several gigabytes.
* **Inter-Chunk Mathematical Coupling**: The concluding hyperchaotic and quantum walker states of Chunk $N$ dynamically seed Chunk $N+1$, ensuring the butterfly effect seamlessly cascades across the entire file stream.
* **Controlled Downloads**: Generates an explicit download button upon process completion, preventing unprompted auto-downloads.

### 3. Comprehensive File Cryptographic Metrics
* **Byte-Level Shannon Entropy ($H$)**: Formulated over all 256 byte frequencies ($H = -\sum p_i \log_2 p_i \approx 7.995+\text{ bits/byte}$).
* **Chi-Square ($\chi^2$) Uniformity Test**: Statistical validation against uniform distribution across $df = 255$ degrees of freedom using the Wilson-Hilferty transformation ($\chi^2 < 293.25$, $p > 0.05$ Pass).
* **Adjacent Byte Correlation ($r$)**: Measures linear dependency between consecutive audio/video/document bytes ($r \approx 0.0000$).
* **Byte-Level NPCR & UACI**: Proves $> 99.60\%$ of all bytes change with uniform deviation intensity.
* **Byte Spectrum Coverage**: Validates that all 256 byte levels ($0\text{–}255$) are utilized ($100\%$ full coverage).
* **Throughput & Speed Tracking**: Real-time calculation of encryption rate in **MB/s** and **Megabits per second (Mbps)**.

### 4. Interactive Vector Representation Charts
* **Byte Frequency Distribution (Histogram)**: Compares plain file vs. cipher file byte distributions against the theoretical uniform expectation line ($E = N / 256$) with an interactive hover crosshair and tooltips.
* **Local Information Entropy Profile**: Divides the payload into 16 sequential blocks, illustrating how plain file entropy fluctuates and dips in headers, while cipher entropy remains flat at $\approx 7.999+$ bits/byte.
* **Adjacent Byte Correlation Phase Portrait**: High-contrast scatter plot demonstrating the transition from diagonal clustering ($r > 0.85$) to isotropic dispersion ($r \approx 0.000$).

### 5. Seamless Modern Frontend Experience
* **Persistent DOM State**: Switching between the Image Encryption and Universal File Encryption tabs does not unmount or interrupt background streaming operations.
* **Real-Time Progress Tracking**: Horizontal progress bars show exact bytes processed, percentage ($0\text{–}100\%$), and elapsed seconds.
* **Typography & Aesthetics**: Styled with Plus Jakarta Sans and JetBrains Mono, crisp white elevation cards, subtle borders, and high-contrast tooltips.
* **Instant Header Refresh**: Clicking the header title ("Quantum DNA Cryptosystem") instantly reloads the application state.

---

## 🛠️ System Architecture & Workflow

```
[Plain Image / File Chunks]
             │
             ▼
1. Initial Substitution ──────► Hyperchaotic Sequence (KX) ──► XOR Mask (SG)
             │
             ▼
2. Plaintext Feedback   ──────► Calculate PxInfo = Σ SG
             │                  │ Updates (x0, y0, z0, w0)
             │                  │ Appends binary(PxInfo) to B
             ▼
3. Quantum Key Generation ────► DTQW Circular Walk (Bu, T, t) ──► Q Vector
             │
             ▼
4. Hyperchaos Iteration ──────► 4D Map (Updated States) ──► (X, Y, Z, W)
             │
             ▼
5. Sequence Integration ──────► QX = Q + X   (Permutation Key)
                                QY = Q + Y   (Dynamic DNA Mask K)
                                QZ = Q + Z   (Operation Selector OP)
                                QW = Q + W   (Decoding Rules & QK)
             │
             ▼
6. Dynamic DNA Stage    ──────► DNA Encoding (Rule 1)
                                Nucleotide Permutation via sorted(QX)
                                Dynamic DNA Ops (Addition / Subtraction / XOR / XNOR)
                                Dynamic DNA Decoding via QW (Rules 1-8)
             │
             ▼
7. Pixel Stage          ──────► Pixel-Level Permutation via sorted(QY)
                                Pixel-Level XOR Substitution via QK = QW mod 256
             │
             ▼
[Encrypted Ciphertext (.enc / PNG)]
```

---

## 💻 Tech Stack

### Core Cryptography & Backend
* **Python 3.9+**
* **FastAPI**: Asynchronous web framework with streaming responses.
* **NumPy & SciPy**: Matrix operations, quantum walk simulations, and chi-square statistical tests.
* **OpenCV & Pillow**: High-resolution image manipulation and color conversions.
* **Matplotlib**: Vector plot generation for histograms and correlation portraits.
* **Uvicorn**: High-throughput ASGI server.

### Frontend Dashboard
* **React 19 & Vite**: Fast component rendering and build pipeline.
* **Vanilla CSS Design System**: Custom glassmorphism, responsive grid layouts, and unified color tokens.
* **Vector SVG Charts**: Custom zero-dependency interactive SVG graphics with hover crosshairs and tooltips.

---

## 📂 Project Structure

```filepath
QuantumDNA-Image-Encryption/
├── api/
│   └── server.py                # FastAPI routes (encrypt, decrypt, streaming, and analysis)
├── chaos_module/
│   └── hyperchaotic_4d.py       # 4D Hyperchaotic map implementation
├── decryption/
│   ├── decryptor.py             # Image decryption pipeline
│   └── file_decryptor.py        # Streaming chunked file decryption
├── dna_module/
│   └── dna_core.py              # Biological DNA rules & algebraic matrix operations
├── encryption/
│   ├── encryptor.py             # Image encryption pipeline
│   └── file_encryptor.py        # Streaming chunked file encryption
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main dashboard (Image cryptosystem & tabs)
│   │   ├── FileEncryption.jsx   # Universal File Encryption & Interactive Charts
│   │   ├── App.css              # Design system & responsive layout styling
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js
├── metrics/
│   ├── metrics.py               # Cryptographic benchmark formulas (Image & File)
│   └── visuals.py               # Matplotlib visual generation
├── quantum_module/
│   └── quantum_walk.py          # Discrete-Time Quantum Walk (DTQW) simulation
├── utils/
│   └── sequence_generator.py    # Sequence generation wrapper
├── automated_tester.py          # Batch benchmark scanner
├── Dockerfile                   # Multi-stage production container setup
├── requirements.txt             # Python dependencies
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```powershell
# Create and activate virtual environment
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python api/server.py
```
*The API server will listen at `http://localhost:8000`.*

### 2. Frontend Setup
```powershell
# Navigate to frontend and install packages
cd frontend
npm install

# Run the development server
npm run dev
```
*Access the dashboard at `http://localhost:5173`.*

### 3. Production Build & Docker
```powershell
# Build frontend production bundle into dist/
cd frontend
npm run build
cd ..

# Build and run Docker container
docker build -t quantum-dna-crypto .
docker run -p 8000:8000 quantum-dna-crypto
```

---

## 🧪 Automated Testing & Verification

Run the test suite to verify key sensitivity, chaos dynamics, and backend routes:

```powershell
# Verify backend API endpoints
python test_backend.py

# Verify 4D Hyperchaotic map bifurcation & Lyapuonv dynamics
python test_chaos.py

# Verify plain-image key sensitivity (avalanche effect)
python test_sensitivity.py

# Execute full statistical benchmark scan
python automated_tester.py
```

---

## 📡 API Reference

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/encrypt` | `POST` | `multipart/form-data` (file, keys) | Encrypts image and returns Base64 cipher, `PxInfo`, and profiling timings. |
| `/api/decrypt` | `POST` | `multipart/form-data` (file, px_info, keys) | Decrypts ciphertext image and returns Base64 reconstructed image. |
| `/api/encrypt_file` | `POST` | `multipart/form-data` (file, keys) | Streams chunked encrypted binary stream (`.enc`). |
| `/api/decrypt_file` | `POST` | `multipart/form-data` (file, keys) | Streams chunked decrypted binary stream. |
| `/api/analyze` | `POST` | `multipart/form-data` (plain_file, cipher_file) | Computes PSNR, MSE, Entropy, NPCR, UACI, correlation, and charts for images. |
| `/api/analyze_file` | `POST` | `multipart/form-data` (plain_file, cipher_file, elapsed_sec) | Computes Entropy, Chi-Square, NPCR, UACI, correlation, and throughput for files. |

---

## 📄 License
This project is developed under the educational and open-source terms aligning with the IEEE Access CC-BY 4.0 guidelines.

