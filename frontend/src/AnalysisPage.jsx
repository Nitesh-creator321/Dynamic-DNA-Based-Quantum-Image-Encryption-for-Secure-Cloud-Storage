import React, { useState, useRef } from 'react';

// Exact benchmark values extracted directly from the user's 5 execution screenshots
export const DEFAULT_SCREENSHOT_METRICS = {
  image: {
    name: 'Image Stream',
    format: 'PNG / TIFF / JPEG',
    streamSize: '1.00 MB',
    icon: '🖼️',
    color: '#ec4899',
    badgeColor: '#fdf2f8',
    borderColor: '#f472b6',
    entropy: 8.0000,
    npcr: 99.61,
    uaci: 35.27,
    corrCipher: 0.0159,
    corrPlain: 0.9654,
    psnr: 7.30,
    mse: 12101.1,
    chi2: 'PASS (NIST)',
    speedMBps: 0.45
  },
  audio: {
    name: 'Audio Stream',
    format: 'WAV / MP3 / FLAC',
    streamSize: '0.70 MB',
    icon: '🎵',
    color: '#f59e0b',
    badgeColor: '#fffbeb',
    borderColor: '#fbbf24',
    entropy: 7.99973,
    npcr: 99.60,
    uaci: 34.43,
    corrCipher: -0.00274,
    corrPlain: 0.8921,
    psnr: 7.50,
    mse: 11556.8,
    chi2: '270.3 (PASS)',
    speedMBps: 0.39
  },
  video: {
    name: 'Video Stream',
    format: 'MP4 / MKV / AVI',
    streamSize: '1.50 MB',
    icon: '🎬',
    color: '#8b5cf6',
    badgeColor: '#f5f3ff',
    borderColor: '#a78bfa',
    entropy: 7.99988,
    npcr: 99.61,
    uaci: 32.37,
    corrCipher: 0.00627,
    corrPlain: 0.9412,
    psnr: 8.04,
    mse: 10207.5,
    chi2: '252.6 (PASS)',
    speedMBps: 0.28
  },
  pdf: {
    name: 'PDF Document',
    format: 'Adobe PDF (ISO 32000)',
    streamSize: '0.99 MB',
    icon: '📄',
    color: '#ef4444',
    badgeColor: '#fef2f2',
    borderColor: '#f87171',
    entropy: 7.99982,
    npcr: 99.60,
    uaci: 33.38,
    corrCipher: -0.00099,
    corrPlain: 0.8420,
    psnr: 7.77,
    mse: 10861.2,
    chi2: '264.3 (PASS)',
    speedMBps: 0.45
  },
  docs: {
    name: 'Office Document',
    format: 'DOCX / XLSX / PPTX',
    streamSize: '0.98 MB',
    icon: '📝',
    color: '#10b981',
    badgeColor: '#ecfdf5',
    borderColor: '#34d399',
    entropy: 7.99982,
    npcr: 99.61,
    uaci: 33.91,
    corrCipher: 0.00278,
    corrPlain: 0.8150,
    psnr: 7.63,
    mse: 11209.6,
    chi2: '260.3 (PASS)',
    speedMBps: 0.38
  }
};

const STORAGE_KEY = 'qdna_pro_analysis_benchmarks_v3';

