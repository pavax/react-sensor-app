import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

interface ViewportContextType {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isDarkMode: boolean;
  showChartTooltips: boolean;
  toggleTheme: () => void;
  toggleShowChartTooltip: () => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(
  undefined
);

interface ViewportProviderProps {
  children: ReactNode;
}

export const ViewportProvider: React.FC<ViewportProviderProps> = ({
  children,
}) => {
  const [width, setWidth] = useState(window.innerWidth);

  const [height, setHeight] = useState(window.innerHeight);

  const [showChartTooltips, setShowChartTooltips] = useState<boolean>(() => {
    const savedShowChartTooltips =
      localStorage.getItem("showChartTooltips") ?? "true";
    return savedShowChartTooltips === "true";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  const toggleTheme = () => {
    return setIsDarkMode(!isDarkMode);
  };

  const toggleShowChartTooltip = () => {
    return setShowChartTooltips(!showChartTooltips);
  };

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(
    () =>
      localStorage.setItem("showChartTooltips", showChartTooltips.toString()),
    [showChartTooltips]
  );

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;

  return (
    <ViewportContext.Provider
      value={{
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isDarkMode,
        showChartTooltips,
        toggleTheme,
        toggleShowChartTooltip,
      }}
    >
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = (): ViewportContextType => {
  const context = useContext(ViewportContext);
  if (context === undefined) {
    throw new Error("useViewport must be used within a ViewportProvider");
  }
  return context;
};
