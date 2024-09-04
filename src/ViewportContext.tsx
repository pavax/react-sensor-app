import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ViewportContextType {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

interface ViewportProviderProps {
  children: ReactNode;
}

export const ViewportProvider: React.FC<ViewportProviderProps> = ({ children }) => {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;

  return (
    <ViewportContext.Provider value={{ width, height, isMobile, isTablet, isDesktop }}>
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = (): ViewportContextType => {
  const context = useContext(ViewportContext);
  if (context === undefined) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};