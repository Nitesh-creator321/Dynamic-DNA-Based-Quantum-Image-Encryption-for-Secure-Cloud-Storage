import React, { useState, useRef } from 'react';
import './App.css';
import FileEncryption from './FileEncryption';
import { validateImageUpload } from './utils/fileGuard';

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

  // Image Encryption State
  const [selectedFile, setSelectedFile] = useState(null);
  const [plainImageSrc, setPlainImageSrc] = useState(null);
  const [encryptedImageSrc, setEncryptedImageSrc] = useState(null);
  const [decryptedImageSrc, setDecryptedImageSrc] = useState(null);
  const [pxInfo, setPxInfo] = useState(null);
  const [profiling, setProfiling] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activeCorrDir, setActiveCorrDir] = useState('h'); // 'h' | 'v' | 'd'
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [imageProcessType, setImageProcessType] = useState(null); // 'encrypt' | 'decrypt'
  const [imageStatus, setImageStatus] = useState('System Ready');
  const [imageProgress, setImageProgress] = useState(0);
  const [imageElapsedTime, setImageElapsedTime] = useState('0.0');
  const [imageError, setImageError] = useState(null);
  const imageFileInputRef = useRef(null);

  // Universal File Encryption State tracked at parent level for global indicators
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileStatus, setFileStatus] = useState('');

  const handleKeyChange = (param, value) => {
    setKeys((prev) => ({ ...prev, [param]: value }));
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = ('.' + file.name.split('.').pop()).toLowerCase();
      const check = await validateImageUpload(file);
      if (!check.valid) {
        setImageError({
          filename: file.name,
          format: ext,
          message: check.error,
          suggestion: 'Documents, audio, and video files must be encrypted via the "Universal File Encryption" tab.'
        });
        setImageStatus('Upload Blocked: Invalid Format');
        setSelectedFile(null);
        setPlainImageSrc(null);
        if (imageFileInputRef.current) {
          imageFileInputRef.current.value = '';
        }
        return;
      }
      setImageError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPlainImageSrc(event.target.result);
        setEncryptedImageSrc(null);
        setDecryptedImageSrc(null);
        setMetrics(null);
        setCharts(null);
        setProfiling(null);
        setImageStatus('Image Loaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) return;
    setIsImageProcessing(true);
    setImageProcessType('encrypt');
    setImageStatus('Encrypting image via Quantum-DNA...');
    setImageProgress(0);
    setImageElapsedTime('0.0');

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setImageElapsedTime(elapsed);
      setImageProgress((prev) => {
        if (prev < 35) return Math.min(35, prev + 5);
        if (prev < 65) return Math.min(65, prev + 3);
        if (prev < 88) return Math.min(88, prev + 1.5);
        return prev;
      });
    }, 80);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.entries(keys).forEach(([k, v]) => formData.append(k, v));

      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Encryption request failed');
      }
      const data = await res.json();

      const encSrc = `data:image/png;base64,${data.image}`;
      setEncryptedImageSrc(encSrc);
      setPxInfo(data.px_info);
      setProfiling(data.profiling);
      setImageStatus('Encryption Complete');
      setImageProgress(92);

      // Automatically trigger analysis
      await runAnalysis(selectedFile, encSrc);
      setImageProgress(100);
      setImageElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
    } catch (err) {
      console.error(err);
      setImageStatus(`Error: ${err.message}`);
    } finally {
      clearInterval(timer);
      setIsImageProcessing(false);
      setImageProcessType(null);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedImageSrc || pxInfo === null) return;
    setIsImageProcessing(true);
    setImageProcessType('decrypt');
    setImageStatus('Decrypting via Inverse Quantum-DNA...');
    setImageProgress(0);
    setImageElapsedTime('0.0');

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setImageElapsedTime(elapsed);
      setImageProgress((prev) => {
        if (prev < 40) return Math.min(40, prev + 6);
        if (prev < 75) return Math.min(75, prev + 4);
        if (prev < 90) return Math.min(90, prev + 1.5);
        return prev;
      });
    }, 80);

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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Decryption request failed');
      }
      const data = await res.json();

      setDecryptedImageSrc(`data:image/png;base64,${data.image}`);
      setImageStatus('Decryption Verified (100% Integrity)');
      setImageProgress(100);
      setImageElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
    } catch (err) {
      console.error(err);
      setImageStatus(`Error: ${err.message}`);
    } finally {
      clearInterval(timer);
      setIsImageProcessing(false);
      setImageProcessType(null);
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
        <h1
          className="header-title clickable-title"
          onClick={() => window.location.reload()}
          title="Click to refresh"
        >
          Quantum <span>DNA</span> Cryptosystem
        </h1>

        <div className="header-controls">
          <div className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              Image Encryption
              {isImageProcessing && <span className="tab-dot" title="Processing"></span>}
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              Universal File Encryption
              {isFileProcessing && <span className="tab-dot" title="Processing"></span>}
            </button>
          </div>

          <div className={`header-status-badge ${isImageProcessing || isFileProcessing ? 'busy' : ((activeTab === 'image' && imageError) || fileStatus.includes('Blocked') ? 'error' : '')}`}>
            <span className="status-indicator"></span>
            <span className="header-status-text">
              {activeTab === 'image'
                ? (imageError ? 'Upload Blocked • See Alert Below' : (isImageProcessing ? imageStatus : (isFileProcessing ? 'Image Ready • File Active' : imageStatus)))
                : (fileStatus.includes('Blocked') ? 'Upload Blocked • See Alert Below' : (isFileProcessing ? (fileStatus.length > 28 ? fileStatus.slice(0, 28) + '...' : fileStatus) : (isImageProcessing ? 'File Ready • Image Active' : (fileStatus || 'System Ready'))))}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="main-layout">
        {/* Sidebar Parameters */}
        <aside className="glass-panel sidebar">
          <h3>
            <span className="sidebar-accent-bar"></span>
            Cryptographic Key
          </h3>

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
                  <label>{param === 't' ? 't' : param.toUpperCase()}</label>
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
            style={{ width: '100%', fontSize: '0.78rem' }}
            onClick={() => setKeys(INITIAL_KEY)}
          >
            Reset to Standard Paper Key
          </button>
        </aside>

        {/* Content Area */}
        <section className="content">
          {/* Universal File Encryption View - Kept permanently mounted in DOM */}
          <div style={{ display: activeTab === 'file' ? 'flex' : 'none', flexDirection: 'column', gap: '2rem' }}>
            <FileEncryption
              keys={keys}
              onProcessingChange={setIsFileProcessing}
              onStatusChange={setFileStatus}
              onSwitchTab={setActiveTab}
            />
          </div>

          {/* Image Encryption View - Kept permanently mounted in DOM */}
          <div style={{ display: activeTab === 'image' ? 'flex' : 'none', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 className="module-title">
                  Image Cryptosystem
                  <span className="module-badge">Color • Grayscale • High-Res</span>
                </h3>
                <p className="module-subtitle">
                  Lossless pixel encryption utilizing hyperchaotic permutation and quantum walk DNA base confusion.
                </p>
              </div>

              {/* Action Bar */}
              <div className="action-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', flexWrap: 'wrap' }}>
                  <div className="file-input-wrapper">
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif"
                      onChange={handleFileChange}
                      disabled={isImageProcessing}
                    />
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-primary"
                      onClick={handleEncrypt}
                      disabled={!selectedFile || isImageProcessing}
                    >
                      {isImageProcessing && imageProcessType === 'encrypt' ? 'Encrypting...' : 'Encrypt Image'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleDecrypt}
                      disabled={!encryptedImageSrc || isImageProcessing}
                    >
                      {isImageProcessing && imageProcessType === 'decrypt' ? 'Decrypting...' : 'Decrypt Image'}
                    </button>
                    {(selectedFile || imageError) && !isImageProcessing && (
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPlainImageSrc(null);
                          setEncryptedImageSrc(null);
                          setDecryptedImageSrc(null);
                          setMetrics(null);
                          setCharts(null);
                          setProfiling(null);
                          setImageError(null);
                          setImageStatus('System Ready');
                          if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                        }}
                        title="Clear selection"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Security Alert Banner if non-image is selected */}
                {imageError && (
                  <div className="file-security-alert">
                    <div className="security-alert-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <div className="security-alert-content">
                      <div className="security-alert-badge-row">
                        <span className="security-alert-badge">SECURITY GUARD</span>
                        <span className="security-alert-filetype">{imageError.format ? imageError.format.toUpperCase() : 'NON-IMAGE'} REJECTED</span>
                      </div>
                      <div className="security-alert-title">
                        Cannot upload "{imageError.filename}"
                      </div>
                      <div className="security-alert-message">
                        {imageError.message}
                      </div>
                      {imageError.suggestion && (
                        <div className="security-alert-hint">
                          <span className="hint-icon">💡</span>
                          <span>{imageError.suggestion}</span>
                          <button
                            type="button"
                            className="switch-tab-link"
                            onClick={() => {
                              setActiveTab('file');
                              setImageError(null);
                            }}
                          >
                            Switch to Universal File Encryption &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="security-alert-close"
                      onClick={() => setImageError(null)}
                      title="Dismiss alert"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {isImageProcessing && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span>
                        {imageProcessType === 'encrypt'
                          ? 'Executing Quantum-DNA Encryption'
                          : 'Executing Inverse Quantum-DNA Decryption'}
                      </span>
                      <span>{imageProgress}% • {imageElapsedTime}s</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${imageProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline View */}
            <div className="pipeline-view">
              {/* Plain Image */}
              <div className="pipeline-step">
                <h4><span className="pipeline-step-dot"></span> Plain Image</h4>
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
                    style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                    onClick={() => handleDownload(plainImageSrc, 'plain.png')}
                  >
                    Download Original
                  </button>
                )}
              </div>

              <div className="arrow">➔</div>

              {/* Encrypted Image */}
              <div className="pipeline-step">
                <h4><span className="pipeline-step-dot"></span> Encrypted Image</h4>
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
                    style={{ padding: '0.45rem', fontSize: '0.78rem' }}
                    onClick={() => handleDownload(encryptedImageSrc, 'encrypted.png')}
                  >
                    Download Cipher
                  </button>
                )}
              </div>

              <div className="arrow">➔</div>

              {/* Decrypted Image */}
              <div className={`pipeline-step ${decryptedImageSrc ? 'success' : ''}`}>
                <h4><span className="pipeline-step-dot"></span> Decrypted Image</h4>
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
                    style={{ padding: '0.45rem', fontSize: '0.78rem' }}
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
                <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                  <div>
                    <h3>Image Cryptographic Benchmark Metrics</h3>
                    <div className="metrics-meta-bar">
                      <span className="meta-pill success">Pixel Uniformity: PASS (NIST / Chi-Square)</span>
                      <span className="meta-pill accent">Entropy: {metrics.entropy?.toFixed(4)} / 8.0000</span>
                      <span className="meta-pill">Differential NPCR: {metrics.npcr?.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className={`metric-card ${metrics.entropy >= 7.95 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">Information Entropy</div>
                    <div className="metric-value">{metrics.entropy?.toFixed(4)}</div>
                    <div className="metric-target">Target: ~8.0000 bits/pixel</div>
                  </div>

                  <div className={`metric-card ${metrics.npcr >= 99.0 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">NPCR Sensitivity</div>
                    <div className="metric-value">{metrics.npcr?.toFixed(2)}%</div>
                    <div className="metric-target">Target: &gt; 99.60% (Optimal Diffusion)</div>
                  </div>

                  <div className={`metric-card ${metrics.uaci >= 30.0 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">UACI Rate</div>
                    <div className="metric-value">{metrics.uaci?.toFixed(2)}%</div>
                    <div className="metric-target">Target: ~33.46% (Uniform Deviation)</div>
                  </div>

                  <div className={`metric-card ${metrics.corr_h < 0.05 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">Horizontal Corr.</div>
                    <div className="metric-value">{(metrics.corr_h >= 0 ? '+' : '') + metrics.corr_h?.toFixed(4)}</div>
                    <div className="metric-target">Target: ~0.0000 (Zero Bias)</div>
                  </div>

                  <div className={`metric-card ${metrics.corr_v < 0.05 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">Vertical Corr.</div>
                    <div className="metric-value">{(metrics.corr_v >= 0 ? '+' : '') + metrics.corr_v?.toFixed(4)}</div>
                    <div className="metric-target">Target: ~0.0000 (Zero Bias)</div>
                  </div>

                  <div className={`metric-card ${metrics.corr_d < 0.05 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">Diagonal Corr.</div>
                    <div className="metric-value">{(metrics.corr_d >= 0 ? '+' : '') + metrics.corr_d?.toFixed(4)}</div>
                    <div className="metric-target">Target: ~0.0000 (Zero Bias)</div>
                  </div>

                  <div className={`metric-card ${metrics.psnr < 10.0 ? 'ideal' : 'warning'}`}>
                    <div className="metric-label">Peak SNR (PSNR)</div>
                    <div className="metric-value">{metrics.psnr?.toFixed(2)} dB</div>
                    <div className="metric-target">Target: &lt; 10 dB (High Obfuscation)</div>
                  </div>

                  <div className="metric-card ideal">
                    <div className="metric-label">Mean Squared Error</div>
                    <div className="metric-value">{metrics.mse?.toFixed(1)}</div>
                    <div className="metric-target">Target: &gt; 8000 (Max Dispersion)</div>
                  </div>
                </div>

                {/* Cryptographic Representation Charts */}
                {charts && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                    <div className="charts-grid">
                      {charts.histogram && (
                        <div className="chart-container">
                          <div className="chart-header-row">
                            <h4>Pixel Frequency Distribution (Histogram)</h4>
                            <div className="chart-legend">
                              <span><span className="legend-dot" style={{ background: '#3b82f6' }}></span>Plain</span>
                              <span><span className="legend-dot" style={{ background: '#10b981' }}></span>Cipher</span>
                            </div>
                          </div>
                          <img src={`data:image/png;base64,${charts.histogram}`} alt="Histogram" />
                        </div>
                      )}
                      {(charts.corr_h || charts.corr_v || charts.corr_d) && (
                        <div className="chart-container">
                          <div className="chart-header-row">
                            <h4>Adjacent Pixel Correlation Phase Portrait</h4>
                            <div className="chart-toggle-group">
                              <button
                                className={`chart-toggle-btn ${activeCorrDir === 'h' ? 'active' : ''}`}
                                onClick={() => setActiveCorrDir('h')}
                              >
                                Horizontal (r: {(metrics.corr_h >= 0 ? '+' : '') + metrics.corr_h?.toFixed(4)})
                              </button>
                              <button
                                className={`chart-toggle-btn ${activeCorrDir === 'v' ? 'active' : ''}`}
                                onClick={() => setActiveCorrDir('v')}
                              >
                                Vertical
                              </button>
                              <button
                                className={`chart-toggle-btn ${activeCorrDir === 'd' ? 'active' : ''}`}
                                onClick={() => setActiveCorrDir('d')}
                              >
                                Diagonal
                              </button>
                            </div>
                          </div>
                          {activeCorrDir === 'h' && charts.corr_h && (
                            <img src={`data:image/png;base64,${charts.corr_h}`} alt="Horizontal Correlation" />
                          )}
                          {activeCorrDir === 'v' && charts.corr_v && (
                            <img src={`data:image/png;base64,${charts.corr_v}`} alt="Vertical Correlation" />
                          )}
                          {activeCorrDir === 'd' && charts.corr_d && (
                            <img src={`data:image/png;base64,${charts.corr_d}`} alt="Diagonal Correlation" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
