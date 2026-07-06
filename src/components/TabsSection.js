import React from 'react';
import { Trash2 } from 'lucide-react';

const TabsSection = ({ 
  activeTab, 
  setActiveTab, 
  markers, 
  polygonVertices, 
  handleListItemClick, 
  handleDeleteMarker, 
  handleDeleteVertex 
}) => {
  return (
    <div className="control-card p-3 rounded bg-glass border border-glass d-flex flex-column flex-grow-1" style={{ minHeight: '220px' }}>
      <div className="tabs d-flex border-bottom border-glass mb-2">
        <button 
          className={`tab-btn btn btn-link text-decoration-none text-secondary py-2 px-3 fw-bold ${activeTab === 'markers' ? 'active' : ''}`}
          onClick={() => setActiveTab('markers')}
        >
          Markers ({markers.length})
        </button>
        <button 
          className={`tab-btn btn btn-link text-decoration-none text-secondary py-2 px-3 fw-bold ${activeTab === 'vertices' ? 'active' : ''}`}
          onClick={() => setActiveTab('vertices')}
        >
          Vertices ({polygonVertices.length})
        </button>
      </div>

      <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: '180px' }}>
        {activeTab === 'markers' ? (
          <div className="d-flex flex-column gap-2">
            {markers.length === 0 ? (
              <div className="text-center text-muted small py-4 border border-dashed border-glass rounded">
                No markers placed yet. Switch to "Marker" mode and click on the map.
              </div>
            ) : (
              markers.map((m, idx) => (
                <div 
                  key={m.id} 
                  className="list-item p-2 rounded d-flex align-items-center justify-content-between"
                  onClick={() => handleListItemClick(m.lng, m.lat)}
                >
                  <div className="d-flex flex-column min-width-0">
                    <span className="small fw-bold text-white">Marker #{idx + 1}</span>
                    <span className="small text-secondary font-monospace">
                      {m.lng.toFixed(5)}, {m.lat.toFixed(5)}
                    </span>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDeleteMarker(m.id, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {polygonVertices.length === 0 ? (
              <div className="text-center text-muted small py-4 border border-dashed border-glass rounded">
                No polygon vertices drawn yet. Switch to "Draw" mode and click on the map.
              </div>
            ) : (
              polygonVertices.map((v, idx) => (
                <div 
                  key={idx} 
                  className="list-item p-2 rounded d-flex align-items-center justify-content-between"
                  onClick={() => handleListItemClick(v[0], v[1])}
                >
                  <div className="d-flex flex-column min-width-0">
                    <span className="small fw-bold text-white">Vertex #{idx + 1}</span>
                    <span className="small text-secondary font-monospace">
                      {v[0].toFixed(5)}, {v[1].toFixed(5)}
                    </span>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDeleteVertex(idx, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabsSection;
