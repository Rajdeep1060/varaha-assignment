import React from 'react';
import { Info } from 'lucide-react';

const InfoBanner = () => {
  return (
    <div className="info-banner p-3 rounded border border-glass d-flex gap-2">
      <Info size={16} className="text-info mt-1 flex-shrink-0" />
      <div className="small text-secondary">
        <strong>Quick Guide:</strong><br />
        • <em>Navigate</em>: zoom and inspect details.<br />
        • <em>Marker</em>: click map to pin points.<br />
        • <em>Draw</em>: click map to build polygon vertices.
      </div>
    </div>
  );
};

export default InfoBanner;
