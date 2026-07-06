import React from 'react';
import { Map } from 'lucide-react';

const SidebarHeader = () => {
  return (
    <header className="sidebar-header d-flex align-items-center gap-2 p-3 border-bottom border-glass">
      <Map size={24} className="header-icon" />
      <h1 className="m-0 fs-5 fw-bold text-white">VaraMap Studio</h1>
      <span className="badge rounded-pill bg-info text-dark ms-auto">v1.0</span>
    </header>
  );
};

export default SidebarHeader;
