import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWater, faHouse, faTree } from '@fortawesome/free-solid-svg-icons';

const OverviewPage: React.FC = () => {
  const dashboards = [
    { name: 'Wetter-Sensor', path: '/dashboard/outdoor', icon: faTree },
    { name: 'Stube-Sensor', path: '/dashboard/indoor', icon: faHouse },
    { name: 'Wasser-Sensor', path: '/dashboard/water', icon: faWater }
  ];
  return (
    <div className="overview-page">
      <h1>Dashboards</h1>
      <div className="dashboard-grid">
        {dashboards.map((dashboard) => (
          <Link to={dashboard.path} key={dashboard.path} className="dashboard-card">
            <FontAwesomeIcon icon={dashboard.icon} className="dashboard-icon" />
            <span>{dashboard.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OverviewPage;