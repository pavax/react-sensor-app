import React from "react";
import Slider, { Settings } from "react-slick";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { useViewport } from "../../ViewportContext";


interface OverviewCardsProps {
  cards: OverviewCardData[];
}

export interface OverviewCardData {
  title: string;
  value: string | number;
  unit: string;
  icon: IconDefinition;
  color: string;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ cards }) => {
  const { isMobile, isTablet } = useViewport();

  const getCardSize = () => {
    if (isMobile) return 80;
    if (isTablet) return 90;
    return 100;
  };

  const cardSize = getCardSize();

  const settings: Settings = {
    dots: false,
    arrows: false,
    infinite: false,
    speed: 800,
    slidesToShow: 8,
    slidesToScroll: 1,
    adaptiveHeight: true,
    swipeToSlide: true,
    swipe: true,
    touchThreshold: 5,
    touchMove: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          dots: true,
          arrows: false,
          slidesToShow: 5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          dots: true,
          arrows: false,
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="overview-cards-container">
      <Slider {...settings}>
        {cards.map((card, index) => (
          <div key={index} className="overview-card-wrapper">
            <div
              className="overview-card"
              style={{
                backgroundColor: card.color,
                width: `${cardSize}px`,
                height: `${cardSize}px`,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "#FFFFFF",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                borderRadius: "15px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className="card-icon"
                style={{
                  fontSize: `${cardSize * 0.25}px`,
                  marginBottom: "0.25rem",
                }}
              />
              <h3
                style={{
                  fontSize: `${cardSize * 0.11}px`,
                  margin: "0",
                  fontWeight: "normal",
                }}
              >
                {card.title}
              </h3>
              <p
                className="card-value"
                style={{
                  fontSize: `${cardSize * 0.15}px`,
                  fontWeight: "bold",
                  margin: "0.25rem 0",
                }}
              >
                {card.value}
                {card.unit}
              </p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default OverviewCards;