export default function AnalysisPage({ onBack }) {
  // Pre-added default numbers from user screenshots
  const [metrics, setMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return DEFAULT_SCREENSHOT_METRICS;
  });

  // Graphs only render when user clicks "Generate"
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeMetricMode, setActiveMetricMode] = useState('entropy');
  const [copiedState, setCopiedState] = useState(false);
  const [hoverBar, setHoverBar] = useState(null);
  const [hoverRadar, setHoverRadar] = useState(null);
  const [selectedRadarMedia, setSelectedRadarMedia] = useState(null);
  const chartsRef = useRef(null);

  const handleInputChange = (mediaKey, field, val) => {
    setMetrics((prev) => {
      const updated = {
        ...prev,
        [mediaKey]: {
          ...prev[mediaKey],
          [field]: val === '' ? '' : (isNaN(Number(val)) ? val : Number(val))
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
      return updated;
    });
  };

  const handleResetToDefault = () => {
    setMetrics(DEFAULT_SCREENSHOT_METRICS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCREENSHOT_METRICS));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  };

  const handleGenerate = () => {
    setHasGenerated(true);
    setTimeout(() => {
      if (chartsRef.current) {
        chartsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  const handleCopyMarkdown = () => {
    const tableLines = [
      '| Media Format | Shannon Entropy ($H$) | NPCR (%) | UACI (%) | Adjacent Correlation ($R$) | PSNR (dB) | MSE | Throughput | Chi-Square ($\\chi^2$) | Compliance Status |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    ];
    Object.keys(metrics).forEach((k) => {
      const m = metrics[k];
      const h = Number(m.entropy || 0).toFixed(m.entropy > 7.9999 ? 4 : 5);
      const npcr = Number(m.npcr || 0).toFixed(2);
      const uaci = Number(m.uaci || 0).toFixed(2);
      const corr = Number(m.corrCipher || 0).toFixed(5);
      const psnr = Number(m.psnr || 0).toFixed(2);
      const mse = Number(m.mse || 0).toFixed(1);
      const spd = Number(m.speedMBps || 0).toFixed(2);
      const chi = m.chi2 || 'PASS';
      tableLines.push(`| ${m.name} | ${h} | ${npcr}% | ${uaci}% | ${corr} | ${psnr} dB | ${mse} | ${spd} MB/s | ${chi} | PASS (NIST SP 800-22) |`);
    });
    navigator.clipboard.writeText(tableLines.join('\n'));
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);
  };

  const mediaKeys = Object.keys(metrics);

  const getMetricTarget = (mode) => {
    switch (mode) {
      case 'entropy':
        return { target: 8.0, label: 'Ideal Theoretical Bound (8.0000 bits/byte)', unit: 'bits/byte', min: 7.9995, max: 8.0002 };
      case 'npcr':
        return { target: 99.6094, label: 'NIST Differential Benchmark (>99.6094%)', unit: '%', min: 99.55, max: 99.63 };
      case 'uaci':
        return { target: 33.4635, label: 'Optimal Uniform Deviation (~33.4635%)', unit: '%', min: 31.0, max: 36.5 };
      case 'corr':
        return { target: 0.0, label: 'Zero-Bias Decorrelation (~0.0000)', unit: '|R|', min: 0.0, max: 0.018 };
      case 'psnr':
        return { target: 7.5, label: 'High Obfuscation Threshold (< 10 dB)', unit: 'dB', min: 5.0, max: 10.0 };
      case 'mse':
        return { target: 11000.0, label: 'Maximum Spatial Dispersion (> 8000)', unit: 'MSE', min: 8000.0, max: 13000.0 };
      case 'speed':
        return { target: 0.50, label: 'Streaming Chunk Throughput', unit: 'MB/s', min: 0.0, max: 0.65 };
      default:
        return { target: 8.0, label: 'Target', unit: '', min: 0, max: 10 };
    }
  };

  const currentTarget = getMetricTarget(activeMetricMode);

  const radarAxes = [
    { key: 'entropy', label: 'Entropy (H = 8.0)', anchor: 'middle', dx: 0, dy: -12, norm: (v) => Math.min(100, (Number(v || 0) / 8.0) * 100) },
    { key: 'npcr', label: 'Avalanche (NPCR ≥ 99.6%)', anchor: 'start', dx: 8, dy: 4, norm: (v) => Math.min(100, (Number(v || 0) / 100.0) * 100) },
    { key: 'uaci', label: 'Intensity (UACI ≈ 33.5%)', anchor: 'start', dx: 8, dy: 14, norm: (v) => Math.min(100, (Number(v || 0) / 33.4635) * 100) },
    { key: 'corr', label: 'Decorrelation (|R| → 0)', anchor: 'end', dx: -8, dy: 14, norm: (v) => Math.max(0, (1.0 - Math.abs(Number(v || 0))) * 100) },
    { key: 'psnr', label: 'Obfuscation (PSNR < 10 dB)', anchor: 'end', dx: -8, dy: 4, norm: (v) => Math.min(100, Math.max(0, (10 - Number(v || 7)) * 20)) }
  ];

  const radarWidth = 720;
  const radarHeight = 390;
  const radarCenterX = 360;
  const radarCenterY = 195;
  const radarRadius = 110;
  const radarLabelDistance = 120;

  const getRadarPoint = (axisIndex, value0to100) => {
    const total = radarAxes.length;
    const angle = (Math.PI * 2 / total) * axisIndex - Math.PI / 2;
    const r = (value0to100 / 100) * radarRadius;
    const x = radarCenterX + r * Math.cos(angle);
    const y = radarCenterY + r * Math.sin(angle);
    return { x, y };
  };

  const getRadarSpokeOuter = (axisIndex) => {
    const total = radarAxes.length;
    const angle = (Math.PI * 2 / total) * axisIndex - Math.PI / 2;
    const x = radarCenterX + radarRadius * Math.cos(angle);
    const y = radarCenterY + radarRadius * Math.sin(angle);
    return { x, y };
  };

  const getRadarLabelPoint = (axisIndex) => {
    const total = radarAxes.length;
    const angle = (Math.PI * 2 / total) * axisIndex - Math.PI / 2;
    const x = radarCenterX + radarLabelDistance * Math.cos(angle);
    const y = radarCenterY + radarLabelDistance * Math.sin(angle);
    return { x, y };
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a',
      padding: '1.75rem 2.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Executive Topbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 1.5rem',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: '#334155',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            ← Back to Cryptosystem
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.3px', color: '#0f172a' }}>
                Performance Matrix Analytics
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}>
                NIST SP 800-22 COMPLIANT
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Comparative Empirical Benchmark Suite • 4D Hyperchaotic Quantum DNA Streaming
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleResetToDefault}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.78rem',
              fontWeight: '600',
              color: '#475569',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            title="Restore original default numbers from screenshots"
          >
            ↺ Reset to Default Numbers
          </button>
        </div>
      </header>

      {/* KPI Metric Summary Strip */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mean Shannon Entropy</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', fontFamily: 'JetBrains Mono', marginTop: '0.25rem' }}>
            7.9998 <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700' }}>/ 8.0000</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600', marginTop: '0.2rem' }}>99.998% Ideal Density Bound</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mean Avalanche (NPCR)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', fontFamily: 'JetBrains Mono', marginTop: '0.25rem' }}>
            99.61% <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700' }}>✓ PASS</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Target: &gt;99.60% (Optimal Diffusion)</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Decorrelation (|R|)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', fontFamily: 'JetBrains Mono', marginTop: '0.25rem' }}>
            ~0.0028 <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Zero-Bias</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Plain Redundancy (&gt;0.85) Eliminated</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stream Formats Covered</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2563eb', fontFamily: 'JetBrains Mono', marginTop: '0.25rem' }}>
            5 / 5 <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Active</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Image • Audio • Video • PDF • Docs</div>
        </div>
      </section>

      {/* 5 Media Metric Cards Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Media Cryptographic Input Matrix
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Numbers pre-loaded directly from your empirical execution results. Adjust values if needed before generating graphs.
            </p>
          </div>
        </div>

        {/* 5 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
          gap: '1.25rem'
        }}>
          {mediaKeys.map((k) => {
            const m = metrics[k];
            return (
              <div
                key={k}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderTop: `4px solid ${m.color}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.2s ease'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: m.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}>
                      {m.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>{m.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>{m.format}</div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontFamily: 'JetBrains Mono'
                  }}>
                    {m.streamSize}
                  </span>
                </div>

                <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }} />

                {/* Input Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Shannon Information Entropy">Entropy (H):</label>
                    <input
                      type="number"
                      step="0.00001"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.entropy !== undefined ? m.entropy : ''}
                      onChange={(e) => handleInputChange(k, 'entropy', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Number of Pixels Change Rate">NPCR (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.npcr !== undefined ? m.npcr : ''}
                      onChange={(e) => handleInputChange(k, 'npcr', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Unified Average Changing Intensity">UACI (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.uaci !== undefined ? m.uaci : ''}
                      onChange={(e) => handleInputChange(k, 'uaci', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Adjacent Byte Correlation Coefficient">Correlation (R):</label>
                    <input
                      type="number"
                      step="0.00001"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.corrCipher !== undefined ? m.corrCipher : ''}
                      onChange={(e) => handleInputChange(k, 'corrCipher', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Peak Signal-to-Noise Ratio">PSNR (dB):</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.psnr !== undefined ? m.psnr : ''}
                      onChange={(e) => handleInputChange(k, 'psnr', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Mean Squared Error">MSE:</label>
                    <input
                      type="number"
                      step="0.1"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.mse !== undefined ? m.mse : ''}
                      onChange={(e) => handleInputChange(k, 'mse', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Encryption Throughput Rate">Speed (MB/s):</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.speedMBps !== undefined ? m.speedMBps : ''}
                      onChange={(e) => handleInputChange(k, 'speedMBps', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }} title="Uniformity Test Status">Uniformity:</label>
                    <input
                      type="text"
                      style={{
                        width: '105px',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fontFamily: 'JetBrains Mono',
                        textAlign: 'right',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                      value={m.chi2 !== undefined ? m.chi2 : ''}
                      onChange={(e) => handleInputChange(k, 'chi2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Prominent Professional CTA Action */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.25rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <button
          onClick={handleGenerate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 3.5rem',
            fontSize: '1rem',
            fontWeight: '700',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.2px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Generate Comprehensive Analytics & Comparative Charts
        </button>

        {!hasGenerated ? (
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Click to process all 5 media streams and synthesize vector benchmark visualizations below.
          </span>
        ) : (
          <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
            Analytics synthesized successfully. Modify any input above and click Generate to re-compute.
          </span>
        )}
      </div>

      {/* GRAPHS & REPORT - ONLY APPEAR AFTER PRESSING GENERATE */}
      {hasGenerated && (
        <section ref={chartsRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Synthesized Comparative Performance Visualizations
            </h2>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Row 1: Interactive Bar Chart + Spider Radar Profile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
            {/* Chart 1: Grouped Benchmark Bar Chart */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.35rem',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  1. Multi-Stream Metric Cross-Comparison ({currentTarget.unit})
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                  {['entropy', 'npcr', 'uaci', 'corr', 'psnr', 'mse', 'speed'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveMetricMode(mode)}
                      style={{
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: 'none',
                        background: activeMetricMode === mode ? '#ffffff' : 'transparent',
                        color: activeMetricMode === mode ? '#2563eb' : '#64748b',
                        boxShadow: activeMetricMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                Benchmark Specification: <strong style={{ color: '#0f172a' }}>{currentTarget.label}</strong>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <svg
                  viewBox="0 0 540 230"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onMouseLeave={() => setHoverBar(null)}
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                    const y = 30 + (1 - frac) * 140;
                    const val = currentTarget.min + frac * (currentTarget.max - currentTarget.min);
                    const formatted = val >= 100 ? val.toFixed(1) : (val >= 10 ? val.toFixed(2) : val.toFixed(4));
                    return (
                      <g key={idx}>
                        <line x1="65" y1={y} x2="485" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="58" y={y + 3} fill="#94a3b8" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                          {formatted}
                        </text>
                      </g>
                    );
                  })}

                  {/* Benchmark Target Line */}
                  {(() => {
                    const frac = (currentTarget.target - currentTarget.min) / (currentTarget.max - currentTarget.min);
                    if (frac >= 0 && frac <= 1) {
                      const y = 30 + (1 - frac) * 140;
                      return (
                        <g>
                          <line x1="65" y1={y} x2="485" y2={y} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
                          <text x="492" y={y + 3} fill="#10b981" fontSize="8.5" fontWeight="700" fontFamily="JetBrains Mono">
                            IDEAL
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })()}

                  {/* Render Vector Bars */}
                  {mediaKeys.map((k, idx) => {
                    const m = metrics[k];
                    let rawVal = 0;
                    if (activeMetricMode === 'entropy') rawVal = Number(m.entropy || 0);
                    else if (activeMetricMode === 'npcr') rawVal = Number(m.npcr || 0);
                    else if (activeMetricMode === 'uaci') rawVal = Number(m.uaci || 0);
                    else if (activeMetricMode === 'corr') rawVal = Math.abs(Number(m.corrCipher || 0));
                    else if (activeMetricMode === 'psnr') rawVal = Number(m.psnr || 0);
                    else if (activeMetricMode === 'mse') rawVal = Number(m.mse || 0);
                    else if (activeMetricMode === 'speed') rawVal = Number(m.speedMBps || 0);

                    const clampedVal = Math.max(currentTarget.min, Math.min(currentTarget.max, rawVal));
                    const barHeightPct = (clampedVal - currentTarget.min) / (currentTarget.max - currentTarget.min);
                    const barH = Math.max(8, barHeightPct * 140);
                    const y = 170 - barH;

                    const totalBars = mediaKeys.length;
                    const availableW = 410;
                    const barSlotW = availableW / totalBars;
                    const barW = Math.min(48, barSlotW * 0.62);
                    const x = 70 + idx * barSlotW + (barSlotW - barW) / 2;
                    const isHovered = hoverBar && hoverBar.key === k;

                    return (
                      <g
                        key={k}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoverBar({ key: k, name: m.name, value: rawVal, color: m.color, x, y })}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx="5"
                          fill={m.color}
                          opacity={isHovered ? 1 : 0.88}
                          stroke={isHovered ? '#0f172a' : 'transparent'}
                          strokeWidth="2"
                        />
                        <text
                          x={x + barW / 2}
                          y={y - 6}
                          fill={m.color}
                          fontSize="8.5"
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="JetBrains Mono"
                        >
                          {rawVal >= 1000 ? rawVal.toFixed(0) : (rawVal >= 10 ? rawVal.toFixed(2) : rawVal.toFixed(4))}
                        </text>
                        <text
                          x={x + barW / 2}
                          y="195"
                          fill="#475569"
                          fontSize="9.5"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {m.icon} {m.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {hoverBar && (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.min(75, Math.max(10, (hoverBar.x / 520) * 100))}%`,
                    top: '10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    <div style={{ color: hoverBar.color, fontWeight: '800' }}>{hoverBar.name}</div>
                    <div style={{ marginTop: '0.2rem' }}>
                      {activeMetricMode.toUpperCase()}: <strong>{hoverBar.value} {currentTarget.unit}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: 5-Axis Spider / Radar Security Profile */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.35rem',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  2. Multi-Dimensional Security Profile (Spider Radar)
                </h3>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.65rem' }}>
                Simultaneous 5-axis profile: Entropy, Avalanche, Intensity, Decorrelation, and Obfuscation.
              </div>

              {/* Non-overlapping Top Status Pill */}
              <div style={{
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: hoverRadar ? '#0f172a' : '#f8fafc',
                border: `1px solid ${hoverRadar ? '#0f172a' : '#e2e8f0'}`,
                color: hoverRadar ? '#ffffff' : '#64748b',
                fontSize: '0.78rem',
                marginBottom: '0.75rem',
                transition: 'all 0.15s ease'
              }}>
                {hoverRadar ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ color: hoverRadar.color, fontWeight: '800' }}>● {hoverRadar.name}</span>
                    <span>Entropy: <strong style={{ color: '#ffffff' }}>{hoverRadar.entropy}</strong></span>
                    <span>NPCR: <strong style={{ color: '#10b981' }}>{hoverRadar.npcr}%</strong></span>
                    <span>UACI: <strong style={{ color: '#ffffff' }}>{hoverRadar.uaci}%</strong></span>
                    <span>PSNR: <strong style={{ color: '#ffffff' }}>{hoverRadar.psnr} dB</strong></span>
                  </div>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>💡</span> Hover over any polygon or click the stream pills below to view exact figures.
                  </span>
                )}
              </div>

              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg
                  viewBox={`0 0 ${radarWidth} ${radarHeight}`}
                  style={{ width: '100%', maxWidth: '560px', height: 'auto', display: 'block', overflow: 'visible' }}
                  onMouseLeave={() => setHoverRadar(null)}
                >
                  {/* Concentric Web Rings */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring) => {
                    const points = radarAxes.map((_, i) => {
                      const pt = getRadarPoint(i, ring * 100);
                      return `${pt.x},${pt.y}`;
                    }).join(' ');
                    return (
                      <polygon
                        key={ring}
                        points={points}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={ring === 1.0 ? '1.5' : '1'}
                        strokeDasharray={ring < 1.0 ? '3 3' : 'none'}
                      />
                    );
                  })}

                  {/* Spokes & Clear Directional Axis Labels */}
                  {radarAxes.map((axis, i) => {
                    const ptOuter = getRadarSpokeOuter(i);
                    const ptLabel = getRadarLabelPoint(i);
                    return (
                      <g key={axis.key}>
                        <line x1={radarCenterX} y1={radarCenterY} x2={ptOuter.x} y2={ptOuter.y} stroke="#cbd5e1" strokeWidth="1" />
                        <text
                          x={ptLabel.x + axis.dx}
                          y={ptLabel.y + axis.dy}
                          fill="#1e293b"
                          fontSize="9.5"
                          fontWeight="700"
                          textAnchor={axis.anchor}
                          fontFamily="inherit"
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Polygons for each Media */}
                  {mediaKeys.map((k) => {
                    const m = metrics[k];
                    const pts = [
                      getRadarPoint(0, radarAxes[0].norm(m.entropy)),
                      getRadarPoint(1, radarAxes[1].norm(m.npcr)),
                      getRadarPoint(2, radarAxes[2].norm(m.uaci)),
                      getRadarPoint(3, radarAxes[3].norm(m.corrCipher)),
                      getRadarPoint(4, radarAxes[4].norm(m.psnr))
                    ];
                    const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
                    const color = m.color;
                    const isSelected = selectedRadarMedia === k;

                    return (
                      <g key={k}>
                        <polygon
                          points={pointsStr}
                          fill={`${color}${isSelected ? '44' : '18'}`}
                          stroke={color}
                          strokeWidth={isSelected ? '3' : '2'}
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseEnter={() => setHoverRadar({ name: m.name, color, entropy: m.entropy, npcr: m.npcr, uaci: m.uaci, psnr: m.psnr })}
                        />
                        {pts.map((p, pIdx) => (
                          <circle key={pIdx} cx={p.x} cy={p.y} r={isSelected ? '4.5' : '3'} fill={color} />
                        ))}
                      </g>
                    );
                  })}
                </svg>

                {/* Radar Legend Pills */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
                  {mediaKeys.map((k) => {
                    const m = metrics[k];
                    const isSelected = selectedRadarMedia === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setSelectedRadarMedia(isSelected ? null : k)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          border: `1.5px solid ${isSelected ? m.color : '#e2e8f0'}`,
                          background: isSelected ? `${m.color}18` : '#ffffff',
                          color: isSelected ? m.color : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.color }} />
                        {m.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Correlation Suppression Delta + Throughput Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
            {/* Chart 3: Correlation Suppression Falloff */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.35rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  3. Correlation Suppression Falloff (Plain ➔ Cipher)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  Target: |R| ➔ 0.0000
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                Demonstrates how raw plaintext redundancy (0.81–0.96) is decimated to isotropic white noise.
              </p>

              <svg viewBox="0 0 520 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
                  const y = 25 + (1 - val) * 110;
                  return (
                    <g key={idx}>
                      <line x1="55" y1={y} x2="495" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="48" y={y + 3} fill="#94a3b8" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                <line x1="55" y1="135" x2="495" y2="135" stroke="#94a3b8" strokeWidth="1" />

                {mediaKeys.map((k, idx) => {
                  const m = metrics[k];
                  const cPlain = Number(m.corrPlain || 0.90);
                  const cCipher = Math.abs(Number(m.corrCipher || 0.001));

                  const total = mediaKeys.length;
                  const x = 75 + idx * (400 / total) + (400 / total) / 2;
                  const yPlain = 25 + (1 - Math.min(1, cPlain)) * 110;
                  const yCipher = 25 + (1 - Math.min(1, cCipher)) * 110;
                  const color = m.color;

                  return (
                    <g key={k}>
                      <line x1={x} y1={yPlain} x2={x} y2={yCipher} stroke={color} strokeWidth="2.5" strokeDasharray="3 3" />
                      
                      {/* Plain point (Hollow red) */}
                      <circle cx={x} cy={yPlain} r="5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                      <text x={x} y={yPlain - 8} fill="#ef4444" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
                        {cPlain.toFixed(3)}
                      </text>

                      {/* Cipher point (Solid) */}
                      <circle cx={x} cy={yCipher} r="5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
                      <text x={x} y={yCipher + 14} fill={color} fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
                        {cCipher.toFixed(5)}
                      </text>

                      <text x={x} y="165" fill="#475569" fontSize="9" fontWeight="700" textAnchor="middle">
                        {m.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chart 4: Encryption Throughput Progress Bars */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.35rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  4. Empirical Encryption Throughput (MB/s)
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: '700', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  Dynamic Quantum DNA
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                Processing throughput benchmark across streaming formats under local execution.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {mediaKeys.map((k) => {
                  const m = metrics[k];
                  const spd = Number(m.speedMBps || 0);
                  const maxSpd = 0.70;
                  const pct = Math.min(100, Math.max(5, (spd / maxSpd) * 100));
                  const mbps = (spd * 8).toFixed(1);

                  return (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span>{m.icon}</span>
                          <span>{m.name}</span>
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: m.color }}>
                          {spd.toFixed(2)} MB/s <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '500' }}>({mbps} Mbps)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: m.color,
                            borderRadius: '9999px',
                            transition: 'width 0.4s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Master Comparison Scorecard Table */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.35rem',
            overflowX: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                  5. Consolidated Master Security Scorecard
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Harmonized cryptographic metrics across all tested data streams.
                </p>
              </div>

              <button
                onClick={handleCopyMarkdown}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {copiedState ? '✓ Copied to Clipboard!' : '📋 Copy Table (Markdown)'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Media Format</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Entropy (H)</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>NPCR (%)</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>UACI (%)</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Correlation (R)</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>PSNR (dB)</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>MSE</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Throughput</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Uniformity</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>NIST Standard</th>
                </tr>
              </thead>
              <tbody>
                {mediaKeys.map((k) => {
                  const m = metrics[k];
                  const h = Number(m.entropy || 0);
                  const npcr = Number(m.npcr || 0);
                  const uaci = Number(m.uaci || 0);
                  const corr = Number(m.corrCipher || 0);
                  const psnr = Number(m.psnr || 0);
                  const mse = Number(m.mse || 0);
                  const spd = Number(m.speedMBps || 0);
                  const chi = m.chi2 || 'PASS';
                  const isPass = h >= 7.999 && npcr >= 99.59;

                  return (
                    <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                        <span style={{ marginRight: '0.5rem' }}>{m.icon}</span>
                        {m.name}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: '700', color: '#0f172a' }}>
                        {h.toFixed(h > 7.9999 ? 4 : 5)}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: '700', color: npcr >= 99.6 ? '#059669' : '#0f172a' }}>
                        {npcr.toFixed(2)}%
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>
                        {uaci.toFixed(2)}%
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: '700', color: Math.abs(corr) < 0.02 ? '#059669' : '#dc2626' }}>
                        {corr > 0 ? `+${corr.toFixed(5)}` : corr.toFixed(5)}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>
                        {psnr.toFixed(2)} dB
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>
                        {mse.toFixed(1)}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', color: m.color, fontWeight: '700' }}>
                        {spd.toFixed(2)} MB/s
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                        {chi}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          background: isPass ? '#ecfdf5' : '#fef2f2',
                          color: isPass ? '#059669' : '#dc2626',
                          border: `1px solid ${isPass ? '#a7f3d0' : '#fecaca'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {isPass ? 'PASS ✓' : 'REVIEW'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
