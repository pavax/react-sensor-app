import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { TimeRange, loginPublic } from "./api/thingsboard-api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Telemetry from "./components/Telemetry";
import OverviewPage from "./components/OverviewPage";
import { ViewportProvider } from "./ViewportContext";
import "./App.css";

function App() {
  const deviceId = process.env.REACT_APP_API_DEVICE_ID;
  const publicId = process.env.REACT_APP_TB_PUBLICID;
  const [currentTimePeriod, setCurrentTimePeriod] = useState<TimeRange | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
    <BrowserRouter>
      <ViewportProvider>
        <div className="App">
          <Header onTimePeriodChange={handleTimePeriodChange} />
          {currentTimePeriod ? (
            <main className="App-main">
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route
                  path="/outdoor"
                  element={
                    <Telemetry
                      deviceId={deviceId}
                      timeRange={currentTimePeriod}
                    />
                  }
                />
                {/* Add more routes for other dashboards here */}
              </Routes>
            </main>
          ) : (
            <div>Please select a time period</div>
          )}
          <Footer />
        </div>
      </ViewportProvider>
    </BrowserRouter>
  );
}

export default App;
