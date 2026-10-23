import numpy as np
from numba import njit

@njit(fastmath=True)
def _generate_distribution_jit(B_string, sigma_0, sigma_1, sigma_2, t_steps, T_nodes):
    cos_s0, sin_s0 = np.cos(sigma_0), np.sin(sigma_0)
    cos_s1, sin_s1 = np.cos(sigma_1), np.sin(sigma_1)
    cos_s2, sin_s2 = np.cos(sigma_2), np.sin(sigma_2)

    state_0 = np.zeros(T_nodes, dtype=np.complex128)
    state_1 = np.zeros(T_nodes, dtype=np.complex128)

    mid = T_nodes // 2
    state_0[mid] = 1.0 / np.sqrt(2.0)
    state_1[mid] = 1j / np.sqrt(2.0)

    B_len = len(B_string)
    for step in range(t_steps):
        if step < B_len:
            if B_string[step] == 0:
                c, s = cos_s0, sin_s0
            else:
                c, s = cos_s1, sin_s1
        else:
            c, s = cos_s2, sin_s2

        new_state_0 = c * state_0 + s * state_1
        new_state_1 = s * state_0 - c * state_1

        temp0 = new_state_0[-1]
        for i in range(T_nodes - 1, 0, -1):
            state_0[i] = new_state_0[i - 1]
        state_0[0] = temp0

        temp1 = new_state_1[0]
        for i in range(T_nodes - 1):
            state_1[i] = new_state_1[i + 1]
        state_1[-1] = temp1

    prob = np.abs(state_0)**2 + np.abs(state_1)**2
    return prob.astype(np.float32)

class QuantumWalk:
    def __init__(self, t_steps=100, T_nodes=201):
        self.t_steps = t_steps
        self.T_nodes = T_nodes if (T_nodes % 2 != 0) else T_nodes + 1

    def generate_distribution(self, B_string, sigma_0, sigma_1, sigma_2=0.0):
        B_array = np.array(B_string, dtype=np.int32)
        return _generate_distribution_jit(B_array, sigma_0, sigma_1, sigma_2, self.t_steps, self.T_nodes)
