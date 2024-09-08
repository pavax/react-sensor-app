import React from 'react';

const Footer: React.FC = () => {

    const buildNumber = process.env.REACT_APP_BUILD_NUMBER;


  return (
    <footer className="App-footer">
      <p>&copy; {new Date().getFullYear()} Sensor App. All rights reserved.</p>
      {buildNumber && <p>Build: {buildNumber}</p>}
    </footer>
  );
};

export default Footer;