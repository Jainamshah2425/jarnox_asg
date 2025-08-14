import React, { useState, useEffect } from 'react';
import { fetchTechnicalAnalysis } from '../services/stockService';
import '../styles/TechnicalAnalysis.css';

function TechnicalAnalysis({ symbol }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('3m');

  useEffect(() => {
    if (!symbol) return;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTechnicalAnalysis(symbol, timeRange);
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching technical analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [symbol, timeRange]);

  if (loading) {
    return <div className="technical-analysis loading">Loading technical analysis...</div>;
  }

  if (error) {
    return <div className="technical-analysis error">Error: {error}</div>;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="technical-analysis">
      <div className="analysis-header">
        <h3>Technical Analysis - {symbol}</h3>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="timerange-select"
        >
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
          <option value="6m">6 Months</option>
          <option value="1y">1 Year</option>
        </select>
      </div>

      {/* Trading Signals */}
      {analysis.signals && analysis.signals.length > 0 && (
        <div className="signals-section">
          <h4>Trading Signals</h4>
          <div className="signals-list">
            {analysis.signals.map((signal, index) => (
              <div key={index} className={`signal-item ${signal.type.toLowerCase()}`}>
                <div className="signal-header">
                  <span className={`signal-type ${signal.type.toLowerCase()}`}>
                    {signal.type}
                  </span>
                  <span className="signal-name">{signal.signal}</span>
                  <span className={`signal-strength ${signal.strength.toLowerCase()}`}>
                    {signal.strength}
                  </span>
                </div>
                <p className="signal-description">{signal.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Indicators Summary */}
      <div className="indicators-summary">
        <h4>Key Indicators</h4>
        <div className="indicators-grid">
          {analysis.indicators.rsi && (
            <div className="indicator-card">
              <div className="indicator-name">RSI (14)</div>
              <div className="indicator-value">
                {getLatestValue(analysis.indicators.rsi)?.toFixed(2) || 'N/A'}
              </div>
              <div className={`indicator-status ${getRSIStatus(getLatestValue(analysis.indicators.rsi))}`}>
                {getRSIStatusText(getLatestValue(analysis.indicators.rsi))}
              </div>
            </div>
          )}

          {analysis.indicators.macd && (
            <div className="indicator-card">
              <div className="indicator-name">MACD</div>
              <div className="indicator-value">
                {getLatestMACD(analysis.indicators.macd)?.macd?.toFixed(4) || 'N/A'}
              </div>
              <div className={`indicator-status ${getMACDStatus(getLatestMACD(analysis.indicators.macd))}`}>
                {getMACDStatusText(getLatestMACD(analysis.indicators.macd))}
              </div>
            </div>
          )}

          {analysis.indicators.sma20 && analysis.indicators.sma50 && (
            <div className="indicator-card">
              <div className="indicator-name">MA Cross</div>
              <div className="indicator-value">
                {getMARelationship(
                  getLatestValue(analysis.indicators.sma20),
                  getLatestValue(analysis.indicators.sma50)
                )}
              </div>
              <div className={`indicator-status ${getMAStatus(
                getLatestValue(analysis.indicators.sma20),
                getLatestValue(analysis.indicators.sma50)
              )}`}>
                {getMAStatusText(
                  getLatestValue(analysis.indicators.sma20),
                  getLatestValue(analysis.indicators.sma50)
                )}
              </div>
            </div>
          )}

          {analysis.indicators.bollingerBands && (
            <div className="indicator-card">
              <div className="indicator-name">Bollinger</div>
              <div className="indicator-value">
                {getBollingerPosition(getLatestBollinger(analysis.indicators.bollingerBands))}
              </div>
              <div className={`indicator-status ${getBollingerStatus(getLatestBollinger(analysis.indicators.bollingerBands))}`}>
                {getBollingerStatusText(getLatestBollinger(analysis.indicators.bollingerBands))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Sentiment */}
      <div className="overall-sentiment">
        <h4>Overall Sentiment</h4>
        <div className={`sentiment-indicator ${getOverallSentiment(analysis.signals)}`}>
          <div className="sentiment-text">
            {getSentimentText(getOverallSentiment(analysis.signals))}
          </div>
          <div className="sentiment-description">
            Based on {analysis.signals.length} technical signals
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getLatestValue(indicatorArray) {
  if (!indicatorArray || indicatorArray.length === 0) return null;
  const latest = indicatorArray[indicatorArray.length - 1];
  return latest?.value;
}

function getLatestMACD(macdArray) {
  if (!macdArray || macdArray.length === 0) return null;
  return macdArray[macdArray.length - 1];
}

function getLatestBollinger(bbArray) {
  if (!bbArray || bbArray.length === 0) return null;
  return bbArray[bbArray.length - 1];
}

function getRSIStatus(rsi) {
  if (!rsi) return 'neutral';
  if (rsi > 70) return 'overbought';
  if (rsi < 30) return 'oversold';
  return 'neutral';
}

function getRSIStatusText(rsi) {
  if (!rsi) return 'N/A';
  if (rsi > 70) return 'Overbought';
  if (rsi < 30) return 'Oversold';
  return 'Neutral';
}

function getMACDStatus(macd) {
  if (!macd || !macd.macd || !macd.signal) return 'neutral';
  return macd.macd > macd.signal ? 'bullish' : 'bearish';
}

function getMACDStatusText(macd) {
  if (!macd || !macd.macd || !macd.signal) return 'N/A';
  return macd.macd > macd.signal ? 'Bullish' : 'Bearish';
}

function getMARelationship(sma20, sma50) {
  if (!sma20 || !sma50) return 'N/A';
  return sma20 > sma50 ? 'Bullish' : 'Bearish';
}

function getMAStatus(sma20, sma50) {
  if (!sma20 || !sma50) return 'neutral';
  return sma20 > sma50 ? 'bullish' : 'bearish';
}

function getMAStatusText(sma20, sma50) {
  if (!sma20 || !sma50) return 'N/A';
  return sma20 > sma50 ? 'SMA20 > SMA50' : 'SMA20 < SMA50';
}

function getBollingerPosition(bb) {
  if (!bb || !bb.upper || !bb.lower || !bb.price) return 'N/A';
  if (bb.price > bb.upper) return 'Above Upper';
  if (bb.price < bb.lower) return 'Below Lower';
  return 'In Range';
}

function getBollingerStatus(bb) {
  if (!bb || !bb.upper || !bb.lower || !bb.price) return 'neutral';
  if (bb.price > bb.upper) return 'overbought';
  if (bb.price < bb.lower) return 'oversold';
  return 'neutral';
}

function getBollingerStatusText(bb) {
  if (!bb || !bb.upper || !bb.lower || !bb.price) return 'N/A';
  if (bb.price > bb.upper) return 'Breakout';
  if (bb.price < bb.lower) return 'Breakdown';
  return 'Normal';
}

function getOverallSentiment(signals) {
  if (!signals || signals.length === 0) return 'neutral';
  
  const buySignals = signals.filter(s => s.type === 'BUY').length;
  const sellSignals = signals.filter(s => s.type === 'SELL').length;
  
  if (buySignals > sellSignals) return 'bullish';
  if (sellSignals > buySignals) return 'bearish';
  return 'neutral';
}

function getSentimentText(sentiment) {
  switch (sentiment) {
    case 'bullish': return 'Bullish';
    case 'bearish': return 'Bearish';
    default: return 'Neutral';
  }
}

export default TechnicalAnalysis;
