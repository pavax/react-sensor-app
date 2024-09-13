import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";

import { TimeRange, loginPublic } from "./api/thingsboard-api";
import Footer from "./components/layout/Footer";
import OverviewPage from "./components/pages/OverviewPage";
import { ViewportProvider } from "./ViewportContext";
import "./App.css";
import DashboardPage from "./components/pages/DashboardPage";
import Header from "./components/layout/Header";

function App() {
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
                  path="/dashboard/:dashboardId"
                  element={<DashboardPage timeRange={currentTimePeriod} />}
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
