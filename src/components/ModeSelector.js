import React from 'react';
import { Navigation, MapPin, PenTool } from 'lucide-react';

const ModeSelector = ({ interactionMode, setInteractionMode }) => {
  return (
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
  );
};

export default ModeSelector;
