import numpy as np
from numba import njit

@njit(fastmath=True)
def _generate_sequences_jit(x0, y0, z0, w0, length, a, b, c, d, drop_initial):
    xt, yt, zt, wt = x0, y0, z0, w0
    for _ in range(drop_initial):
        xt_next = (a * (yt - xt) - b * yt * zt + wt) % 1.0
        yt_next = (xt * (1.0 - c * zt)) % 1.0
        zt_next = (xt * yt - d) % 1.0
        wt_next = (-xt - yt) % 1.0
        xt, yt, zt, wt = xt_next, yt_next, zt_next, wt_next

    seqs = np.zeros((4, length), dtype=np.float32)
    for i in range(length):
        xt_next = (a * (yt - xt) - b * yt * zt + wt) % 1.0
        yt_next = (xt * (1.0 - c * zt)) % 1.0
        zt_next = (xt * yt - d) % 1.0
        wt_next = (-xt - yt) % 1.0
        xt, yt, zt, wt = xt_next, yt_next, zt_next, wt_next
        seqs[0, i] = np.float32(xt)
        seqs[1, i] = np.float32(yt)
        seqs[2, i] = np.float32(zt)
        seqs[3, i] = np.float32(wt)

    return seqs[0], seqs[1], seqs[2], seqs[3]

class HyperchaoticSystem:
    def __init__(self, a=10.0, b=2.6666666666666665, c=28.0, d=-1.0):
        self.a = a
        self.b = b
        self.c = c
        self.d = d

    def generate_sequences(self, x0, y0, z0, w0, length, drop_initial=1000):
        return _generate_sequences_jit(x0, y0, z0, w0, length, self.a, self.b, self.c, self.d, drop_initial)
