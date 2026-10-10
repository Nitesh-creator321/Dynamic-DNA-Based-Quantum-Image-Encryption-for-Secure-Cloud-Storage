import numpy as np
from dna_module.dna_core import (bytes_to_dna_bases, dna_bases_to_bytes, 
                       encode_dna, decode_dna, dna_add, dna_sub, dna_xor, dna_xnor)
from utils.sequence_generator import SequenceGenerator

class QuantumDNADecryptor:
    def __init__(self, key):
        self.key = key
        self.seq_gen = SequenceGenerator(key)

    def decrypt(self, encrypted_image, px_info):
        orig_shape = encrypted_image.shape
        EMSV = encrypted_image.flatten()
        MNO = len(EMSV)

        # 1. Update initial key parameters using the stored px_info (Eq 34-38)
        # Note: We need Xi to generate B_init. Since Xi is generated from initial keys, 
        # we can just regenerate it.
        Xi, Yi, Zi, Wi = self.seq_gen.get_hyperchaotic_seq(self.key['x0'], self.key['y0'], 
                                                    self.key['z0'], self.key['w0'], MNO)
        
        PxInfo = float(px_info)
        PxInfo_int = int(PxInfo)
        px_bin = [int(x) for x in bin(PxInfo_int)[2:]]
        
        B_init = np.array(self.key['B'])
        Bu = np.append(B_init, px_bin)

        divisor = 256.0 * MNO
        x0_new = (self.key['x0'] + PxInfo / divisor) / 2.0
        y0_new = (self.key['y0'] + PxInfo / divisor) / 2.0
        z0_new = (self.key['z0'] + PxInfo / divisor) / 2.0
        w0_new = (self.key['w0'] + PxInfo / divisor) / 2.0

        # 3. Operate DTQWs using Bu
        Q = self.seq_gen.get_qw_seq(Bu, 4 * MNO)
        
        # 4. Iterate chaotic system for 4MNO times
        X, Y, Z, W = self.seq_gen.get_hyperchaotic_seq(x0_new, y0_new, z0_new, w0_new, 4 * MNO)
        
        # 5. Integrate sequences
        QX = Q + X
        QY = Q + Y
        QZ = Q + Z
        QW = Q + W

        # 6. Reverse pixel substitution (Eq 31-32)
        QK = np.mod(np.floor(np.abs(QW[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        EMGV = np.bitwise_xor(EMSV, QK)

        # 15. Reverse pixel-level permutation using QY (Inverse of Eq 30)
        QS = np.argsort(QY[:MNO])
        inv_QS = np.empty_like(QS)
        inv_QS[QS] = np.arange(MNO)
        DM = EMGV[inv_QS]

        # 14. Reverse Dynamic DNA Decoding using QW (Inverse of Eq 28-29)
        # We need to ENCODE DM using the decoding rules to get DSG back.
        DR = np.mod(np.floor(np.abs(QW[:MNO]) * 10**6).astype(np.int64), 8) # rule index 0 to 7
        DR_large = np.repeat(DR, 4)
        DM_base4 = bytes_to_dna_bases(DM).flatten()
        DSG = encode_dna(DM_base4, DR_large)

        # Prepare for reversing operations
        K = np.mod(np.floor(np.abs(QY[:MNO]) * 10**14).astype(np.int64), 256).astype(np.uint8)
        K_base4 = bytes_to_dna_bases(K).flatten()
        rule1_array = np.zeros(4 * MNO, dtype=np.uint8)
        DK = encode_dna(K_base4, rule1_array)

        OP = np.mod(np.floor(np.abs(QZ) * 10**4).astype(np.int64), 4) + 1 # values 1, 2, 3, 4
        from dna_module.dna_core import execute_inverse_dynamic_dna_ops
        DPGV = execute_inverse_dynamic_dna_ops(DSG, DK, OP)

        # 9. Reverse Nucleotide permutation using QX (Inverse of Eq 22-24)
        PS = np.argsort(QX)
        inv_PS = np.empty_like(PS)
        inv_PS[PS] = np.arange(4 * MNO)
        encoded_DOG = DPGV[inv_PS]

        # 8. Reverse DNA Encoding (Decode using Rule 1)
        DOG = decode_dna(encoded_DOG, rule1_array)
        SG = dna_bases_to_bytes(DOG.reshape((MNO, 4)))

        # 3. Reverse Initial Chaotic Substitution (Inverse of Eq 8, 10)
        KX = np.mod(np.floor(np.abs(Xi) * 10**12).astype(np.int64), 256).astype(np.uint8)
        OG = np.bitwise_xor(SG, KX)

        return OG.reshape(orig_shape)
