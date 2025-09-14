import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const { user } = useAuth();

  const SIDEBAR_WIDTH_PX = 260; // expanded width
  const SIDEBAR_COLLAPSED_PX = 60; // reduced collapsed width

  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof document !== 'undefined' && document.body.classList.contains('sidebar-collapsed')
  );

  useEffect(() => {
    const handler = () => {
      const collapsed = document.body.classList.contains('sidebar-collapsed');
      setIsCollapsed(collapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    // Also observe on mount in case state was changed elsewhere
    handler();
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  if (!user) {
    return children; // Don't show layout for login page
  }

  return (
    <Container fluid className="px-0 py-0">
      <div className="d-flex">
        {/* Left Sidebar */}
        <div 
          className="sidebar-column"
          style={{ 
            width: isCollapsed ? `${SIDEBAR_COLLAPSED_PX}px` : `${SIDEBAR_WIDTH_PX}px`,
            minWidth: isCollapsed ? `${SIDEBAR_COLLAPSED_PX}px` : `${SIDEBAR_WIDTH_PX}px`,
            maxWidth: isCollapsed ? `${SIDEBAR_COLLAPSED_PX}px` : `${SIDEBAR_WIDTH_PX}px`,
            flexShrink: 0,
            transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease'
          }}
        >
          <div className="sidebar-wrapper">
            {/* Sidebar Navigation */}
            <div>
              <Sidebar />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          className="main-content-column flex-grow-1"
          style={{ 
            width: isCollapsed ? `calc(100% - ${SIDEBAR_COLLAPSED_PX}px)` : `calc(100% - ${SIDEBAR_WIDTH_PX}px)`,
            minWidth: '300px',
            transition: 'width 0.2s ease'
          }}
        >
          {/* Topbar sits inside the main column */}
          <Navbar />
          <div className="main-content-wrapper">
            {children}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Layout;
