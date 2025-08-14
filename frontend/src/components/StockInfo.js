import React from 'react';
import '../styles/StockInfo.css';

function StockInfo({ company, timeRange, onTimeRangeChange }) {
  const timeRanges = [
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '5y', label: '5Y' },
  ];

  return (
    <div className="stock-info">
      <div className="company-header">
        <div className="company-title">
          <h2>{company.name}</h2>
          <span className="company-symbol">{company.symbol}</span>
          {company.exchange && <span className="company-exchange">{company.exchange}</span>}
        </div>
        
        <div className="company-meta">
          {company.sector && (
            <span className="sector-badge">{company.sector}</span>
          )}
          {company.industry && (
            <span className="industry-badge">{company.industry}</span>
          )}
        </div>
      </div>
      
      <div className="time-range-selector">
        {timeRanges.map(range => (
          <button
            key={range.value}
            className={`time-range-btn ${timeRange === range.value ? 'active' : ''}`}
            onClick={() => onTimeRangeChange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
      
      {company.description && (
        <div className="company-description">
          <h3>About {company.name}</h3>
          <p>{company.description}</p>
        </div>
      )}
    </div>
  );
}

export default StockInfo;
