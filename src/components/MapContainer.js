import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const activeMarkersRef = useRef([]);
  const interactionModeRef = useRef(interactionMode);
  const latestMarkersRef = useRef(markers);
  const polygonVerticesRef = useRef(polygonVertices);
  const onAddMarkerRef = useRef(onAddMarker);
  const onAddVertexRef = useRef(onAddVertex);

  interactionModeRef.current = interactionMode;
  latestMarkersRef.current = markers;
  polygonVerticesRef.current = polygonVertices;
  onAddMarkerRef.current = onAddMarker;
  onAddVertexRef.current = onAddVertex;

  const createMarkerElement = () => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cssText = 'width:20px;height:20px;background-color:#00f2fe;border-radius:50%;border:3px solid #fff;cursor:pointer;box-shadow:0 0 15px rgba(0,242,254,0.4)';
    return el;
  };

  const syncMarkers = useCallback((currentMarkers, mapInstance) => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    const currentMarkersMap = new Map(activeMarkersRef.current.map(m => [m.id, m.markerInstance]));
    const newMarkersList = [];

    currentMarkers.forEach((marker, index) => {
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
        const popup = markerInstance.getPopup();
        if (popup) popup.setHTML(popupContent);
        newMarkersList.push({ id: marker.id, markerInstance });
        currentMarkersMap.delete(marker.id);
      } else {
        const popup = new maplibregl.Popup({ offset: 15, closeButton: true })
          .setHTML(popupContent);

        const markerInstance = new maplibregl.Marker({ element: createMarkerElement() })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        newMarkersList.push({ id: marker.id, markerInstance });
      }
    });

    currentMarkersMap.forEach((markerInstance) => {
      markerInstance.remove();
    });

    activeMarkersRef.current = newMarkersList;
  }, []);

  const updatePolygonLayers = useCallback((vertices, mapInstance) => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    const polygonSource = map.getSource('polygon-source');
    const verticesSource = map.getSource('vertices-source');
    if (!polygonSource || !verticesSource) return;

    let polygonGeoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (vertices.length === 1) {
      polygonGeoJson.features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: vertices[0] }
      });
    } else if (vertices.length === 2) {
      polygonGeoJson.features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: vertices }
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

    verticesSource.setData({
      type: 'FeatureCollection',
      features: vertices.map((v, i) => ({
        type: 'Feature',
        properties: { index: i },
        geometry: { type: 'Point', coordinates: v }
      }))
    });
  }, []);

  const setupMapSources = useCallback((mapInstance) => {
    if (mapInstance.getSource('polygon-source')) return;

    mapInstance.addSource('polygon-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    mapInstance.addSource('vertices-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    mapInstance.addLayer({
      id: 'polygon-fill',
      type: 'fill',
      source: 'polygon-source',
      paint: { 'fill-color': '#7f00ff', 'fill-opacity': 0.18 },
      filter: ['==', '$type', 'Polygon']
    });

    mapInstance.addLayer({
      id: 'polygon-outline',
      type: 'line',
      source: 'polygon-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#00f2fe', 'line-width': 3, 'line-opacity': 0.85 }
    });

    mapInstance.addLayer({
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

    mapInstance.addLayer({
      id: 'vertices-circle-inner',
      type: 'circle',
      source: 'vertices-source',
      paint: { 'circle-radius': 4, 'circle-color': '#ffffff' }
    });
  }, []);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: freeMapStyle,
      center: [77.7125, 12.9645],
      zoom: 13,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleLoad = () => {
      mapRef.current = map;
      setupMapSources(map);

      map.once('idle', () => {
        if (!mapRef.current) return;
        mapRef.current.resize();
        updatePolygonLayers(polygonVerticesRef.current, mapRef.current);
        syncMarkers(latestMarkersRef.current, mapRef.current);
      });
    };

    if (map.isStyleLoaded()) {
      handleLoad();
    } else {
      map.on('load', handleLoad);
    }

    map.on('click', (e) => {
      const mode = interactionModeRef.current;
      if (mode === 'marker') {
        onAddMarkerRef.current(e.lngLat.lng, e.lngLat.lat);
      } else if (mode === 'polygon') {
        onAddVertexRef.current(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      if (mapRef.current) {
        activeMarkersRef.current.forEach(({ markerInstance }) => markerInstance.remove());
        activeMarkersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupMapSources, syncMarkers, updatePolygonLayers]);

  useEffect(() => {
    syncMarkers(markers);
  }, [markers, syncMarkers]);

  useEffect(() => {
    updatePolygonLayers(polygonVertices);
  }, [polygonVertices, updatePolygonLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoords) return;
    map.flyTo({ center: flyToCoords, zoom: 15, essential: true, duration: 1800 });
    onResetFlyTo();
  }, [flyToCoords, onResetFlyTo]);

  return (
    <div className="position-absolute top-0 start-0 w-100 h-100">
      <div ref={mapContainerRef} className="w-100 h-100" />
    </div>
  );
};

export default MapContainer;
