import React from 'react';

const Footer: React.FC = () => {

    const buildNumber = process.env.REACT_APP_BUILD_NUMBER;


  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <p className="text-center">&copy; {new Date().getFullYear()} Sensor App. All rights reserved.</p>
      {buildNumber && <p className="text-center text-sm mt-2">Build: {buildNumber}</p>}
    </footer>
  );
};

export default Footer;