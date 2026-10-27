import sys
import os
import io
import json
import base64
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from encryption.encryptor import QuantumDNAEncryptor
from decryption.decryptor import QuantumDNADecryptor
from encryption.file_encryptor import QuantumDNAFileEncryptor
from decryption.file_decryptor import QuantumDNAFileDecryptor
from metrics.metrics import (
    calculate_psnr, calculate_mse, calculate_entropy,
    calculate_npcr, calculate_uaci, calculate_correlation,
    calculate_file_metrics
)
from metrics.visuals import plot_histogram, plot_correlation

app = FastAPI(title="Quantum DNA Image & File Encryption API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_KEY = {
    'a': 0.9, 'b': 0.2, 'c': 20.0, 'd': 2.0,
    'x0': 0.6382, 'y0': 0.8916, 'z0': 0.6725, 'w0': 0.8374,
    'T': 301, 't': 304, 'theta': 0.0,
    'sigma_0': np.pi / 3, 'sigma_1': np.pi / 4, 'sigma_2': np.pi / 6,
    'B': [0,1,1,0,1,0,1,1,1,0,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,0,1,0,1,1,0,0,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1]
}

def parse_key_from_form(
    a: Optional[float] = None,
    b: Optional[float] = None,
    c: Optional[float] = None,
    d: Optional[float] = None,
    x0: Optional[float] = None,
    y0: Optional[float] = None,
    z0: Optional[float] = None,
    w0: Optional[float] = None,
    T: Optional[int] = None,
    B: Optional[str] = None,
    theta: Optional[float] = None,
    sigma_0: Optional[float] = None,
    sigma_1: Optional[float] = None,
    t: Optional[int] = None,
    sigma_2: Optional[float] = None,
) -> dict:
    key = DEFAULT_KEY.copy()
    if a is not None: key['a'] = float(a)
    if b is not None: key['b'] = float(b)
    if c is not None: key['c'] = float(c)
    if d is not None: key['d'] = float(d)
    if x0 is not None: key['x0'] = float(x0)
    if y0 is not None: key['y0'] = float(y0)
    if z0 is not None: key['z0'] = float(z0)
    if w0 is not None: key['w0'] = float(w0)
    if T is not None: key['T'] = int(T)
    if theta is not None: key['theta'] = float(theta)
    if sigma_0 is not None: key['sigma_0'] = float(sigma_0)
    if sigma_1 is not None: key['sigma_1'] = float(sigma_1)
    if t is not None: key['t'] = int(t)
    if sigma_2 is not None: key['sigma_2'] = float(sigma_2)
    if B is not None:
        try:
            if isinstance(B, str):
                if B.startswith('['):
                    key['B'] = json.loads(B)
                else:
                    key['B'] = [int(x.strip()) for x in B.split(',') if x.strip()]
        except Exception:
            pass
    return key

def decode_image(contents: bytes) -> Optional[np.ndarray]:
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is not None:
        return img
    try:
        pil_img = Image.open(io.BytesIO(contents))
        if pil_img.mode in ('RGBA', 'LA') or (pil_img.mode == 'P' and 'transparency' in pil_img.info):
            pil_img = pil_img.convert('RGBA')
            img = np.array(pil_img)
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)
        elif pil_img.mode == 'L':
            img = np.array(pil_img)
        else:
            pil_img = pil_img.convert('RGB')
            img = np.array(pil_img)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        return img
    except Exception:
        return None

def image_to_base64(img_array: np.ndarray) -> str:
    _, buffer = cv2.imencode('.png', img_array)
    return base64.b64encode(buffer).decode('utf-8')

def figure_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

