# Quantum-DNA Cryptosystem

## Introduction

In an increasingly digital world, the security of multimedia data—such as images, videos, audio files, and documents—has become paramount. Traditional encryption algorithms like AES or RSA, while secure, often struggle with the sheer volume and high correlation inherent in multimedia data. This project introduces a robust, high-performance cryptosystem combining **4D Hyperchaotic Systems**, **Discrete-Time Quantum Walks (DTQW)**, and **Dynamic DNA Cryptography**. 

It provides a fully lossless encryption/decryption pipeline with a modern React frontend dashboard and a FastAPI backend server, supporting both **Advanced Image Analysis** and **Generic File Encryption (PDF, Audio, Video)** via a highly efficient streaming chunk architecture.

## Problem Statement

Standard cryptographic algorithms are designed for text and short data blocks, making them inefficient for large multimedia files (like high-resolution images or videos) which exhibit strong pixel/data correlation and bulk data volume. Existing chaotic image encryption methods often suffer from limited key spaces, chaotic degradation, or are vulnerable to chosen-plaintext attacks. There is a critical need for an encryption system that offers:
1. Extremely high sensitivity to plain-image/data changes.
2. Large, unpredictable key spaces.
3. Efficient memory management capable of processing massive files without exhausting RAM.
4. Resistance against statistical and differential cryptanalysis.

## Broader Explanation & Methodology

This project tackles these challenges by integrating three advanced mathematical concepts:
- **4D Hyperchaotic Systems**: These systems exhibit complex, unpredictable behavior with multiple positive Lyapunov exponents, providing a vast and highly sensitive key space.
- **Discrete-Time Quantum Walks (DTQW)**: Quantum walks provide a non-classical probability distribution used to generate high-entropy key vectors. They ensure that the chaotic sequences are profoundly random and immune to predictability.
- **Dynamic DNA Cryptography**: By mapping byte data into biological DNA sequences (A, C, G, T), the system performs spatial confusion and dynamic algebraic operations (Addition, Subtraction, XOR, XNOR) at the base level, ensuring deep diffusion.

For large generic files (PDFs, Videos, Audio), the system implements a **Stateful Chunking Architecture**. Instead of loading a 1GB video into memory, it processes it in 1MB chunks. The mathematical state of the chaos and quantum walk at the end of Chunk $N$ dynamically seeds the beginning of Chunk $N+1$, ensuring the "butterfly effect" securely cascades across the entire file footprint with near-zero RAM overhead.

---

## 🌟 Key Features

1. **Image Encryption & Cryptanalysis Dashboard**
   - Securely encrypt images using hyperchaotic sequences and quantum walks.
   - Built-in mathematical analysis suite calculating PSNR, MSE, NPCR, UACI, Entropy, and Correlation directly in the browser.
   - Generates and displays visual histograms and correlation distribution charts.

2. **Universal File Encryption (PDF, Audio, Video)**
   - Supports any generic file type of practically unlimited size.
   - Utilizes a **Stateful Chunking Architecture**: Processes files in 1MB chunks to ensure RAM usage remains near zero, even when encrypting massive video files.
   - The final chaotic state of one chunk becomes the mathematical starting parameter for the next chunk, ensuring the "butterfly effect" cascades securely across the entire file.
   - Uses real-time streaming downloads to hand back the `.enc` file instantly.

3. **High Performance & Security**
   - Extreme Plain-Image Sensitivity: A single byte change dynamically alters the chaotic parameters for the entire encryption pipeline.
   - Immune to differential, statistical, and brute-force attacks.

---

## 🛠️ Technology Stack

**Backend / Core Cryptography:**
- **Python 3.9+**: Core programming language.
- **FastAPI**: High-performance asynchronous web framework for serving the API.
- **NumPy & SciPy**: Fundamental packages for scientific computing, matrix operations, and quantum walk simulations.
- **OpenCV & Pillow (PIL)**: Libraries for advanced image processing and pixel manipulation.
- **Uvicorn**: ASGI web server implementation for Python.

**Frontend / User Interface:**
- **React 18**: Modern JavaScript library for building user interfaces.
- **Vite**: Next-generation frontend tooling for rapid development.
- **JavaScript (ES6+) / CSS3**: For dynamic interactions and responsive dashboard styling.

---

## ⚡ Quick Command Reference

Here is a quick summary of the commands used to run and test this project:

