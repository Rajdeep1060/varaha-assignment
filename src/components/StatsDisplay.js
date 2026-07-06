import React from 'react';

const StatsDisplay = ({ markersCount, polygonArea, formatArea }) => {
  return (
    <div className="stats-display row g-2">
      <div className="col-6">
        <div className="stat-item p-2 rounded bg-glass border border-glass text-center">
          <div className="stat-lbl text-secondary small">Markers placed</div>
          <div className="stat-val cyan fs-4 fw-bold">{markersCount}</div>
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
  );
};

export default StatsDisplay;