@app.post("/api/encrypt")
async def encrypt_route(
    request: Request,
    file: UploadFile = File(...),
    a: Optional[float] = Form(None),
    b: Optional[float] = Form(None),
    c: Optional[float] = Form(None),
    d: Optional[float] = Form(None),
    x0: Optional[float] = Form(None),
    y0: Optional[float] = Form(None),
    z0: Optional[float] = Form(None),
    w0: Optional[float] = Form(None),
    T: Optional[int] = Form(None),
    B: Optional[str] = Form(None),
    theta: Optional[float] = Form(None),
    sigma_0: Optional[float] = Form(None),
    sigma_1: Optional[float] = Form(None),
    t: Optional[int] = Form(None),
    sigma_2: Optional[float] = Form(None)
):
    key = parse_key_from_form(a, b, c, d, x0, y0, z0, w0, T, B, theta, sigma_0, sigma_1, t, sigma_2)
    contents = await file.read()
    img = decode_image(contents)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    encryptor = QuantumDNAEncryptor(key)
    enc_img, px_info, profiling = encryptor.encrypt(img)

    return {
        "image": image_to_base64(enc_img),
        "px_info": px_info,
        "profiling": profiling
    }

@app.post("/api/decrypt")
async def decrypt_route(
    request: Request,
    file: UploadFile = File(...),
    px_info: float = Form(...),
    a: Optional[float] = Form(None),
    b: Optional[float] = Form(None),
    c: Optional[float] = Form(None),
    d: Optional[float] = Form(None),
    x0: Optional[float] = Form(None),
    y0: Optional[float] = Form(None),
    z0: Optional[float] = Form(None),
    w0: Optional[float] = Form(None),
    T: Optional[int] = Form(None),
    B: Optional[str] = Form(None),
    theta: Optional[float] = Form(None),
    sigma_0: Optional[float] = Form(None),
    sigma_1: Optional[float] = Form(None),
    t: Optional[int] = Form(None),
    sigma_2: Optional[float] = Form(None)
):
    key = parse_key_from_form(a, b, c, d, x0, y0, z0, w0, T, B, theta, sigma_0, sigma_1, t, sigma_2)
    contents = await file.read()
    enc_img = decode_image(contents)
    if enc_img is None:
        raise HTTPException(status_code=400, detail="Invalid encrypted image file")

    decryptor = QuantumDNADecryptor(key)
    dec_img = decryptor.decrypt(enc_img, px_info)

    return {
        "image": image_to_base64(dec_img)
    }

@app.post("/api/encrypt_file")
async def encrypt_file_route(
    request: Request,
    file: UploadFile = File(...),
    a: Optional[float] = Form(None),
    b: Optional[float] = Form(None),
    c: Optional[float] = Form(None),
    d: Optional[float] = Form(None),
    x0: Optional[float] = Form(None),
    y0: Optional[float] = Form(None),
    z0: Optional[float] = Form(None),
    w0: Optional[float] = Form(None),
    T: Optional[int] = Form(None),
    B: Optional[str] = Form(None),
    theta: Optional[float] = Form(None),
    sigma_0: Optional[float] = Form(None),
    sigma_1: Optional[float] = Form(None),
    t: Optional[int] = Form(None),
    sigma_2: Optional[float] = Form(None)
):
    key = parse_key_from_form(a, b, c, d, x0, y0, z0, w0, T, B, theta, sigma_0, sigma_1, t, sigma_2)

    async def encrypt_generator():
        file_encryptor = QuantumDNAFileEncryptor(key)
        chunk_size = 1024 * 1024
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            chunk_arr = np.frombuffer(chunk, dtype=np.uint8)
            enc_chunk = file_encryptor.encrypt_chunk(chunk_arr)
            yield enc_chunk.tobytes()

    filename = file.filename or "file"
    return StreamingResponse(
        encrypt_generator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}.enc"'}
    )

