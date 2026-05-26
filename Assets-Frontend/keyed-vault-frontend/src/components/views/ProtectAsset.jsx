import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { processAsset } from '../../api/vaultClient.js';
import { useToast } from '../ui/ToastContainer.jsx';
import AssetModal from '../ui/AssetModal.jsx';

function fileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')                                    return { icon: '📄', cls: 'file-icon-pdf'  };
  if (['doc','docx'].includes(ext))                     return { icon: '📝', cls: 'file-icon-doc'  };
  if (['zip','rar','gz'].includes(ext))                 return { icon: '📦', cls: 'file-icon-zip'  };
  if (['png','jpg','jpeg','gif','webp'].includes(ext))  return { icon: '🖼️', cls: 'file-icon-img'  };
  if (['mp4','mov','avi','mkv'].includes(ext))          return { icon: '🎬', cls: 'file-icon-vid'  };
  if (['py','js','java','ts','go','rs'].includes(ext))  return { icon: '💻', cls: 'file-icon-code' };
  return                                                       { icon: '📁', cls: 'file-icon-misc' };
}

function formatSize(bytes) {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  if (bytes >= 1024)      return (bytes / 1024).toFixed(0)      + ' KB';
  return bytes + ' B';
}

const STATUS_META = {
  processing: { label: 'Processing',  dot: 'dot-orange', canClick: false },
  hardened:   { label: 'Hardened',    dot: 'dot-green',  canClick: true  },
  failed:      { label: 'Failed',     dot: 'dot-red',    canClick: false },
};

export default function ProtectAsset() {
  const { user }  = useAuth();
  const AUTHOR_ID = user?.authorId ?? user?.ownerId ?? 'USR-UNKNOWN';
  const toast     = useToast();

  const [assets,   setAssets]   = useState([]);
  const [dragging, setDragging] = useState(false);
  const [modal,    setModal]    = useState(null);
  const fileInputRef            = useRef(null);

  const startProcessing = useCallback(async (file) => {
    const id = `${Date.now()}-${Math.random()}`;
    setAssets(prev => [...prev, {
      id, name: file.name, size: formatSize(file.size),
      status: 'processing', hash: null,
    }]);

    try {
      const data = await processAsset(file, AUTHOR_ID);
      console.log('RESPONSE:', JSON.stringify(data));
      // Backend: model<Asset> → { success, message, payload: { assetHash, originalFileName, … } }
      if (data.payload?.assetHash) {
        const hash = data.payload.assetHash || data.payload.fileHash || null;
        setAssets(prev =>
          prev.map(a => a.id === id ? { ...a, status: 'hardened', hash } : a)
        );
        toast.success(`Hardened: ${file.name}`);
      } else {
        throw new Error(data.message || 'Processing failed');
      }

    } catch (err) {
      console.error('CATCH:', err.message, err);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'failed' } : a));
      // 409 = дубликат
      const msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('identical') || msg.toLowerCase().includes('already')) {
        toast.error(`Duplicate detected: ${file.name}`);
      } else {
        toast.error(`Failed: ${msg}`);
      }
    }
  }, [AUTHOR_ID, toast]);

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach(f => startProcessing(f));
  }, [startProcessing]);

  const onDrop      = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const removeAsset = (id) => setAssets(prev => prev.filter(a => a.id !== id));
  const openModal   = (asset) => { if (asset.status === 'hardened') setModal(asset); };

  return (
    <div>
      <div className="view-header-row">
        <div className="view-header">
          <h1 className="view-title">Local Hardening Workspace</h1>
          <p className="view-subtitle">Upload and harden your digital assets with cryptographic DNA hashing</p>
        </div>
        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Harden New Asset
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

      {/* Drop zone */}
      <div
        className={`drop-zone ${dragging ? 'drag-over' : ''}`}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-zone-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 18V6M9 11l5-5 5 5" stroke="var(--accent)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 22v1.5A2.5 2.5 0 006.5 26h15a2.5 2.5 0 002.5-2.5V22"
              stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="drop-zone-title">Drop files here or click to upload</div>
        <div className="drop-zone-sub">Supports all file types — up to 50 MB per asset</div>
      </div>

      {/* Asset list */}
      {assets.length > 0 && (
        <div className="asset-list-card">
          <div className="asset-list-header">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="dot-pulse dot-green" style={{ width:8, height:8, borderRadius:'50%',
                background:'var(--green)', boxShadow:'0 0 6px var(--green-glow)', flexShrink:0 }} />
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                Hardened Assets
              </span>
              <span className="table-count">{assets.length}</span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Asset Name</th>
                <th>DNA Hash</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const meta = STATUS_META[asset.status] || STATUS_META.processing;
                const fi   = fileIcon(asset.name);
                return (
                  <tr key={asset.id}
                    onClick={() => openModal(asset)}
                    style={{ cursor: meta.canClick ? 'pointer' : 'default' }}>
                    <td>
                      <span className={`status-badge status-${asset.status}`}>
                        <span style={{ width:6, height:6, borderRadius:'50%',
                          background: asset.status === 'hardened' ? 'var(--green)'
                            : asset.status === 'failed' ? 'var(--red)' : 'var(--orange)',
                          flexShrink:0, display:'inline-block' }} />
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <div className="filename">
                        <span style={{ fontSize:16 }}>{fi.icon}</span>
                        <span style={{ marginLeft:6 }}>{asset.name}</span>
                      </div>
                    </td>
                    <td>
                      {asset.status === 'processing' && (
                        <span className="spinner" style={{ width:12, height:12, borderWidth:2 }} />
                      )}
                      {asset.status === 'hardened' && asset.hash && (
                        <span className="mono" style={{ fontSize:11, color:'var(--accent)' }}>
                          {asset.hash.slice(0, 16)}…
                        </span>
                      )}
                      {(asset.status === 'failed' || !asset.hash) && asset.status !== 'processing' && (
                        <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span>
                      )}
                    </td>
                    <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{asset.size}</span></td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding:'4px 10px', fontSize:11 }}
                        onClick={e => { e.stopPropagation(); removeAsset(asset.id); }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && <AssetModal asset={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
