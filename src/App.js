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
  Info, 
  Menu, 
  X 
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
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
    <div className="app-container">
      <button 
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(prev => !prev)}
        aria-label="Toggle Navigation Panel"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <header className="sidebar-header">
          <Map size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1>VaraMap Studio</h1>
          <span>v1.0</span>
        </header>

        <div className="sidebar-content">
          <div className="control-card">
            <span className="card-title">Interaction Mode</span>
            <div className="mode-selector">
              <button 
                className={`mode-btn ${interactionMode === 'navigation' ? 'active' : ''}`}
                onClick={() => setInteractionMode('navigation')}
              >
                <Navigation size={18} />
                Navigate
              </button>
              <button 
                className={`mode-btn ${interactionMode === 'marker' ? 'active' : ''}`}
                onClick={() => setInteractionMode('marker')}
              >
                <MapPin size={18} />
                Add Marker
              </button>
              <button 
                className={`mode-btn ${interactionMode === 'polygon' ? 'active' : ''}`}
                onClick={() => setInteractionMode('polygon')}
              >
                <PenTool size={18} />
                Draw Poly
              </button>
            </div>
          </div>

          <div className="stats-display">
            <div className="stat-item">
              <div className="stat-lbl">Markers placed</div>
              <div className="stat-val cyan">{markers.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-lbl">Polygon Area</div>
              <div className="stat-val purple" style={{ fontSize: polygonArea >= 1000000 ? '1rem' : '1.25rem' }}>
                {formatArea(polygonArea)}
              </div>
            </div>
          </div>

          <div className="control-card" style={{ flex: 1, minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'markers' ? 'active' : ''}`}
                onClick={() => setActiveTab('markers')}
              >
                Markers ({markers.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'vertices' ? 'active' : ''}`}
                onClick={() => setActiveTab('vertices')}
              >
                Polygon Vertices ({polygonVertices.length})
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
              {activeTab === 'markers' ? (
                <div className="list-container">
                  {markers.length === 0 ? (
                    <div className="list-empty">
                      No markers placed yet. Switch to "Add Marker" mode and click on the map.
                    </div>
                  ) : (
                    markers.map((m, idx) => (
                      <div 
                        key={m.id} 
                        className="list-item"
                        onClick={() => handleListItemClick(m.lng, m.lat)}
                      >
                        <div className="list-item-info">
                          <span className="list-item-title">Marker #{idx + 1}</span>
                          <span className="list-item-subtitle">
                            {m.lng.toFixed(5)}, {m.lat.toFixed(5)}
                          </span>
                        </div>
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDeleteMarker(m.id, e)}
                          title="Remove Marker"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="list-container">
                  {polygonVertices.length === 0 ? (
                    <div className="list-empty">
                      No polygon vertices drawn yet. Switch to "Draw Poly" mode and click on the map.
                    </div>
                  ) : (
                    polygonVertices.map((v, idx) => (
                      <div 
                        key={idx} 
                        className="list-item"
                        onClick={() => handleListItemClick(v[0], v[1])}
                      >
                        <div className="list-item-info">
                          <span className="list-item-title">Vertex #{idx + 1}</span>
                          <span className="list-item-subtitle">
                            {v[0].toFixed(5)}, {v[1].toFixed(5)}
                          </span>
                        </div>
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDeleteVertex(idx, e)}
                          title="Remove Vertex"
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

          <div className="control-card">
            <span className="card-title">Actions & Operations</span>
            
            <div className="action-grid" style={{ marginBottom: '8px' }}>
              <button className="secondary-btn" onClick={handleSaveState}>
                <Save size={14} /> Save
              </button>
              <button className="secondary-btn" onClick={handleLoadState}>
                <RefreshCw size={14} /> Load
              </button>
            </div>

            <div className="action-grid" style={{ marginBottom: '8px' }}>
              <button className="secondary-btn" onClick={handleExportGeoJSON}>
                <Download size={14} /> Export
              </button>
              <button className="secondary-btn">
                <label className="import-btn-label">
                  <Upload size={14} /> Import
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

            <button className="danger-btn" style={{ width: '100%' }} onClick={handleClearMap}>
              <Trash2 size={14} /> Clear Active Map
            </button>
          </div>

          <div className="info-banner">
            <Info size={16} className="info-banner-icon" />
            <div>
              <strong>Quick Guide:</strong><br />
              • <em>Navigate</em>: zoom and inspect details.<br />
              • <em>Add Marker</em>: click map to pin point.<br />
              • <em>Draw Poly</em>: click map to build vertices. Area renders automatically if vertices ≥ 3.
            </div>
          </div>
        </div>
      </aside>

      <MapContainer 
        markers={markers}
        polygonVertices={polygonVertices}
        interactionMode={interactionMode}
        onAddMarker={handleAddMarker}
        onAddVertex={handleAddVertex}
        flyToCoords={flyToCoords}
        onResetFlyTo={handleResetFlyTo}
      />

      {toastMessage && (
        <div className="toast">
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: 'var(--glow-cyan)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
