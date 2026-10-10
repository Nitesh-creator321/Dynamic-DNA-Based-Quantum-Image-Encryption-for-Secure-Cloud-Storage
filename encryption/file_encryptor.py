import numpy as np
import time
from dna_module.dna_core import (bytes_to_dna_bases, dna_bases_to_bytes, 
                       encode_dna, decode_dna, dna_add, dna_sub, dna_xor, dna_xnor)
from utils.sequence_generator import SequenceGenerator

class QuantumDNAFileEncryptor:
    def __init__(self, key):
        self.key = key
        self.seq_gen = SequenceGenerator(key)
        self.current_x0 = key['x0']
        self.current_y0 = key['y0']
        self.current_z0 = key['z0']
        self.current_w0 = key['w0']
        
        # PxInfo is accumulated to be returned at the end for the decryptor
        # For chunking, we will store a list of PxInfos
        self.px_infos = []

    def encrypt_chunk(self, chunk_bytes):
        # chunk_bytes is a 1D numpy array of uint8
        OG = chunk_bytes
        MNO = len(OG)
        if MNO == 0:
            return np.array([], dtype=np.uint8)

        # 1 & 2. Iterate chaotic system
        Xi, Yi, Zi, Wi = self.seq_gen.get_hyperchaotic_seq(self.current_x0, self.current_y0, 
                                                    self.current_z0, self.current_w0, MNO)
        
        # 3. Convert Xi into integer sequence KX and XOR with OG
        KX = np.mod(np.floor(np.abs(Xi) * 10**12).astype(np.int64), 256).astype(np.uint8)
        SG = np.bitwise_xor(OG, KX)

        # 4. Gather info to update initial parameters
        PxInfo = float(np.sum(SG))
        self.px_infos.append(PxInfo)
        
        PxInfo_int = int(PxInfo)
        px_bin = [int(x) for x in bin(PxInfo_int)[2:]]
        
        B_init = np.array(self.key['B'])
        Bu = np.append(B_init, px_bin)
        
        divisor = 256.0 * MNO
        x0_new = (self.current_x0 + PxInfo / divisor) / 2.0
        y0_new = (self.current_y0 + PxInfo / divisor) / 2.0
        z0_new = (self.current_z0 + PxInfo / divisor) / 2.0
        w0_new = (self.current_w0 + PxInfo / divisor) / 2.0

        # 5. Operate DTQWs
        Q = self.seq_gen.get_qw_seq(Bu, 4 * MNO)
        
        # 6. Iterate chaotic system for 4MNO times
        X, Y, Z, W = self.seq_gen.get_hyperchaotic_seq(x0_new, y0_new, z0_new, w0_new, 4 * MNO)
        
        # Save end states for the NEXT chunk
        self.current_x0 = X[-1]
        self.current_y0 = Y[-1]
        self.current_z0 = Z[-1]
        self.current_w0 = W[-1]
        
        # 7. Integrate Q with X, Y, Z, W
        QX = Q + X
        QY = Q + Y
        QZ = Q + Z
        QW = Q + W

        # 8. DNA Encoding
        base4_array = bytes_to_dna_bases(SG)
        DOG = base4_array.flatten()
        rule1_array = np.zeros(4 * MNO, dtype=np.uint8)
        encoded_DOG = encode_dna(DOG, rule1_array)

        # 9. Nucleotide permutation
        PS = np.argsort(QX)
        DPGV = encoded_DOG[PS]

        # 11. Transform QY into K, encode with Rule 1
        K = np.mod(np.floor(np.abs(QY[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        K_base4 = bytes_to_dna_bases(K).flatten()
        DK = encode_dna(K_base4, rule1_array)

        # 12. Dynamic DNA operations
        OP = np.mod(np.floor(np.abs(QZ) * 10**4).astype(np.int64), 4) + 1
        
        # 13. Execute substitution
        DSG = np.zeros(4 * MNO, dtype=np.uint8)
        mask_add = (OP == 1)
        mask_sub = (OP == 2)
        mask_xor = (OP == 3)
        mask_xnor = (OP == 4)
        
        DSG[mask_add] = dna_add(DPGV[mask_add], DK[mask_add])
        DSG[mask_sub] = dna_sub(DPGV[mask_sub], DK[mask_sub])
        DSG[mask_xor] = dna_xor(DPGV[mask_xor], DK[mask_xor])
        DSG[mask_xnor] = dna_xnor(DPGV[mask_xnor], DK[mask_xnor])

        # 14. Dynamic DNA decoding
        DR = np.mod(np.floor(np.abs(QW[:MNO]) * 10**6).astype(np.int64), 8)
        DR_large = np.repeat(DR, 4)
        decoded_DSG = decode_dna(DSG, DR_large)
        DM = dna_bases_to_bytes(decoded_DSG.reshape((MNO, 4)))

        # 15. Pixel-level permutation
        QS = np.argsort(QY[:MNO])
        EMGV = DM[QS]

        # 16. Pixel substitution
        QK = np.mod(np.floor(np.abs(QW[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        EMSV = np.bitwise_xor(EMGV, QK)

        import struct
        px_info_bytes = struct.pack('d', PxInfo)
        
        # Prepend 8 bytes of px_info to the encrypted chunk
        final_chunk = np.concatenate((np.frombuffer(px_info_bytes, dtype=np.uint8), EMSV))

        return final_chunk
