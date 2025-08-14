import React, { useState, useEffect } from 'react';
import { fetchCurrentQuote } from '../services/stockService';
import '../styles/LiveQuote.css';

function LiveQuote({ symbol }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCurrentQuote(symbol);
        setQuote(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message);
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading && !quote) {
    return <div className="live-quote loading">Loading live quote...</div>;
  }

  if (error && !quote) {
    return <div className="live-quote error">Error: {error}</div>;
  }

  if (!quote) {
    return null;
  }

  const isPositive = quote.change >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeSymbol = isPositive ? '+' : '';

  return (
    <div className="live-quote">
      <div className="quote-header">
        <h3 className="symbol">{quote.symbol}</h3>
        <span className="timestamp">
          {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
        </span>
      </div>
      
      <div className="quote-main">
        <div className="price-section">
          <span className="current-price">${quote.price?.toFixed(2) || 'N/A'}</span>
          <div className={`change-info ${changeClass}`}>
            <span className="change">
              {changeSymbol}{quote.change?.toFixed(2) || '0.00'}
            </span>
            <span className="change-percent">
              ({changeSymbol}{quote.changePercent?.toFixed(2) || '0.00'}%)
            </span>
          </div>
        </div>
        
        <div className="quote-details">
          <div className="detail-item">
            <span className="label">Open:</span>
            <span className="value">${quote.open?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">High:</span>
            <span className="value">${quote.dayHigh?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Low:</span>
            <span className="value">${quote.dayLow?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Volume:</span>
            <span className="value">{quote.volume?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Avg Volume:</span>
            <span className="value">{quote.avgVolume?.toLocaleString() || 'N/A'}</span>
          </div>
          {quote.marketCap && (
            <div className="detail-item">
              <span className="label">Market Cap:</span>
              <span className="value">{formatMarketCap(quote.marketCap)}</span>
            </div>
          )}
        </div>
        
        {/* 52-Week Range Section */}
        {(quote.fiftyTwoWeekHigh || quote.fiftyTwoWeekLow) && (
          <div className="week-range-section">
            <h4>52-Week Range</h4>
            <div className="range-info">
              <div className="range-bar">
                <div className="range-track">
                  <div 
                    className="range-current" 
                    style={{ 
                      left: `${((quote.price - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="range-labels">
                  <span className="range-low">${quote.fiftyTwoWeekLow?.toFixed(2)}</span>
                  <span className="range-high">${quote.fiftyTwoWeekHigh?.toFixed(2)}</span>
                </div>
              </div>
              <div className="range-stats">
                <div className="stat-item">
                  <span className="stat-label">From 52W High:</span>
                  <span className={`stat-value ${quote.nearFiftyTwoWeekHigh < 90 ? 'negative' : 'neutral'}`}>
                    {quote.nearFiftyTwoWeekHigh?.toFixed(1)}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">From 52W Low:</span>
                  <span className={`stat-value ${quote.nearFiftyTwoWeekLow > 200 ? 'positive' : 'neutral'}`}>
                    {quote.nearFiftyTwoWeekLow?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Key Metrics Section */}
        {(quote.peRatio || quote.beta || quote.dividendYield) && (
          <div className="key-metrics-section">
            <h4>Key Metrics</h4>
            <div className="metrics-grid">
              {quote.peRatio && (
                <div className="metric-item">
                  <span className="metric-label">P/E Ratio:</span>
                  <span className="metric-value">{quote.peRatio.toFixed(2)}</span>
                </div>
              )}
              {quote.beta && (
                <div className="metric-item">
                  <span className="metric-label">Beta:</span>
                  <span className="metric-value">{quote.beta.toFixed(2)}</span>
                </div>
              )}
              {quote.dividendYield && (
                <div className="metric-item">
                  <span className="metric-label">Div Yield:</span>
                  <span className="metric-value">{(quote.dividendYield * 100).toFixed(2)}%</span>
                </div>
              )}
              {quote.earningsPerShare && (
                <div className="metric-item">
                  <span className="metric-label">EPS:</span>
                  <span className="metric-value">${quote.earningsPerShare.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="refresh-indicator">
          <span>🔄 Refreshing...</span>
        </div>
      )}
    </div>
  );
}

function formatMarketCap(marketCap) {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap?.toLocaleString() || 'N/A'}`;
  }
}

export default LiveQuote;
