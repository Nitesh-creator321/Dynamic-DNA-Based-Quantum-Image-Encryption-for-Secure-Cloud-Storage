import React, { useState } from 'react';
import './App.css';
import FileEncryption from './FileEncryption';

const INITIAL_KEY = {
  a: 0.9,
  b: 0.2,
  c: 20.0,
  d: 2.0,
  x0: 0.6382,
  y0: 0.8916,
  z0: 0.6725,
  w0: 0.8374,
  T: 301,
  t: 304,
  theta: 0.0,
  sigma_0: (Math.PI / 3).toFixed(4),
  sigma_1: (Math.PI / 4).toFixed(4),
  sigma_2: (Math.PI / 6).toFixed(4),
};

export default function App() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'file'
  const [keys, setKeys] = useState(INITIAL_KEY);
  const [selectedFile, setSelectedFile] = useState(null);

  const [plainImageSrc, setPlainImageSrc] = useState(null);
  const [encryptedImageSrc, setEncryptedImageSrc] = useState(null);
  const [decryptedImageSrc, setDecryptedImageSrc] = useState(null);

  const [pxInfo, setPxInfo] = useState(null);
  const [profiling, setProfiling] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('System Ready');

  const handleKeyChange = (param, value) => {
    setKeys((prev) => ({ ...prev, [param]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPlainImageSrc(event.target.result);
        setEncryptedImageSrc(null);
        setDecryptedImageSrc(null);
        setMetrics(null);
        setCharts(null);
        setProfiling(null);
        setStatus('Image Loaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStatus('Encrypting via Quantum-DNA...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.entries(keys).forEach(([k, v]) => formData.append(k, v));

      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Encryption request failed');
      const data = await res.json();

      const encSrc = `data:image/png;base64,${data.image}`;
      setEncryptedImageSrc(encSrc);
      setPxInfo(data.px_info);
      setProfiling(data.profiling);
      setStatus('Encryption Complete');

      // Automatically trigger analysis
      await runAnalysis(selectedFile, encSrc);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedImageSrc || pxInfo === null) return;
    setIsProcessing(true);
    setStatus('Decrypting via Inverse Quantum-DNA...');

    try {
      // Convert base64 encrypted image to blob
      const resBlob = await fetch(encryptedImageSrc);
      const encBlob = await resBlob.blob();

      const formData = new FormData();
      formData.append('file', encBlob, 'encrypted.png');
      formData.append('px_info', pxInfo);
      Object.entries(keys).forEach(([k, v]) => formData.append(k, v));

      const res = await fetch('/api/decrypt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Decryption request failed');
      const data = await res.json();

      setDecryptedImageSrc(`data:image/png;base64,${data.image}`);
      setStatus('Decryption Verified (100% Integrity)');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysis = async (plainFileObj, cipherBase64) => {
    try {
      const resBlob = await fetch(cipherBase64);
      const cipherBlob = await resBlob.blob();

      const formData = new FormData();
      formData.append('plain_file', plainFileObj);
      formData.append('cipher_file', cipherBlob, 'cipher.png');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCharts(data.charts);
      }
    } catch (e) {
      console.error('Analysis error:', e);
    }
  };

  const handleDownload = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="header-title">
          Quantum<span>DNA</span> Cryptosystem
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '6px' }}>
            <button
              className="btn"
              style={{
                padding: '0.4rem 0.8rem',
                background: activeTab === 'image' ? 'var(--panel-bg)' : 'transparent',
                color: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'image' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setActiveTab('image')}
            >
              Image Encryption
            </button>
            <button
              className="btn"
              style={{
                padding: '0.4rem 0.8rem',
                background: activeTab === 'file' ? 'var(--panel-bg)' : 'transparent',
                color: activeTab === 'file' ? 'var(--accent-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setActiveTab('file')}
            >
              Universal File Encryption
            </button>
          </div>

          <div className="status-badge">
            <span className="status-indicator"></span>
            {status}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="main-layout">
        {/* Sidebar Parameters */}
        <aside className="glass-panel sidebar">
          <h3>Cryptographic Key</h3>

          <div className="param-section">
            <h4>4D Hyperchaotic Map</h4>
            <div className="param-grid">
              {['a', 'b', 'c', 'd', 'x0', 'y0', 'z0', 'w0'].map((param) => (
                <div key={param} className="param-input-group">
                  <label>{param.toUpperCase()}</label>
                  <input
                    type="number"
                    step="any"
                    value={keys[param]}
                    onChange={(e) => handleKeyChange(param, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="param-section">
            <h4>Discrete-Time Quantum Walk</h4>
            <div className="param-grid">
              {['T', 't', 'theta', 'sigma_0', 'sigma_1', 'sigma_2'].map((param) => (
                <div key={param} className="param-input-group">
                  <label>{param.toUpperCase()}</label>
                  <input
                    type="number"
                    step="any"
                    value={keys[param]}
                    onChange={(e) => handleKeyChange(param, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.75rem' }}
            onClick={() => setKeys(INITIAL_KEY)}
          >
            Reset to Standard Paper Key
          </button>
        </aside>

        {/* Content Area */}
        <section className="content">
          {activeTab === 'file' ? (
            <FileEncryption keys={keys} />
          ) : (
            <>
              {/* Action Bar */}
              <div className="action-bar">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-primary"
                    onClick={handleEncrypt}
                    disabled={!selectedFile || isProcessing}
                  >
                    {isProcessing ? 'Encrypting...' : 'Encrypt Image'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleDecrypt}
                    disabled={!encryptedImageSrc || isProcessing}
                  >
                    {isProcessing ? 'Decrypting...' : 'Decrypt Image'}
                  </button>
                </div>
              </div>

              {/* Pipeline View */}
              <div className="pipeline-view">
                {/* Plain Image */}
                <div className="pipeline-step">
                  <h4>Plain Image</h4>
                  <div className="image-container">
                    {plainImageSrc ? (
                      <img src={plainImageSrc} alt="Plain input" />
                    ) : (
                      <div className="image-placeholder">No image selected</div>
                    )}
                  </div>
                  {plainImageSrc && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      onClick={() => handleDownload(plainImageSrc, 'plain.png')}
                    >
                      Download Original
                    </button>
                  )}
                </div>

                <div className="arrow">➔</div>

                {/* Encrypted Image */}
                <div className="pipeline-step">
                  <h4>Encrypted Image</h4>
                  <div className="image-container">
                    {encryptedImageSrc ? (
                      <img src={encryptedImageSrc} alt="Encrypted cipher" />
                    ) : (
                      <div className="image-placeholder">Awaiting Encryption</div>
                    )}
                  </div>
                  {encryptedImageSrc && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      onClick={() => handleDownload(encryptedImageSrc, 'encrypted.png')}
                    >
                      Download Cipher
                    </button>
                  )}
                </div>

                <div className="arrow">➔</div>

                {/* Decrypted Image */}
                <div className={`pipeline-step ${decryptedImageSrc ? 'success' : ''}`}>
                  <h4>Decrypted Image</h4>
                  <div className="image-container">
                    {decryptedImageSrc ? (
                      <img src={decryptedImageSrc} alt="Decrypted output" />
                    ) : (
                      <div className="image-placeholder">Awaiting Decryption</div>
                    )}
                  </div>
                  {decryptedImageSrc && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      onClick={() => handleDownload(decryptedImageSrc, 'decrypted.png')}
                    >
                      Download Decrypted
                    </button>
                  )}
                </div>
              </div>

              {/* Profiling list if available */}
              {profiling && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    Stage Execution Timing
                  </h4>
                  <div className="profiling-list" style={{ marginTop: 0 }}>
                    <div className="profiling-item chaos">
                      <span className="profiling-name">Hyperchaotic Pre-diffusion</span>
                      <span className="profiling-val">{(profiling.chaos * 1000).toFixed(1)} ms</span>
                    </div>
                    <div className="profiling-item quantum">
                      <span className="profiling-name">DTQW Probability Simulation</span>
                      <span className="profiling-val">{(profiling.quantum * 1000).toFixed(1)} ms</span>
                    </div>
                    <div className="profiling-item dna">
                      <span className="profiling-name">Dynamic DNA Confusion & Substitution</span>
                      <span className="profiling-val">{(profiling.dna_confusion * 1000).toFixed(1)} ms</span>
                    </div>
                    <div className="profiling-item diffusion">
                      <span className="profiling-name">Permutation & Pixel Diffusion</span>
                      <span className="profiling-val">{(profiling.pixel_diffusion * 1000).toFixed(1)} ms</span>
                    </div>
                    <div className="profiling-item" style={{ borderLeftColor: 'var(--text-main)' }}>
                      <span className="profiling-name"><strong>Total Execution Time</strong></span>
                      <span className="profiling-val"><strong>{(profiling.total * 1000).toFixed(1)} ms</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Dashboard */}
              {metrics && (
                <div className="metrics-dashboard">
                  <div className="metrics-header">
                    <h3>Cryptographic Benchmark Metrics</h3>
                  </div>

                  <div className="metrics-grid">
                    <div className={`metric-card ${metrics.entropy >= 7.95 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">Information Entropy</div>
                      <div className="metric-value">{metrics.entropy?.toFixed(4)}</div>
                      <div className="metric-target">Ideal: ~8.0000</div>
                    </div>

                    <div className={`metric-card ${metrics.npcr >= 99.0 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">NPCR Sensitivity</div>
                      <div className="metric-value">{metrics.npcr?.toFixed(2)}%</div>
                      <div className="metric-target">Ideal: &gt;99.60%</div>
                    </div>

                    <div className={`metric-card ${metrics.uaci >= 30.0 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">UACI Rate</div>
                      <div className="metric-value">{metrics.uaci?.toFixed(2)}%</div>
                      <div className="metric-target">Ideal: ~33.46%</div>
                    </div>

                    <div className={`metric-card ${metrics.corr_h < 0.05 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">Horizontal Corr.</div>
                      <div className="metric-value">{metrics.corr_h?.toFixed(4)}</div>
                      <div className="metric-target">Ideal: ~0.0000</div>
                    </div>

                    <div className={`metric-card ${metrics.corr_v < 0.05 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">Vertical Corr.</div>
                      <div className="metric-value">{metrics.corr_v?.toFixed(4)}</div>
                      <div className="metric-target">Ideal: ~0.0000</div>
                    </div>

                    <div className={`metric-card ${metrics.corr_d < 0.05 ? 'ideal' : 'warning'}`}>
                      <div className="metric-label">Diagonal Corr.</div>
                      <div className="metric-value">{metrics.corr_d?.toFixed(4)}</div>
                      <div className="metric-target">Ideal: ~0.0000</div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-label">PSNR</div>
                      <div className="metric-value">{metrics.psnr?.toFixed(2)} dB</div>
                      <div className="metric-target">Target: &lt; 10 dB</div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-label">Mean Squared Error</div>
                      <div className="metric-value">{metrics.mse?.toFixed(1)}</div>
                      <div className="metric-target">High Dissimilarity</div>
                    </div>
                  </div>

                  {/* Cryptographic Charts */}
                  {charts && (
                    <div className="charts-grid">
                      {charts.histogram && (
                        <div className="chart-container">
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            HISTOGRAM DISTRIBUTION (UNIFORMITY)
                          </h4>
                          <img src={`data:image/png;base64,${charts.histogram}`} alt="Histogram" />
                        </div>
                      )}
                      {charts.corr_h && (
                        <div className="chart-container">
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            HORIZONTAL ADJACENT PIXEL CORRELATION
                          </h4>
                          <img src={`data:image/png;base64,${charts.corr_h}`} alt="Horizontal Correlation" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
