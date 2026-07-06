import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';

const ActionPanel = ({
  handleExportGeoJSON,
  handleImportGeoJSON,
  handleClearMap,
  fileInputRef
}) => {
  return (
    <div className="control-card p-3 rounded bg-glass border border-glass d-flex flex-column gap-2">
      <span className="card-title text-secondary small fw-bold text-uppercase tracking-wider">Actions & Operations</span>

      <div className="action-grid row g-2">
        <div className="col-6">
          <button className="secondary-btn btn w-100 border border-glass py-2" onClick={handleExportGeoJSON}>
            <Download size={14} className="me-1" /> Export
          </button>
        </div>
        <div className="col-6">
          <button className="secondary-btn btn w-100 border border-glass py-2">
            <label className="import-btn-label m-0 d-flex align-items-center justify-content-center w-100 cursor-pointer">
              <Upload size={14} className="me-1" /> Import
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".geojson,.json"
                style={{ display: 'none' }}
                onChange={handleImportGeoJSON}
              />
            </label>
          </button>
        </div>
      </div>

      <button className="danger-btn btn w-100 mt-1 py-2" onClick={handleClearMap}>
        <Trash2 size={14} className="me-1" /> Clear Active Map
      </button>
    </div>
  );
};

export default ActionPanel;
