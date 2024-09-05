import React from 'react';
import Slider from 'react-slick';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTemperatureLow, faWind, faCloudRain, faTachometerAlt, faSnowflake, faSun } from '@fortawesome/free-solid-svg-icons';
import { ProcessedData } from '../api/data-processing';
import { useViewport } from '../ViewportContext';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

interface OverviewCardsProps {
  data: ProcessedData;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => {
  const { isMobile, isTablet } = useViewport();

  const getCardSize = () => {
    if (isMobile) return 80;
    if (isTablet) return 90;
    return 100;
  };

  const cardSize = getCardSize();

  const cards = [
    {
      title: 'Temperatur',
      value: data.entries.temperature?.latestValue?.toFixed(1) ?? '--',
      unit: '°C',
      icon: faTemperatureLow,
      color: '#8e44ad', // Purple, matching the "Temperatur" label
    },
    {
      title: 'Wind',
      value: data.entries.windVoltageMax?.latestValue?.toFixed(1) ?? '--',
      unit: 'm/s',
      icon: faWind,
      color: '#3498db', // Blue, similar to the graph line
    },
    {
      title: 'Regen',
      value: data.entries.rainEventAccDifference?.latestValue?.toFixed(1) ?? '--',
      unit: 'mm',
      icon: faCloudRain,
      color: '#2ecc71', // Green, complementary to the existing colors
    },
    {
      title: 'Luftdruck',
      value: '--',
      unit: '',
      icon: faTachometerAlt,
      color: '#e74c3c', // Red, for variety but still in theme
    },
    {
      title: 'Schnee',
      value: '--',
      unit: '',
      icon: faSnowflake,
      color: '#34495e', // Dark blue, fitting the dark theme
    },
    {
      title: 'UV-Index',
      value: data.entries.uvIndex?.latestValue?.toFixed(0) ?? '--',
      unit: '',
      icon: faSun,
      color: '#f39c12', // Orange, complementary to the blue
    },
  ];

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 1,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      }
    ]
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
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <FontAwesomeIcon icon={card.icon} className="card-icon" style={{ fontSize: `${cardSize * 0.25}px`, marginBottom: '0.25rem' }} />
              <h3 style={{ fontSize: `${cardSize * 0.11}px`, margin: '0', fontWeight: 'normal' }}>{card.title}</h3>
              <p className="card-value" style={{ fontSize: `${cardSize * 0.15}px`, fontWeight: 'bold', margin: '0.25rem 0' }}>{card.value}{card.unit}</p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default OverviewCards;