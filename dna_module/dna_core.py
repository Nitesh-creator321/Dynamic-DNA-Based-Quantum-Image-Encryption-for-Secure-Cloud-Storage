import numpy as np
from numba import njit

DNA_RULES_INT = np.array([
    [0, 1, 2, 3],
    [0, 2, 1, 3],
    [1, 0, 3, 2],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
    [2, 3, 0, 1],
    [3, 1, 2, 0],
    [3, 2, 1, 0]
], dtype=np.uint8)

INV_DNA_RULES_INT = np.array([[list(r).index(i) for i in range(4)] for r in DNA_RULES_INT], dtype=np.uint8)

@njit(fastmath=True)
def bytes_to_dna_bases_jit(data_bytes):
    n = len(data_bytes)
    base4 = np.zeros((n, 4), dtype=np.uint8)
    for i in range(n):
        val = data_bytes[i]
        base4[i, 0] = (val >> 6) & 3
        base4[i, 1] = (val >> 4) & 3
        base4[i, 2] = (val >> 2) & 3
        base4[i, 3] = val & 3
    return base4

def bytes_to_dna_bases(data_bytes):
    return bytes_to_dna_bases_jit(data_bytes.flatten()).reshape(data_bytes.shape + (4,))

@njit(fastmath=True)
def dna_bases_to_bytes_jit(base4_flat):
    n = len(base4_flat) // 4
    out = np.zeros(n, dtype=np.uint8)
    for i in range(n):
        out[i] = ((base4_flat[i * 4] << 6) |
                  (base4_flat[i * 4 + 1] << 4) |
                  (base4_flat[i * 4 + 2] << 2) |
                  base4_flat[i * 4 + 3])
    return out

def dna_bases_to_bytes(base4):
    return dna_bases_to_bytes_jit(base4.flatten()).reshape(base4.shape[:-1])

@njit(fastmath=True)
def encode_dna(base4_values, rule_idx):
    n = len(base4_values)
    out = np.zeros(n, dtype=np.uint8)
    for i in range(n):
        out[i] = DNA_RULES_INT[rule_idx[i] % 8, base4_values[i]]
    return out

@njit(fastmath=True)
def decode_dna(encoded_values, rule_idx):
    n = len(encoded_values)
    out = np.zeros(n, dtype=np.uint8)
    for i in range(n):
        out[i] = INV_DNA_RULES_INT[rule_idx[i] % 8, encoded_values[i]]
    return out

@njit(fastmath=True)
def execute_dynamic_dna_ops(DPGV, DK, OP):
    n = len(DPGV)
    DSG = np.zeros(n, dtype=np.uint8)
    for i in range(n):
        op_val = OP[i]
        v1 = DPGV[i]
        v2 = DK[i]
        if op_val == 1:
            DSG[i] = (v1 + v2) % 4
        elif op_val == 2:
            DSG[i] = (v1 - v2) % 4
        elif op_val == 3:
            DSG[i] = v1 ^ v2
        else:
            DSG[i] = (~(v1 ^ v2)) & 3
    return DSG

@njit(fastmath=True)
def execute_inverse_dynamic_dna_ops(DSG, DK, OP):
    n = len(DSG)
    DPGV = np.zeros(n, dtype=np.uint8)
    for i in range(n):
        op_val = OP[i]
        v1 = DSG[i]
        v2 = DK[i]
        if op_val == 1:
            DPGV[i] = (v1 - v2) % 4
        elif op_val == 2:
            DPGV[i] = (v1 + v2) % 4
        elif op_val == 3:
            DPGV[i] = v1 ^ v2
        else:
            DPGV[i] = (~(v1 ^ v2)) & 3
    return DPGV

def dna_add(dna1, dna2):
    return (dna1 + dna2) % 4

def dna_sub(dna1, dna2):
    return (dna1 - dna2) % 4

def dna_xor(dna1, dna2):
    return np.bitwise_xor(dna1, dna2)

def dna_xnor(dna1, dna2):
    return (~np.bitwise_xor(dna1, dna2)) & 3
