import { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';

const useMapState = (fileInputRef) => {
  const [markers, setMarkers] = useState(() => {
    try {
      const savedState = localStorage.getItem('mapbox_map_state');
      if (savedState) {
        const { savedMarkers } = JSON.parse(savedState);
        if (Array.isArray(savedMarkers)) return savedMarkers;
      }
    } catch (e) {}
    return [];
  });

  const [polygonVertices, setPolygonVertices] = useState(() => {
    try {
      const savedState = localStorage.getItem('mapbox_map_state');
      if (savedState) {
        const { savedVertices } = JSON.parse(savedState);
        if (Array.isArray(savedVertices)) return savedVertices;
      }
    } catch (e) {}
    return [];
  });

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
    const stateToSave = {
      savedMarkers: markers,
      savedVertices: polygonVertices
    };
    localStorage.setItem('mapbox_map_state', JSON.stringify(stateToSave));
  }, [markers, polygonVertices]);

  const handleClearMap = useCallback(() => {
    setMarkers([]);
    setPolygonVertices([]);
    setPolygonArea(0);
    showToast('Map cleared');
  }, [showToast]);

  const handleAddMarker = useCallback((lng, lat) => {
    const newMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lng,
      lat
    };
    setMarkers(prev => [...prev, newMarker]);
    showToast(`Marker added`);
  }, [showToast]);

  const handleAddVertex = useCallback((lng, lat) => {
    setPolygonVertices(prev => [...prev, [lng, lat]]);
    showToast(`Polygon vertex added`);
  }, [showToast]);

  const handleDeleteMarker = useCallback((id, e) => {
    e.stopPropagation();
    setMarkers(prev => prev.filter(m => m.id !== id));
    showToast('Marker removed');
  }, [showToast]);

  const handleDeleteVertex = useCallback((index, e) => {
    e.stopPropagation();
    setPolygonVertices(prev => prev.filter((_, i) => i !== index));
    showToast('Vertex removed');
  }, [showToast]);

  const handleListItemClick = useCallback((lng, lat) => {
    setFlyToCoords([lng, lat]);
  }, []);

  const handleResetFlyTo = useCallback(() => {
    setFlyToCoords(null);
  }, []);

  const handleExportGeoJSON = useCallback(() => {
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
  }, [markers, polygonVertices, polygonArea, showToast]);

  const handleImportGeoJSON = useCallback((e) => {
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
  }, [showToast]);

  const formatArea = useCallback((area) => {
    if (area === 0) return '0.00 m²';
    if (area < 1000000) {
      return `${area.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
    }
    return `${(area / 1000000).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} km²`;
  }, []);

  return {
    markers,
    polygonVertices,
    interactionMode,
    setInteractionMode,
    activeTab,
    setActiveTab,
    flyToCoords,
    polygonArea,
    toastMessage,
    handleAddMarker,
    handleAddVertex,
    handleDeleteMarker,
    handleDeleteVertex,
    handleListItemClick,
    handleResetFlyTo,
    handleExportGeoJSON,
    handleImportGeoJSON,
    handleClearMap,
    formatArea
  };
};

export default useMapState;
