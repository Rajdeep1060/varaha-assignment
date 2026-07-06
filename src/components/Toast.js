import React from 'react';

const Toast = ({ toastMessage }) => {
  if (!toastMessage) return null;
  return (
    <div className="toast position-absolute bottom-0 end-0 m-3 d-flex align-items-center gap-2 p-2 px-3 rounded bg-glass border border-glass-active z-3 shadow-lg">
      <div className="toast-dot" />
      <span className="small text-white">{toastMessage}</span>
    </div>
  );
};

export default Toast;
