import cv2
import numpy as np

def load_image(file_or_path, target_size=(512, 512), force_grayscale=False):
    if isinstance(file_or_path, str):
        img = cv2.imread(file_or_path, cv2.IMREAD_UNCHANGED)
    else:
        # stream from uploaded file
        file_bytes = np.asarray(bytearray(file_or_path.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_UNCHANGED)

    if img is None:
        raise ValueError("Invalid image or format.")

    # Drop alpha channel securely before progressing
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    if force_grayscale:
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if target_size:
        img = cv2.resize(img, target_size)

    return img
