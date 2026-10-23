import React, { useState } from 'react';

export default function FileEncryption({ keys }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatusMessage(`Selected: ${e.target.files[0].name} (${(e.target.files[0].size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const handleEncryptFile = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStatusMessage('Streaming file to Quantum-DNA encryption pipeline...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.entries(keys).forEach(([k, v]) => formData.append(k, v));

      const response = await fetch('/api/encrypt_file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Encryption failed on server');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name}.enc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage(`Encryption complete! Downloaded: ${selectedFile.name}.enc`);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecryptFile = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStatusMessage('Streaming encrypted file to Quantum-DNA decryption pipeline...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.entries(keys).forEach(([k, v]) => formData.append(k, v));

      const response = await fetch('/api/decrypt_file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Decryption failed on server');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = selectedFile.name.endsWith('.enc')
        ? selectedFile.name.slice(0, -4)
        : `dec_${selectedFile.name}`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage(`Decryption complete! Downloaded: ${downloadName}`);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Universal File Encryption (Audio, Video, PDF)
        </h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Stream and encrypt large media or document files in 1MB chunks using 4D hyperchaotic dynamic DNA diffusion.
        </p>
      </div>

      <div className="action-bar" style={{ boxShadow: 'none', padding: '1rem', background: 'var(--card-bg)' }}>
        <div className="file-input-wrapper">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={isProcessing}
            accept=".mp3,.wav,.mp4,.avi,.mkv,.pdf,.doc,.docx,.zip,.enc,*"
          />
        </div>
        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={handleEncryptFile}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Encrypt to .enc'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDecryptFile}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Decrypt .enc'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.875rem',
            color: 'var(--accent-primary)',
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
