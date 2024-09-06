import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faClock,
  faPalette,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { TimeRange } from "../api/thingsboard-api";
import { useViewport } from "../ViewportContext";

interface HeaderProps {
  onTimePeriodChange: (timePeriod: TimeRange) => void;
}

const Header: React.FC<HeaderProps> = ({ onTimePeriodChange }) => {
  const { isDarkMode, toggleTheme } = useViewport();

  const [showSettings, setShowSettings] = useState(false);

  const [timePeriod, setTimePeriod] = useState<TimeRange>(() => {
    const savedTimePeriod = localStorage.getItem("timePeriod");
    return savedTimePeriod ? (savedTimePeriod as TimeRange) : TimeRange.ONE_DAY;
  });

  useEffect(() => {
    localStorage.setItem("timePeriod", timePeriod);
    onTimePeriodChange(timePeriod);
  }, [timePeriod, onTimePeriodChange]);

  const settingsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as TimeRange);
  };

  const buildNumber = process.env.REACT_APP_BUILD_NUMBER;

  return (
    <header className="App-header-menu">
      <h1>Sensor App</h1>
      <button
        ref={buttonRef}
        onClick={toggleSettings}
        className="hamburger-button"
      >
        <FontAwesomeIcon icon={showSettings ? faTimes : faBars} />
      </button>
      {showSettings && (
        <div ref={settingsRef} className="settings-menu">
          <div className="settings-header">
            <h2>Einstellungen</h2>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <span>
                <FontAwesomeIcon icon={faClock} className="setting-icon" />{" "}
                Zeitraum
              </span>
              <select value={timePeriod} onChange={handleTimePeriodChange}>
                <option value={TimeRange.ONE_DAY}>Ein Tag</option>
                <option value={TimeRange.THREE_DAYS}>Drei Tage</option>
                <option value={TimeRange.ONE_WEEK}>Eine Woche</option>
                <option value={TimeRange.TWO_WEEKS}>Zwei Wochen</option>
                <option value={TimeRange.ONE_MONTH}>Ein Monat</option>
              </select>
            </div>
            <div className="setting-item">
              <span>
                <FontAwesomeIcon icon={faPalette} className="setting-icon" />{" "}
                Farb-Modus
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleTheme}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {buildNumber && (
              <>
                <hr className="settings-divider" />
                <div className="setting-item">
                  <span className="version-info">
                    <FontAwesomeIcon icon={faCog} className="setting-icon" />{" "}
                    App-Version
                  </span>
                  <div>
                    <span className="version-info">{buildNumber}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
