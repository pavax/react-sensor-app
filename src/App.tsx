import React, { useState, useEffect } from "react";
import { TimeRange, loginPublic } from "./api/thingsboard-api";
import "./App.css";
import Header from "./components/Header";
import Telemetry from "./components/Telemetry";
import { ViewportProvider } from "./ViewportContext";

function App() {

  const deviceId = process.env.REACT_APP_API_DEVICE_ID;

  const publicId = process.env.REACT_APP_TB_PUBLICID;

  const [currentTimePeriod, setCurrentTimePeriod] = useState<TimeRange>(
    TimeRange.ONE_DAY
  );

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const handleTimePeriodChange = (newTimePeriod: TimeRange) => {
    setCurrentTimePeriod(newTimePeriod);
  };

  useEffect(() => {
    const performLogin = async () => {
      if (!publicId) {
        setLoginError(
          "Error: REACT_APP_TB_PUBLICID is not set in the .env file"
        );
        return;
      }

      try {
        await loginPublic(publicId);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Login failed:", error);
        setLoginError("Failed to log in. Please try again later.");
      }
    };

    performLogin();
  }, [publicId]);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (loginError) {
    return <div>{loginError}</div>;
  }

  if (!isLoggedIn) {
    return <div>Logging in...</div>;
  }

  if (!deviceId) {
    return (
      <div>Error: REACT_APP_API_DEVICE_ID is not set in the .env file</div>
    );
  }

  return (
    <ViewportProvider>
      <div className="App">
        <Header
          onTimePeriodChange={handleTimePeriodChange}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        <main className="App-main">
          <Telemetry
            deviceId={deviceId}
            timeRange={currentTimePeriod}
            theme={isDarkMode ? "dark" : "light"}
          />
        </main>
      </div>
    </ViewportProvider>
  );
}

export default App;