@app.post("/api/decrypt_file")
async def decrypt_file_route(
    request: Request,
    file: UploadFile = File(...),
    a: Optional[float] = Form(None),
    b: Optional[float] = Form(None),
    c: Optional[float] = Form(None),
    d: Optional[float] = Form(None),
    x0: Optional[float] = Form(None),
    y0: Optional[float] = Form(None),
    z0: Optional[float] = Form(None),
    w0: Optional[float] = Form(None),
    T: Optional[int] = Form(None),
    B: Optional[str] = Form(None),
    theta: Optional[float] = Form(None),
    sigma_0: Optional[float] = Form(None),
    sigma_1: Optional[float] = Form(None),
    t: Optional[int] = Form(None),
    sigma_2: Optional[float] = Form(None)
):
    key = parse_key_from_form(a, b, c, d, x0, y0, z0, w0, T, B, theta, sigma_0, sigma_1, t, sigma_2)

    async def decrypt_generator():
        file_decryptor = QuantumDNAFileDecryptor(key)
        chunk_size = 1024 * 1024 + 8
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            chunk_arr = np.frombuffer(chunk, dtype=np.uint8)
            dec_chunk = file_decryptor.decrypt_chunk(chunk_arr)
            yield dec_chunk.tobytes()

    filename = file.filename or "decrypted_file"
    if filename.endswith(".enc"):
        filename = filename[:-4]
    else:
        filename = f"dec_{filename}"

    return StreamingResponse(
        decrypt_generator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/analyze")
async def analyze_route(
    plain_file: UploadFile = File(...),
    cipher_file: UploadFile = File(...)
):
    p_contents = await plain_file.read()
    c_contents = await cipher_file.read()
    P = decode_image(p_contents)
    C = decode_image(c_contents)

    if P is None or C is None:
        raise HTTPException(status_code=400, detail="Invalid image file(s)")

    if P.shape != C.shape:
        C = cv2.resize(C, (P.shape[1], P.shape[0]))

    metrics = {
        "psnr": float(calculate_psnr(P, C)),
        "mse": float(calculate_mse(P, C)),
        "entropy": float(calculate_entropy(C)),
        "npcr": float(calculate_npcr(P, C)),
        "uaci": float(calculate_uaci(P, C)),
        "corr_h": float(calculate_correlation(C, 'h')),
        "corr_v": float(calculate_correlation(C, 'v')),
        "corr_d": float(calculate_correlation(C, 'd'))
    }

    if len(P.shape) == 3 and P.shape[2] == 4:
        P_clean = P[:, :, :3]
    else:
        P_clean = P
    P_gray = cv2.cvtColor(P_clean, cv2.COLOR_BGR2GRAY) if len(P_clean.shape) == 3 else P_clean

    # Use raw cipher bytes for the histogram. Do not apply BGR2GRAY channel blending,
    # which averages independent channels into an artificial bell curve.
    fig_hist = plot_histogram(P_gray, C.flatten())

    # For correlation phase portrait, evaluate a pure single channel to avoid weighted blending
    C_corr = C[:, :, 0] if len(C.shape) == 3 else C
    fig_cor_h = plot_correlation(C_corr, 'h', "Horizontal Adjacent Correlation")
    fig_cor_v = plot_correlation(C_corr, 'v', "Vertical Adjacent Correlation")
    fig_cor_d = plot_correlation(C_corr, 'd', "Diagonal Adjacent Correlation")

    charts = {
        "histogram": figure_to_base64(fig_hist),
        "corr_h": figure_to_base64(fig_cor_h),
        "corr_v": figure_to_base64(fig_cor_v),
        "corr_d": figure_to_base64(fig_cor_d)
    }

    return {
        "metrics": metrics,
        "charts": charts
    }

@app.post("/api/analyze_file")
async def analyze_file_route(
    plain_file: UploadFile = File(...),
    cipher_file: UploadFile = File(...),
    elapsed_sec: Optional[float] = Form(None)
):
    p_contents = await plain_file.read()
    c_contents = await cipher_file.read()
    
    if len(p_contents) == 0 or len(c_contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
        
    metrics = calculate_file_metrics(p_contents, c_contents, elapsed_sec)
    return {"metrics": metrics}

frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.exception_handler(StarletteHTTPException)
    async def custom_404_handler(request: Request, exc: StarletteHTTPException):
        if request.url.path.startswith("/api/"):
            return JSONResponse({"error": "Not Found"}, status_code=404)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)
