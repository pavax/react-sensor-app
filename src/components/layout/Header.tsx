import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faClock,
  faPalette,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

import { TimeRange } from "../../api/thingsboard-api";
import { useViewport } from "../../ViewportContext";

interface HeaderProps {
  onTimePeriodChange: (timePeriod: TimeRange) => void;
}

const Header: React.FC<HeaderProps> = ({ onTimePeriodChange }) => {
  const { isDarkMode, toggleTheme, toggleShowChartTooltip, showChartTooltips } =
    useViewport();

  const [showSettings, setShowSettings] = useState(false);

  const [timePeriod, setTimePeriod] = useState<TimeRange>(() => {
    const savedTimePeriod = localStorage.getItem("timePeriod");
    return savedTimePeriod ? (savedTimePeriod as TimeRange) : TimeRange.ONE_DAY;
  });

  const settingsRef = useRef<HTMLDivElement>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    localStorage.setItem("timePeriod", timePeriod);
    onTimePeriodChange(timePeriod);
  }, [timePeriod, onTimePeriodChange]);

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

  const toggleSettings = () => setShowSettings(!showSettings);

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as TimeRange);
  };

  return (
    <header className="App-header-menu">
      <h1><Link to="/">Sensor App</Link></h1>
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
                Dark Mode
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
            <div className="setting-item">
              <span>
                <FontAwesomeIcon icon={faInfo} className="setting-icon" />{" "}
                Tooltips Aktiv
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showChartTooltips}
                  onChange={toggleShowChartTooltip}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
