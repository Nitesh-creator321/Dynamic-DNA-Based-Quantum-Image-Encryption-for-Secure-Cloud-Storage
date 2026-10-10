import numpy as np
from chaotic_system.hyperchaos import HyperchaoticSystem
from quantum_walk.quantum_walk import QuantumWalk

class SequenceGenerator:
    def __init__(self, key):
        self.key = key

    def get_hyperchaotic_seq(self, x0, y0, z0, w0, length):
        hc = HyperchaoticSystem(self.key['a'], self.key['b'], self.key['c'], self.key['d'])
        return hc.generate_sequences(x0, y0, z0, w0, length)

    def get_qw_seq(self, B_string, length):
        # According to the new logic, T is the grid size (T_nodes) and t is the number of steps (t_steps)
        qw = QuantumWalk(t_steps=self.key.get('t', 100), T_nodes=self.key['T'])
        prob = qw.generate_distribution(B_string, self.key['sigma_0'], self.key['sigma_1'], self.key.get('sigma_2', 0.0))
        prob_scaled = (prob - np.min(prob)) / (np.max(prob) - np.min(prob) + 1e-10)
        
        if len(prob_scaled) >= length:
            return prob_scaled[:length]
        else:
            repeats = int(np.ceil(length / len(prob_scaled)))
            return np.tile(prob_scaled, repeats)[:length]
