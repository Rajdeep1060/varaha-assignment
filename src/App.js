import React, { useRef } from 'react';
import './App.css';
import useMapState from './hooks/useMapState';
import SidebarHeader from './components/SidebarHeader';
import ModeSelector from './components/ModeSelector';
import StatsDisplay from './components/StatsDisplay';
import TabsSection from './components/TabsSection';
import ActionPanel from './components/ActionPanel';
import InfoBanner from './components/InfoBanner';
import MapContainer from './components/MapContainer';
import Toast from './components/Toast';

const App = () => {
  const fileInputRef = useRef(null);
  const {
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
  } = useMapState(fileInputRef);

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden d-flex flex-column-reverse flex-md-row">
      <aside className="sidebar w-sidebar-md w-100 h-100-md bg-glass border-end border-glass d-flex flex-column">
        <SidebarHeader />
        <div className="sidebar-content flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
          <ModeSelector 
            interactionMode={interactionMode} 
            setInteractionMode={setInteractionMode} 
          />
          <StatsDisplay 
            markersCount={markers.length} 
            polygonArea={polygonArea} 
            formatArea={formatArea} 
          />
          <TabsSection 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            markers={markers} 
            polygonVertices={polygonVertices} 
            handleListItemClick={handleListItemClick} 
            handleDeleteMarker={handleDeleteMarker} 
            handleDeleteVertex={handleDeleteVertex} 
          />
          <ActionPanel 
            handleExportGeoJSON={handleExportGeoJSON} 
            handleImportGeoJSON={handleImportGeoJSON} 
            handleClearMap={handleClearMap}
            fileInputRef={fileInputRef}
          />
          <InfoBanner />
        </div>
      </aside>

      <div className="flex-grow-1 position-relative">
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

      <Toast toastMessage={toastMessage} />
    </div>
  );
};

export default App;
