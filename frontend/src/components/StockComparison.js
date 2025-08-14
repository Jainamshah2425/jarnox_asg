import React, { useState, useEffect } from 'react';
import { compareStocks, fetchCurrentQuote } from '../services/stockService';
import '../styles/StockComparison.css';

function StockComparison() {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA']);
  const [comparisonData, setComparisonData] = useState(null);
  const [currentQuotes, setCurrentQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1m');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching data for symbols:', symbols, 'timeRange:', timeRange);

        // Fetch comparison data and current quotes in parallel
        const [compData, ...quotes] = await Promise.all([
          compareStocks(symbols, timeRange),
          ...symbols.map(symbol => fetchCurrentQuote(symbol))
        ]);

        console.log('Comparison data:', compData);
        console.log('Quotes:', quotes);

        setComparisonData(compData);
        
        const quotesObj = {};
        symbols.forEach((symbol, index) => {
          quotesObj[symbol] = quotes[index];
        });
        setCurrentQuotes(quotesObj);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, symbols]); // Include symbols in dependency array

  const addSymbol = (newSymbol) => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
    }
  };

  const removeSymbol = (symbolToRemove) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  const calculatePerformance = (data) => {
    if (!data || data.length < 2) return 0;
    const start = data[0].close;
    const end = data[data.length - 1].close;
    return ((end - start) / start * 100);
  };

  if (loading) {
    return <div className="stock-comparison loading">Loading comparison data...</div>;
  }

  if (error) {
    return <div className="stock-comparison error">Error: {error}</div>;
  }

  return (
    <div className="stock-comparison">
      <div className="comparison-header">
        <h3>Stock Comparison Dashboard</h3>
        <div className="controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="timerange-select"
          >
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>

      {/* Current Quotes Grid */}
      <div className="quotes-grid">
        {symbols.map(symbol => {
          const quote = currentQuotes[symbol];
          const isPositive = quote?.change >= 0;
          
          return (
            <div key={symbol} className="quote-card">
              <div className="quote-header">
                <span className="symbol">{symbol}</span>
                <button 
                  onClick={() => removeSymbol(symbol)}
                  className="remove-btn"
                  title="Remove from comparison"
                >
                  ×
                </button>
              </div>
              
              {quote ? (
                <>
                  <div className="price">${quote.price?.toFixed(2) || 'N/A'}</div>
                  <div className={`change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{quote.change?.toFixed(2) || '0.00'} 
                    ({isPositive ? '+' : ''}{quote.changePercent?.toFixed(2) || '0.00'}%)
                  </div>
                  
                  <div className="quick-stats">
                    <div className="stat-row">
                      <span>Volume:</span>
                      <span>{quote.volume?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="stat-row">
                      <span>P/E:</span>
                      <span>{quote.peRatio?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="stat-row">
                      <span>Beta:</span>
                      <span>{quote.beta?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="loading-quote">Loading...</div>
              )}
            </div>
          );
        })}
        
        {/* Add Symbol Card */}
        <div className="add-symbol-card">
          <AddSymbolForm onAdd={addSymbol} />
        </div>
      </div>

      {/* Performance Comparison */}
      {comparisonData && (
        <div className="performance-section">
          <h4>Performance Comparison ({timeRange})</h4>
          <div className="performance-bars">
            {symbols.map(symbol => {
              const data = comparisonData[symbol];
              const performance = calculatePerformance(data);
              const isPositive = performance >= 0;
              
              return (
                <div key={symbol} className="performance-bar">
                  <div className="bar-header">
                    <span className="symbol">{symbol}</span>
                    <span className={`performance ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{performance.toFixed(2)}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${isPositive ? 'positive' : 'negative'}`}
                      style={{ 
                        width: `${Math.min(Math.abs(performance) * 2, 100)}%`,
                        marginLeft: isPositive ? '50%' : `${Math.max(50 - Math.abs(performance) * 2, 0)}%`
                      }}
                    ></div>
                    <div className="zero-line"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 52-Week Comparison */}
      <div className="week-comparison">
        <h4>52-Week Performance</h4>
        <div className="week-stats">
          {symbols.map(symbol => {
            const quote = currentQuotes[symbol];
            
            return (
              <div key={symbol} className="week-stat-card">
                <div className="stat-symbol">{symbol}</div>
                {quote?.fiftyTwoWeekHigh && quote?.fiftyTwoWeekLow ? (
                  <>
                    <div className="week-range">
                      <span className="range-label">52W Range:</span>
                      <span className="range-value">
                        ${quote.fiftyTwoWeekLow.toFixed(2)} - ${quote.fiftyTwoWeekHigh.toFixed(2)}
                      </span>
                    </div>
                    <div className="current-position">
                      <span>From High: </span>
                      <span className={quote.nearFiftyTwoWeekHigh < 90 ? 'negative' : 'neutral'}>
                        {quote.nearFiftyTwoWeekHigh?.toFixed(1)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="no-data">52W data unavailable</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddSymbolForm({ onAdd }) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      onAdd(symbol.trim());
      setSymbol('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-symbol-form">
      <div className="form-content">
        <span className="add-icon">+</span>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="SYMBOL"
          className="symbol-input"
          maxLength="5"
        />
        <button type="submit" className="add-btn">Add</button>
      </div>
    </form>
  );
}

export default StockComparison;
