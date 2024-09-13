import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { TimeRange } from "../../api/thingsboard-api";

interface ContextInfoBarProps {
  title?: string;
  timeRange: TimeRange;
  latestTimestamp: string;
  additionalData?: Map<String, String>;
}

const timeRangeLabels: { [key in TimeRange]: string } = {
  [TimeRange.ONE_DAY]: "Ein Tag",
  [TimeRange.THREE_DAYS]: "Drei Tage",
  [TimeRange.ONE_WEEK]: "Eine Woche",
  [TimeRange.TWO_WEEKS]: "Zwei Wochen",
  [TimeRange.ONE_MONTH]: "Ein Monat",
};

const ContextInfoBar: React.FC<ContextInfoBarProps> = ({
  title,
  timeRange,
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
      {title && <h2>{title}</h2>}
      {timeRange && (
        <div>
          <span>Zeitraum: </span>
          <strong>{timeRangeLabels[timeRange]}</strong>
        </div>
      )}
      <div>
        <span>Letztes Update: </span>
        <strong>{latestTimestamp}</strong>
      </div>

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