* **Activate Virtual Environment** (PowerShell):
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned ; .\.venv\Scripts\Activate.ps1
  ```

* **Run Backend Server**:
  ```powershell
  python api/server.py
  ```
  *Description: Launches the FastAPI backend server on port 8000.*

* **Run Frontend App**:
  ```powershell
  cd frontend ; npm run dev
  ```
  *Description: Starts the Vite React development server for the interactive dashboard on port 5173.*

* **Run CLI Image Script**:
  ```powershell
  python run_crypto.py dummy.png --save-enc enc.png --save-dec dec.png
  ```

* **Run Automated Test Runner / Metrics Scan**:
  ```powershell
  python automated_tester.py
  ```

* **Run Specific Unit Tests**:
  You can also run specific tests to verify backend or cryptographic components:
  ```powershell
  python test_backend.py
  python test_sensitivity.py
  python test_chaos.py
  ```

---

## 🛠️ System Architecture & Workflow

The core cryptosystem operates on a multi-layered confusion-diffusion architecture:

1. **Pixel-level Pre-Diffusion**: A 4D hyperchaotic system generates sequence $Xi$, used to perform a first-pass XOR operation on the plain-image pixels.
2. **Plain-Image Sensitivity Update ($PxInfo$)**: The sum of pre-diffused pixels dynamically updates the initial values of the chaotic sequences. 
3. **Discrete-Time Quantum Walk (DTQW)**: A dynamic quantum walk simulation produces probability distributions used to generate high-entropy key vectors.
4. **DNA confusion & Dynamic substitution**:
   - Pixels are encoded into DNA bases.
   - Spatial confusion is applied via sequence sorting permutation.
   - Dynamic DNA operations (Addition, Subtraction, XOR, XNOR) are executed at each base index.
   - Dynamic DNA decoding transforms the DNA bases back into byte sequences.
5. **Final Permutation and Diffusion**: Sorting indices from quantum walk probabilities scramble pixel positions, followed by a final hyperchaotic XOR diffusion.
6. **Stateful Chunking (For Files)**: For audio, video, and PDFs, this entire 5-step process is wrapped in a stateful loop, processing exactly 1MB at a time and linking the end mathematical states to the beginning of the next chunk.

---

## 📂 Project Directory Structure

```filepath
QuantumDNA-Image-Encryption/
├── api/                         # Backend FastAPI server
│   ├── server.py                # Server routes (encrypt/decrypt/analyze & streaming endpoints)
├── chaotic_system/              # 4D Hyperchaotic Sequence Generator
├── decryption/                  # Image & File decryption modules
│   ├── decryptor.py             # Reverses image diffusion/confusion
│   └── file_decryptor.py        # Reverses chunked file encryption
├── dna_module/                  # DNA Encoding, Decoding, and Algebraic Operations
├── encryption/                  # Image & File encryption modules
│   ├── encryptor.py             # Core Quantum-DNA encryption pipeline for images
│   └── file_encryptor.py        # Stateful chunking pipeline for universal files
├── frontend/                    # Vite + React User Interface
│   ├── src/                     
│   │   ├── App.jsx              # Main React Application & Image Dashboard
│   │   ├── FileEncryption.jsx   # Dedicated component for generic file uploads
│   │   └── App.css              # Styling (Clean, Light-Themed Dashboard)
├── metrics/                     # Cryptographic Performance Metrics
├── quantum_walk/                # DTQW Simulation Modules
├── utils/                       # Supporting utility modules
├── Dockerfile                   # Docker configuration for full-stack deployment
└── requirements.txt             # Dependencies (Pinned to NumPy < 2.0)
```

---

## 🚀 Installation & Setup

To run this project, make sure you have **Python 3.9+** and **Node.js** installed on your system.

### 1. Python Environment Setup (Backend & CLI)

To avoid system-wide package conflicts (specifically with **NumPy 2.x** which is incompatible with older pre-compiled binaries of `opencv-python`), install the requirements inside a project-isolated virtual environment:

#### Windows (PowerShell)
```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Node.js Environment Setup (Frontend)

Navigate to the `frontend` directory and install the packages:
```powershell
cd frontend
npm install
```

---

## 💻 How to Run the Dashboard

To run the full interactive web application, run the backend and frontend in separate terminal tabs:

1. **Start the FastAPI Backend**:
   ```powershell
   python api/server.py
   ```
   *The backend will boot up on `http://localhost:8000`.*

2. **Start the React Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   *Open the printed link (typically `http://localhost:5173`) in your browser to access the interactive dashboard.*

### 🐳 Docker Deployment

If you prefer to run the entire application (Frontend + Backend) using Docker, you can build and run the provided `Dockerfile`.

```powershell
# Build the Docker image
docker build -t quantum-dna-crypto .

# Run the Docker container
docker run -p 8000:8000 quantum-dna-crypto
```
*The FastAPI application will be accessible at `http://localhost:8000` (FastAPI serves the built frontend in this setup, or just the API depending on server.py configuration).*

### Using the Dashboard

- **Image Encryption Tab:** Upload an image to preview its encryption, decryption, and view in-depth cryptographic charts (Entropy, NPCR, UACI, Histograms).
- **File Encryption Tab:** Upload any `.mp3`, `.mp4`, or `.pdf` file. The frontend will stream the file to the backend, encrypt it chunk-by-chunk in real-time, and download a secure `.enc` file instantly to your computer. Upload the `.enc` file to decrypt and restore the original file effortlessly.
