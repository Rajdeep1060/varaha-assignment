import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 100% Free Style configuration using CARTO Dark Matter raster tiles
const freeMapStyle = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

const MapContainer = ({
  markers,
  polygonVertices,
  interactionMode,
  onAddMarker,
  onAddVertex,
  flyToCoords,
  onResetFlyTo
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]); // Keeps track of maplibregl.Marker: [{ id, markerInstance }]
  const interactionModeRef = useRef(interactionMode);

  // Keep interaction mode updated inside callbacks to avoid stale closure issues
  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  // Initialize Maplibre Map
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: freeMapStyle,
      center: [8.5417, 47.3769], // Zurich, Switzerland
      zoom: 13,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      mapRef.current = map;

      // Add sources for Polygon Shape and Polygon Vertices
      map.addSource('polygon-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addSource('vertices-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Layer 1: Translucent Purple Polygon Fill
      map.addLayer({
        id: 'polygon-fill',
        type: 'fill',
        source: 'polygon-source',
        paint: {
          'fill-color': '#7f00ff',
          'fill-opacity': 0.18
        },
        filter: ['==', '$type', 'Polygon']
      });

      // Layer 2: Glowing Cyan Polygon Boundary Line
      map.addLayer({
        id: 'polygon-outline',
        type: 'line',
        source: 'polygon-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00f2fe',
          'line-width': 3,
          'line-opacity': 0.85
        }
      });

      // Layer 3: Vertices Outer Neon Ring
      map.addLayer({
        id: 'vertices-circle-glow',
        type: 'circle',
        source: 'vertices-source',
        paint: {
          'circle-radius': 8,
          'circle-color': '#7f00ff',
          'circle-opacity': 0.4,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#00f2fe'
        }
      });

      // Layer 4: Vertices Inner Dot
      map.addLayer({
        id: 'vertices-circle-inner',
        type: 'circle',
        source: 'vertices-source',
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff'
        }
      });

      // Refresh layers if data was loaded from localStorage
      updatePolygonLayers(polygonVertices);
    });

    // Handle Map Canvas Clicks
    map.on('click', (e) => {
      const mode = interactionModeRef.current;
      if (mode === 'marker') {
        onAddMarker(e.lngLat.lng, e.lngLat.lat);
      } else if (mode === 'polygon') {
        onAddVertex(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      if (mapRef.current) {
        // Clear all active DOM markers
        markersRef.current.forEach(({ markerInstance }) => markerInstance.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync React Markers state array to Maplibre Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkersMap = new Map(markersRef.current.map(m => [m.id, m.markerInstance]));
    const newMarkersList = [];

    markers.forEach((marker, index) => {
      const popupContent = `
        <div>
          <div class="popup-title">Marker #${index + 1}</div>
          <span class="popup-coords">
            Lng: ${marker.lng.toFixed(6)}<br/>
            Lat: ${marker.lat.toFixed(6)}
          </span>
        </div>
      `;

      if (currentMarkersMap.has(marker.id)) {
        const markerInstance = currentMarkersMap.get(marker.id);
        markerInstance.setLngLat([marker.lng, marker.lat]);
        // Update popup text if marker index shifted
        const popup = markerInstance.getPopup();
        if (popup) popup.setHTML(popupContent);
        newMarkersList.push({ id: marker.id, markerInstance });
        currentMarkersMap.delete(marker.id);
      } else {
        // Build custom HTML elements for pulsing neon marker styling
        const el = document.createElement('div');
        el.className = 'custom-marker';

        const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
          .setHTML(popupContent);

        const markerInstance = new maplibregl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        newMarkersList.push({ id: marker.id, markerInstance });
      }
    });

    // Remove obsolete markers from canvas
    currentMarkersMap.forEach((markerInstance) => {
      markerInstance.remove();
    });

    markersRef.current = newMarkersList;
  }, [markers]);

  // GeoJSON Source Helper
  const updatePolygonLayers = (vertices) => {
    const map = mapRef.current;
    if (!map) return;

    const polygonSource = map.getSource('polygon-source');
    const verticesSource = map.getSource('vertices-source');
    if (!polygonSource || !verticesSource) return;

    // 1. Compile polygon overlay source
    let polygonGeoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (vertices.length === 1) {
      polygonGeoJson.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: vertices[0]
        }
      });
    } else if (vertices.length === 2) {
      polygonGeoJson.features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: vertices
        }
      });
    } else if (vertices.length >= 3) {
      polygonGeoJson.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...vertices, vertices[0]]]
        }
      });
    }

    polygonSource.setData(polygonGeoJson);

    // 2. Compile points source for individual vertices
    const verticesGeoJson = {
      type: 'FeatureCollection',
      features: vertices.map((v, i) => ({
        type: 'Feature',
        properties: { index: i },
        geometry: {
          type: 'Point',
          coordinates: v
        }
      }))
    };

    verticesSource.setData(verticesGeoJson);
  };

  // Sync React Polygon vertices state to Maplibre Sources
  useEffect(() => {
    updatePolygonLayers(polygonVertices);
  }, [polygonVertices]);

  // Handle sidebar center clicks / camera fly triggers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoords) return;

    map.flyTo({
      center: flyToCoords,
      zoom: 15,
      essential: true,
      duration: 1800
    });

    onResetFlyTo();
  }, [flyToCoords, onResetFlyTo]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};

export default MapContainer;
