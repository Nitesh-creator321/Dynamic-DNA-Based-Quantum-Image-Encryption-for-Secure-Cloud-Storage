import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from chaotic_system.hyperchaos import HyperchaoticSystem

hc = HyperchaoticSystem()

X1, _, _, _ = hc.generate_sequences(0.123456789, -0.456789123, 0.789123456, -0.123789456, 10, drop_initial=1000)
X2, _, _, _ = hc.generate_sequences(0.123656789, -0.456789123, 0.789123456, -0.123789456, 10, drop_initial=1000)

print("X1:", X1)
print("X2:", X2)
print("Difference:", X1 - X2)
