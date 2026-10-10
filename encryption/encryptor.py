import numpy as np
import time
from dna_module.dna_core import (bytes_to_dna_bases, dna_bases_to_bytes, 
                       encode_dna, decode_dna, dna_add, dna_sub, dna_xor, dna_xnor)
from utils.sequence_generator import SequenceGenerator

class QuantumDNAEncryptor:
    def __init__(self, key):
        self.key = key
        self.seq_gen = SequenceGenerator(key)

    def encrypt(self, image):
        profiling = {'chaos': 0.0, 'quantum': 0.0, 'dna_confusion': 0.0, 'pixel_diffusion': 0.0, 'total': 0.0}
        t_total = time.perf_counter()

        # Flatten image
        orig_shape = image.shape
        OG = image.flatten()
        MNO = len(OG)

        # 1. Select initial key parameters & 2. Iterate chaotic system to generate Xi, Yi, Zi, Wi
        t_start = time.perf_counter()
        Xi, Yi, Zi, Wi = self.seq_gen.get_hyperchaotic_seq(self.key['x0'], self.key['y0'], 
                                                    self.key['z0'], self.key['w0'], MNO)
        profiling['chaos'] += time.perf_counter() - t_start
        
        # 3. Convert Xi into integer sequence KX and XOR with OG (Eq 8, 10)
        t_start = time.perf_counter()
        KX = np.mod(np.floor(np.abs(Xi) * 10**12).astype(np.int64), 256).astype(np.uint8)
        SG = np.bitwise_xor(OG, KX)
        profiling['pixel_diffusion'] += time.perf_counter() - t_start

        # 4. Gather info to update initial parameters (Eq 11-16)
        PxInfo = float(np.sum(SG))
        
        # Binary representation of int(PxInfo)
        PxInfo_int = int(PxInfo)
        px_bin = [int(x) for x in bin(PxInfo_int)[2:]]
        
        # Create initial B array from Key['B'] and append PxInfo binary
        B_init = np.array(self.key['B'])
        Bu = np.append(B_init, px_bin)
        
        divisor = 256.0 * MNO
        x0_new = (self.key['x0'] + PxInfo / divisor) / 2.0
        y0_new = (self.key['y0'] + PxInfo / divisor) / 2.0
        z0_new = (self.key['z0'] + PxInfo / divisor) / 2.0
        w0_new = (self.key['w0'] + PxInfo / divisor) / 2.0

        # 5. Operate DTQWs using updated Bu to generate Q of length 4MNO (Eq 17)
        t_start = time.perf_counter()
        Q = self.seq_gen.get_qw_seq(Bu, 4 * MNO)
        profiling['quantum'] += time.perf_counter() - t_start
        
        # 6. Iterate chaotic system for 4MNO times with updated conditions
        t_start = time.perf_counter()
        X, Y, Z, W = self.seq_gen.get_hyperchaotic_seq(x0_new, y0_new, z0_new, w0_new, 4 * MNO)
        profiling['chaos'] += time.perf_counter() - t_start
        
        # 7. Integrate Q with X, Y, Z, W (Eq 18-21)
        t_start = time.perf_counter()
        QX = Q + X
        QY = Q + Y
        QZ = Q + Z
        QW = Q + W

        # 8. DNA Encoding of SG using Rule 1 (index 0) to get DOG
        base4_array = bytes_to_dna_bases(SG) # Shape (MNO, 4)
        DOG = base4_array.flatten()          # Length 4MNO
        rule1_array = np.zeros(4 * MNO, dtype=np.uint8)
        encoded_DOG = encode_dna(DOG, rule1_array)

        # 9. Nucleotide permutation using QX (Eq 22-24)
        PS = np.argsort(QX)
        DPGV = encoded_DOG[PS]

        # 11. Transform QY into K, encode with Rule 1 to get DK (Eq 25)
        # Assuming QY is taken up to MNO to form MNO bytes, then encoded to 4MNO bases
        K = np.mod(np.floor(np.abs(QY[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        K_base4 = bytes_to_dna_bases(K).flatten()
        DK = encode_dna(K_base4, rule1_array)

        # 12. Dynamic DNA operations OP (Eq 26)
        OP = np.mod(np.floor(np.abs(QZ) * 10**4).astype(np.int64), 4) + 1 # values 1, 2, 3, 4
        
        from dna_module.dna_core import execute_dynamic_dna_ops
        DSG = execute_dynamic_dna_ops(DPGV, DK, OP)

        # 14. Dynamic DNA decoding using QW (Eq 28-29)
        DR = np.mod(np.floor(np.abs(QW[:MNO]) * 10**6).astype(np.int64), 8) # rule index 0 to 7
        DR_large = np.repeat(DR, 4)
        decoded_DSG = decode_dna(DSG, DR_large)
        DM = dna_bases_to_bytes(decoded_DSG.reshape((MNO, 4)))
        profiling['dna_confusion'] += time.perf_counter() - t_start

        # 15. Pixel-level permutation using QY (Eq 30)
        t_start = time.perf_counter()
        QS = np.argsort(QY[:MNO])
        EMGV = DM[QS]

        # 16. Pixel substitution using QW (Eq 31-33)
        QK = np.mod(np.floor(np.abs(QW[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        EMSV = np.bitwise_xor(EMGV, QK)
        profiling['pixel_diffusion'] += time.perf_counter() - t_start
        profiling['total'] = time.perf_counter() - t_total

        return EMSV.reshape(orig_shape), PxInfo, profiling
