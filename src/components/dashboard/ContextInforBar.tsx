import React, { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface LatestTimestampProps {
  latestTimestamp: string;
  additionalData?: Map<String, String>;
}

const ContextInfoBar: React.FC<LatestTimestampProps> = ({
  latestTimestamp,
  additionalData,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!latestTimestamp) {
    return null;
  }

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div
      className={`context-information ${expanded ? "expanded" : ""}`}
      onClick={toggleExpand}
    >
      <span>Daten von: </span>
      <strong>{latestTimestamp}</strong>
      {additionalData && additionalData.size > 0 && (
        <>
          <div className="additional-info">
            {Array.from(additionalData).map(([key, value]) => (
              <p key={key.toString()}>
                {key}: {value}
              </p>
            ))}
          </div>
          <div className="latch-icon-container">
            <FontAwesomeIcon icon={faChevronDown} className="latch-icon" />
          </div>
        </>
      )}
    </div>
  );
};

export default ContextInfoBar;
