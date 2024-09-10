import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faPalette, faInfo } from "@fortawesome/free-solid-svg-icons";
import {
  Menu,
  MenuItems,
  MenuItem,
  MenuButton,
  Switch,
} from "@headlessui/react";
import { TimeRange } from "../../api/thingsboard-api";
import { useViewport } from "../../ViewportContext";

interface HeaderProps {
  onTimePeriodChange: (timePeriod: TimeRange) => void;
}

const Header: React.FC<HeaderProps> = ({ onTimePeriodChange }) => {

  const [timePeriod, setTimePeriod] = useState<TimeRange>(() => {
    const savedTimePeriod = localStorage.getItem("timePeriod");
    return savedTimePeriod ? (savedTimePeriod as TimeRange) : TimeRange.ONE_DAY;
  });

  useEffect(() => {
    localStorage.setItem("timePeriod", timePeriod);
    onTimePeriodChange(timePeriod);
  }, [timePeriod, onTimePeriodChange]);

  const { isDarkMode, toggleTheme, showChartTooltips, toggleShowChartTooltip } =
    useViewport();

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as TimeRange);
  };

  return (
    <header className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-4 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded"
            onChange={handleTimePeriodChange}
          >
            <option value={TimeRange.ONE_DAY}>Ein Tag</option>
            <option value={TimeRange.THREE_DAYS}>Drei Tage</option>
            <option value={TimeRange.ONE_WEEK}>Eine Woche</option>
            <option value={TimeRange.TWO_WEEKS}>Zwei Wochen</option>
            <option value={TimeRange.ONE_MONTH}>Ein Monat</option>
          </select>
          <Menu as="div" className="relative ml-3">
            <div>
              <MenuButton className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">
                <FontAwesomeIcon icon={faCog} />
              </MenuButton>
            </div>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-20 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <MenuItem>
                {({ active }) => (
                  <div className={`flex justify-between items-center w-full px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faPalette} className="mr-2" />
                      Dark Mode
                    </span>
                    <Switch
                      checked={isDarkMode}
                      onChange={toggleTheme}
                      className={`${
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span className="sr-only">Enable dark mode</span>
                      <span
                        className={`${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  </div>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <div className={`flex justify-between items-center w-full px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faInfo} className="mr-2" />
                      Tooltips
                    </span>
                    <Switch
                      checked={showChartTooltips}
                      onChange={toggleShowChartTooltip}
                      className={`${
                        showChartTooltips ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span className="sr-only">Enable tooltips</span>
                      <span
                        className={`${
                          showChartTooltips ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  </div>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
