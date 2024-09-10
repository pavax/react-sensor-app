import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import React from "react";

interface LatestTimestampProps {
  latestTimestamp: string;
  additionalData?: Map<String, String>;
}

const ContextInfoBar: React.FC<LatestTimestampProps> = ({
  latestTimestamp,
  additionalData,
}) => {
  if (!latestTimestamp) {
    return null;
  }

  return (
    <Disclosure>
      {({ open }) => (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <DisclosureButton className="w-full text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Daten von: </span>
                <strong className="text-gray-800 dark:text-gray-200">{latestTimestamp}</strong>
              </div>
              {additionalData && additionalData.size > 0 && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
                    open ? "transform rotate-180" : ""
                  }`}
                />
              )}
            </div>
          </DisclosureButton>
          {additionalData && additionalData.size > 0 && (
            <DisclosurePanel  className="mt-4 space-y-2">
              {Array.from(additionalData).map(([key, value]) => (
                <p key={key.toString()} className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{key}:</span> {value}
                </p>
              ))}
            </DisclosurePanel >
          )}
        </div>
      )}
    </Disclosure>
  );
};

export default ContextInfoBar;
