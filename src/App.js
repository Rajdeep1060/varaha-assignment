import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as turf from '@turf/turf';
import { 
  Map, 
  Navigation, 
  MapPin, 
  PenTool, 
  Trash2, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Info 
} from 'lucide-react';
import './App.css';
import MapContainer from './MapContainer';

const App = () => {
  const fileInputRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [polygonVertices, setPolygonVertices] = useState([]);
  const [interactionMode, setInteractionMode] = useState('navigation');
  const [activeTab, setActiveTab] = useState('markers');
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [polygonArea, setPolygonArea] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (polygonVertices.length >= 3) {
      try {
        const closedCoords = [...polygonVertices, polygonVertices[0]];
        const poly = turf.polygon([closedCoords]);
        const area = turf.area(poly);
        setPolygonArea(area);
      } catch (err) {
        setPolygonArea(0);
      }
    } else {
      setPolygonArea(0);
    }
  }, [polygonVertices]);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('mapbox_map_state');
    if (savedState) {
      try {
        const { savedMarkers, savedVertices } = JSON.parse(savedState);
        if (Array.isArray(savedMarkers)) setMarkers(savedMarkers);
        if (Array.isArray(savedVertices)) setPolygonVertices(savedVertices);
        showToast('Restored last session map state');
      } catch (e) {}
    }
  }, [showToast]);

  const handleSaveState = () => {
    const stateToSave = {
      savedMarkers: markers,
      savedVertices: polygonVertices
    };
    localStorage.setItem('mapbox_map_state', JSON.stringify(stateToSave));
    showToast('Map state saved successfully!');
  };

  const handleLoadState = () => {
    const savedState = localStorage.getItem('mapbox_map_state');
    if (savedState) {
      try {
        const { savedMarkers, savedVertices } = JSON.parse(savedState);
        setMarkers(savedMarkers || []);
        setPolygonVertices(savedVertices || []);
        showToast('Loaded saved map state');
      } catch (e) {
        showToast('Error loading saved state');
      }
    } else {
      showToast('No saved state found in LocalStorage');
    }
  };

  const handleClearMap = () => {
    setMarkers([]);
    setPolygonVertices([]);
    setPolygonArea(0);
    showToast('Map cleared');
  };

  const handleAddMarker = (lng, lat) => {
    const newMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lng,
      lat
    };
    setMarkers(prev => [...prev, newMarker]);
    showToast(`Marker added`);
  };

  const handleAddVertex = (lng, lat) => {
    setPolygonVertices(prev => [...prev, [lng, lat]]);
    showToast(`Polygon vertex added`);
  };

  const handleDeleteMarker = (id, e) => {
    e.stopPropagation();
    setMarkers(prev => prev.filter(m => m.id !== id));
    showToast('Marker removed');
  };

  const handleDeleteVertex = (index, e) => {
    e.stopPropagation();
    setPolygonVertices(prev => prev.filter((_, i) => i !== index));
    showToast('Vertex removed');
  };

  const handleListItemClick = (lng, lat) => {
    setFlyToCoords([lng, lat]);
  };

  const handleResetFlyTo = useCallback(() => {
    setFlyToCoords(null);
  }, []);

  const handleExportGeoJSON = () => {
    const features = [];
    markers.forEach((m, idx) => {
      features.push({
        type: 'Feature',
        properties: {
          name: `Marker #${idx + 1}`,
          type: 'marker',
          id: m.id
        },
        geometry: {
          type: 'Point',
          coordinates: [m.lng, m.lat]
        }
      });
    });

    if (polygonVertices.length >= 3) {
      features.push({
        type: 'Feature',
        properties: {
          name: 'Custom Polygon Area',
          type: 'polygon',
          areaSquareMeters: polygonArea
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[...polygonVertices, polygonVertices[0]]]
        }
      });
    } else if (polygonVertices.length === 2) {
      features.push({
        type: 'Feature',
        properties: {
          name: 'Incomplete Polygon Path',
          type: 'linestring'
        },
        geometry: {
          type: 'LineString',
          coordinates: polygonVertices
        }
      });
    } else if (polygonVertices.length === 1) {
      features.push({
        type: 'Feature',
        properties: {
          name: 'Incomplete Polygon Vertex',
          type: 'vertex'
        },
        geometry: {
          type: 'Point',
          coordinates: polygonVertices[0]
        }
      });
    }

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `map_state_${Date.now()}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported GeoJSON file');
  };

  const handleImportGeoJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target.result);
        if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
          showToast('Invalid GeoJSON format');
          return;
        }

        const newMarkers = [];
        let newVertices = [];

        geojson.features.forEach((feature) => {
          if (!feature.geometry) return;

          if (feature.geometry.type === 'Point' && feature.properties?.type === 'marker') {
            const [lng, lat] = feature.geometry.coordinates;
            newMarkers.push({
              id: feature.properties.id || `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              lng,
              lat
            });
          } else if (feature.geometry.type === 'Polygon') {
            const ring = feature.geometry.coordinates[0];
            newVertices = ring.slice(0, ring.length - 1);
          } else if (feature.geometry.type === 'LineString') {
            newVertices = feature.geometry.coordinates;
          }
        });

        if (newMarkers.length > 0 || newVertices.length > 0) {
          setMarkers(newMarkers);
          setPolygonVertices(newVertices);
          showToast(`Imported map state`);

          if (newMarkers.length > 0) {
            setFlyToCoords([newMarkers[0].lng, newMarkers[0].lat]);
          } else if (newVertices.length > 0) {
            setFlyToCoords(newVertices[0]);
          }
        } else {
          showToast('No relevant elements found in file');
        }
      } catch (err) {
        showToast('Error reading GeoJSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const formatArea = (area) => {
    if (area === 0) return '0.00 m²';
    if (area < 1000000) {
      return `${area.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
    }
    return `${(area / 1000000).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} km²`;
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden d-flex flex-column-reverse flex-md-row">
      <aside 
        className="sidebar w-sidebar-md w-100 h-100-md bg-glass border-end border-glass d-flex flex-column" 
        style={{ height: '40vh' }}
      >
        <header className="sidebar-header d-flex align-items-center gap-2 p-3 border-bottom border-glass">
          <Map size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="m-0 fs-5 fw-bold text-white">VaraMap Studio</h1>
          <span className="badge rounded-pill bg-info text-dark ms-auto">v1.0</span>
        </header>

        <div className="sidebar-content flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
          <div className="control-card p-3 rounded bg-glass border border-glass d-flex flex-column gap-2">
            <span className="card-title text-secondary small fw-bold text-uppercase tracking-wider">Interaction Mode</span>
            <div className="mode-selector row g-2">
              <div className="col-4">
                <button 
                  className={`mode-btn w-100 btn border border-glass py-2 d-flex flex-column align-items-center gap-1 ${interactionMode === 'navigation' ? 'active' : ''}`}
                  onClick={() => setInteractionMode('navigation')}
                >
                  <Navigation size={16} />
                  <span>Navigate</span>
                </button>
              </div>
              <div className="col-4">
                <button 
                  className={`mode-btn w-100 btn border border-glass py-2 d-flex flex-column align-items-center gap-1 ${interactionMode === 'marker' ? 'active' : ''}`}
                  onClick={() => setInteractionMode('marker')}
                >
                  <MapPin size={16} />
                  <span>Marker</span>
                </button>
              </div>
              <div className="col-4">
                <button 
                  className={`mode-btn w-100 btn border border-glass py-2 d-flex flex-column align-items-center gap-1 ${interactionMode === 'polygon' ? 'active' : ''}`}
                  onClick={() => setInteractionMode('polygon')}
                >
                  <PenTool size={16} />
                  <span>Draw</span>
                </button>
              </div>
            </div>
          </div>

          <div className="stats-display row g-2">
            <div className="col-6">
              <div className="stat-item p-2 rounded bg-glass border border-glass text-center">
                <div className="stat-lbl text-secondary small">Markers placed</div>
                <div className="stat-val cyan fs-4 fw-bold">{markers.length}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="stat-item p-2 rounded bg-glass border border-glass text-center">
                <div className="stat-lbl text-secondary small">Polygon Area</div>
                <div className="stat-val purple fs-5 fw-bold mt-1">
                  {formatArea(polygonArea)}
                </div>
              </div>
            </div>
          </div>

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

          <div className="control-card p-3 rounded bg-glass border border-glass d-flex flex-column gap-2">
            <span className="card-title text-secondary small fw-bold text-uppercase tracking-wider">Actions & Operations</span>
            
            <div className="action-grid row g-2">
              <div className="col-6">
                <button className="secondary-btn btn w-100 border border-glass py-2" onClick={handleSaveState}>
                  <Save size={14} className="me-1" /> Save
                </button>
              </div>
              <div className="col-6">
                <button className="secondary-btn btn w-100 border border-glass py-2" onClick={handleLoadState}>
                  <RefreshCw size={14} className="me-1" /> Load
                </button>
              </div>
            </div>

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

          <div className="info-banner p-3 rounded border border-glass d-flex gap-2">
            <Info size={16} className="text-info mt-1 flex-shrink-0" />
            <div className="small text-secondary">
              <strong>Quick Guide:</strong><br />
              • <em>Navigate</em>: zoom and inspect details.<br />
              • <em>Marker</em>: click map to pin points.<br />
              • <em>Draw</em>: click map to build polygon vertices.
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-grow-1 h-100 w-100 position-relative">
        <MapContainer 
          markers={markers}
          polygonVertices={polygonVertices}
          interactionMode={interactionMode}
          onAddMarker={handleAddMarker}
          onAddVertex={handleAddVertex}
          flyToCoords={flyToCoords}
          onResetFlyTo={handleResetFlyTo}
        />
      </div>

      {toastMessage && (
        <div className="toast position-absolute bottom-0 end-0 m-3 d-flex align-items-center gap-2 p-2 px-3 rounded bg-glass border border-glass-active z-3 shadow-lg">
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: 'var(--glow-cyan)' }} />
          <span className="small text-white">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
