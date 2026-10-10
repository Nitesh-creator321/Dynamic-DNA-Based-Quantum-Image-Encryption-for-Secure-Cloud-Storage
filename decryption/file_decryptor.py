import struct
import numpy as np
from dna_module.dna_core import (bytes_to_dna_bases, dna_bases_to_bytes, 
                       encode_dna, decode_dna, dna_add, dna_sub, dna_xor, dna_xnor)
from utils.sequence_generator import SequenceGenerator

class QuantumDNAFileDecryptor:
    def __init__(self, key):
        self.key = key
        self.seq_gen = SequenceGenerator(key)
        self.current_x0 = key['x0']
        self.current_y0 = key['y0']
        self.current_z0 = key['z0']
        self.current_w0 = key['w0']

    def decrypt_chunk(self, chunk_bytes):
        if len(chunk_bytes) <= 8:
            return np.array([], dtype=np.uint8)
            
        # Extract the 8-byte PxInfo
        px_info_bytes = bytes(chunk_bytes[:8])
        PxInfo = struct.unpack('d', px_info_bytes)[0]
        
        # The rest is the encrypted data
        EMSV = chunk_bytes[8:]
        MNO = len(EMSV)

        # 1. Regenerate initial chaotic sequence
        Xi, Yi, Zi, Wi = self.seq_gen.get_hyperchaotic_seq(self.current_x0, self.current_y0, 
                                                    self.current_z0, self.current_w0, MNO)
        
        PxInfo_int = int(PxInfo)
        px_bin = [int(x) for x in bin(PxInfo_int)[2:]]
        
        B_init = np.array(self.key['B'])
        Bu = np.append(B_init, px_bin)

        divisor = 256.0 * MNO
        x0_new = (self.current_x0 + PxInfo / divisor) / 2.0
        y0_new = (self.current_y0 + PxInfo / divisor) / 2.0
        z0_new = (self.current_z0 + PxInfo / divisor) / 2.0
        w0_new = (self.current_w0 + PxInfo / divisor) / 2.0

        # 3. Operate DTQWs
        Q = self.seq_gen.get_qw_seq(Bu, 4 * MNO)
        
        # 4. Iterate chaotic system for 4MNO times
        X, Y, Z, W = self.seq_gen.get_hyperchaotic_seq(x0_new, y0_new, z0_new, w0_new, 4 * MNO)
        
        # Save end states for the NEXT chunk
        self.current_x0 = X[-1]
        self.current_y0 = Y[-1]
        self.current_z0 = Z[-1]
        self.current_w0 = W[-1]
        
        # 5. Integrate sequences
        QX = Q + X
        QY = Q + Y
        QZ = Q + Z
        QW = Q + W

        # 6. Reverse pixel substitution
        QK = np.mod(np.floor(np.abs(QW[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        EMGV = np.bitwise_xor(EMSV, QK)

        # 15. Reverse pixel-level permutation
        QS = np.argsort(QY[:MNO])
        inv_QS = np.empty_like(QS)
        inv_QS[QS] = np.arange(MNO)
        DM = EMGV[inv_QS]

        # 14. Reverse Dynamic DNA Decoding
        DR = np.mod(np.floor(np.abs(QW[:MNO]) * 10**6).astype(np.int64), 8)
        DR_large = np.repeat(DR, 4)
        DM_base4 = bytes_to_dna_bases(DM).flatten()
        DSG = encode_dna(DM_base4, DR_large)

        # Prepare for reversing operations
        K = np.mod(np.floor(np.abs(QY[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        K_base4 = bytes_to_dna_bases(K).flatten()
        rule1_array = np.zeros(4 * MNO, dtype=np.uint8)
        DK = encode_dna(K_base4, rule1_array)

        OP = np.mod(np.floor(np.abs(QZ) * 10**4).astype(np.int64), 4) + 1
        mask_add = (OP == 1)
        mask_sub = (OP == 2)
        mask_xor = (OP == 3)
        mask_xnor = (OP == 4)

        # 13. Reverse Dynamic DNA operations
        DPGV = np.zeros(4 * MNO, dtype=np.uint8)
        DPGV[mask_add] = dna_sub(DSG[mask_add], DK[mask_add])
        DPGV[mask_sub] = dna_add(DSG[mask_sub], DK[mask_sub])
        DPGV[mask_xor] = dna_xor(DSG[mask_xor], DK[mask_xor])
        DPGV[mask_xnor] = dna_xnor(DSG[mask_xnor], DK[mask_xnor])

        # 9. Reverse Nucleotide permutation
        PS = np.argsort(QX)
        inv_PS = np.empty_like(PS)
        inv_PS[PS] = np.arange(4 * MNO)
        encoded_DOG = DPGV[inv_PS]

        # 8. Reverse DNA Encoding
        DOG = decode_dna(encoded_DOG, rule1_array)
        SG = dna_bases_to_bytes(DOG.reshape((MNO, 4)))

        # 3. Reverse Initial Chaotic Substitution
        KX = np.mod(np.floor(np.abs(Xi) * 10**12).astype(np.int64), 256).astype(np.uint8)
        OG = np.bitwise_xor(SG, KX)

        return OG
