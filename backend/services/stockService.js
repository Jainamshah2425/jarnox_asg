const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const TechnicalIndicators = require('../utils/technicalIndicators');
const cache = require('../middleware/cache');
const logger = require('../utils/logger');

// Configuration for data sources
const USE_LIVE_DATA = process.env.USE_LIVE_DATA !== 'false'; // Default to true
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Initialize Alpha Vantage only if API key is provided
let alpha = null;
if (ALPHA_VANTAGE_API_KEY) {
  alpha = require('alphavantage')({ key: ALPHA_VANTAGE_API_KEY });
}

/**
 * Get stock price data for a specific symbol and time range
 * @param {string} symbol - Stock symbol
 * @param {string} timeRange - Time range for data
 * @returns {Promise<Array>} Array of stock price data points
 */
async function getStockData(symbol, timeRange = '1m') {
  try {
    const cacheKey = `stock_${symbol}_${timeRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      logger.info(`Returning cached data for ${symbol}`);
      return cachedData;
    }

    let stockData;
    
    if (USE_LIVE_DATA) {
      try {
        // Try Yahoo Finance first (free, no API key required)
        stockData = await getYahooFinanceData(symbol, timeRange);
        logger.info(`Successfully fetched live data for ${symbol} from Yahoo Finance`);
      } catch (yError) {
        logger.warn(`Yahoo Finance failed for ${symbol}: ${yError.message}`);
        
        // Try Alpha Vantage as fallback if API key is available
        if (ALPHA_VANTAGE_API_KEY) {
          try {
            stockData = await getAlphaVantageData(symbol, timeRange);
            logger.info(`Successfully fetched live data for ${symbol} from Alpha Vantage`);
          } catch (aError) {
            logger.warn(`Alpha Vantage failed for ${symbol}: ${aError.message}`);
            // Fall back to mock data
            stockData = getMockStockData(symbol, timeRange);
            logger.info(`Using mock data for ${symbol}`);
          }
        } else {
          // Fall back to mock data
          stockData = getMockStockData(symbol, timeRange);
          logger.info(`Using mock data for ${symbol} (no Alpha Vantage API key)`);
        }
      }
    } else {
      // Use mock data when live data is disabled
      stockData = getMockStockData(symbol, timeRange);
      logger.info(`Using mock data for ${symbol} (live data disabled)`);
    }
    
    // Cache the result (shorter cache time for live data)
    const cacheTime = USE_LIVE_DATA ? 60 : 300; // 1 min for live, 5 min for mock
    cache.set(cacheKey, stockData, cacheTime);
    
    return stockData;
  } catch (error) {
    logger.error(`Error fetching stock data for ${symbol}:`, error);
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }
}

/**
 * Fetch stock data from Yahoo Finance
 * @param {string} symbol - Stock symbol
 * @param {string} timeRange - Time range
 * @returns {Promise<Array>} Stock data array
 */
async function getYahooFinanceData(symbol, timeRange) {
  const period = convertTimeRangeToYahooPeriod(timeRange);
  const interval = convertTimeRangeToYahooInterval(timeRange);
  
  const queryOptions = {
    period1: period.from,
    period2: period.to,
    interval: interval
  };

  const result = await yahooFinance.historical(symbol, queryOptions);
  
  if (!result || result.length === 0) {
    throw new Error(`No data found for symbol ${symbol}`);
  }

  // Convert Yahoo Finance format to our standard format
  return result.map(item => ({
    date: item.date.toISOString().split('T')[0],
    open: parseFloat(item.open?.toFixed(2) || 0),
    high: parseFloat(item.high?.toFixed(2) || 0),
    low: parseFloat(item.low?.toFixed(2) || 0),
    close: parseFloat(item.close?.toFixed(2) || 0),
    volume: item.volume || 0
  })).reverse(); // Reverse to get chronological order
}

/**
 * Fetch stock data from Alpha Vantage
 * @param {string} symbol - Stock symbol
 * @param {string} timeRange - Time range
 * @returns {Promise<Array>} Stock data array
 */
async function getAlphaVantageData(symbol, timeRange) {
  if (!alpha) {
    throw new Error('Alpha Vantage API key not configured');
  }
  
  let data;
  
  // Choose appropriate Alpha Vantage function based on time range
  if (['1d', '5d'].includes(timeRange)) {
    data = await alpha.data.intraday(symbol, 'compact', 'json', '60min');
  } else if (['1w', '1m'].includes(timeRange)) {
    data = await alpha.data.daily(symbol, 'compact', 'json');
  } else {
    data = await alpha.data.daily(symbol, 'full', 'json');
  }
  
  if (!data || !data['Time Series (Daily)'] && !data['Time Series (60min)']) {
    throw new Error(`No data found for symbol ${symbol} from Alpha Vantage`);
  }
  
  // Extract time series data
  const timeSeriesKey = data['Time Series (Daily)'] ? 'Time Series (Daily)' : 'Time Series (60min)';
  const timeSeries = data[timeSeriesKey];
  
  // Convert Alpha Vantage format to our standard format
  const result = Object.entries(timeSeries).map(([date, values]) => ({
    date: date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume'])
  }));
  
  // Sort chronologically and limit based on timeRange
  const numDays = getNumDaysFromTimeRange(timeRange);
  return result.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-numDays);
}

/**
 * Convert time range to Yahoo Finance period
 * @param {string} timeRange - Time range string
 * @returns {Object} Period object with from and to dates
 */
function convertTimeRangeToYahooPeriod(timeRange) {
  const now = new Date();
  const from = new Date();
  
  switch (timeRange) {
    case '1d':
      from.setDate(now.getDate() - 1);
      break;
    case '5d':
      from.setDate(now.getDate() - 5);
      break;
    case '1w':
      from.setDate(now.getDate() - 7);
      break;
    case '1m':
      from.setMonth(now.getMonth() - 1);
      break;
    case '3m':
      from.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      from.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      from.setFullYear(now.getFullYear() - 1);
      break;
    case '5y':
      from.setFullYear(now.getFullYear() - 5);
      break;
    case 'max':
      from.setFullYear(now.getFullYear() - 10);
      break;
    default:
      from.setMonth(now.getMonth() - 1);
  }
  
  return {
    from: Math.floor(from.getTime() / 1000),
    to: Math.floor(now.getTime() / 1000)
  };
}

/**
 * Convert time range to Yahoo Finance interval
 * @param {string} timeRange - Time range string
 * @returns {string} Yahoo Finance interval
 */
function convertTimeRangeToYahooInterval(timeRange) {
  switch (timeRange) {
    case '1d':
      return '5m';
    case '5d':
      return '15m';
    case '1w':
      return '30m';
    case '1m':
    case '3m':
      return '1d';
    default:
      return '1d';
  }
}

/**
 * Get current stock quote with enhanced data (real-time data)
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Enhanced current stock quote
 */
async function getCurrentQuote(symbol) {
  try {
    const cacheKey = `enhanced_quote_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    if (USE_LIVE_DATA) {
      try {
        const [quote, summaryDetail] = await Promise.all([
          yahooFinance.quoteSummary(symbol, {
            modules: ['price', 'summaryDetail', 'defaultKeyStatistics']
          }),
          get52WeekData(symbol)
        ]);
        
        const price = quote.price;
        const details = quote.summaryDetail;
        const keyStats = quote.defaultKeyStatistics;
        
        const enhancedQuote = {
          symbol: symbol,
          // Basic price info
          price: price.regularMarketPrice,
          change: price.regularMarketChange,
          changePercent: price.regularMarketChangePercent,
          previousClose: price.regularMarketPreviousClose,
          open: price.regularMarketOpen,
          dayHigh: price.regularMarketDayHigh,
          dayLow: price.regularMarketDayLow,
          volume: price.regularMarketVolume,
          
          // Enhanced metrics
          marketCap: details.marketCap,
          avgVolume: details.averageVolume,
          avgVolume10Day: details.averageDailyVolume10Day,
          
          // 52-week data
          fiftyTwoWeekHigh: details.fiftyTwoWeekHigh || summaryDetail.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: details.fiftyTwoWeekLow || summaryDetail.fiftyTwoWeekLow,
          fiftyTwoWeekRange: details.fiftyTwoWeekHigh && details.fiftyTwoWeekLow 
            ? `${details.fiftyTwoWeekLow.toFixed(2)} - ${details.fiftyTwoWeekHigh.toFixed(2)}`
            : null,
          
          // Additional key statistics
          peRatio: keyStats?.trailingPE,
          pegRatio: keyStats?.pegRatio,
          priceToBook: keyStats?.priceToBook,
          beta: keyStats?.beta,
          earningsPerShare: keyStats?.trailingEps,
          dividendYield: keyStats?.dividendYield,
          
          // Relative positioning
          nearFiftyTwoWeekHigh: details.fiftyTwoWeekHigh ? 
            ((price.regularMarketPrice / details.fiftyTwoWeekHigh) * 100) : null,
          nearFiftyTwoWeekLow: details.fiftyTwoWeekLow ? 
            ((price.regularMarketPrice / details.fiftyTwoWeekLow) * 100) : null,
          
          timestamp: new Date().toISOString()
        };
        
        // Cache for 30 seconds (real-time data changes frequently)
        cache.set(cacheKey, enhancedQuote, 30);
        
        return enhancedQuote;
      } catch (error) {
        logger.warn(`Failed to get enhanced quote for ${symbol}: ${error.message}`);
        // Return a mock enhanced quote
        return getMockEnhancedQuote(symbol);
      }
    } else {
      return getMockEnhancedQuote(symbol);
    }
  } catch (error) {
    logger.error(`Error fetching enhanced quote for ${symbol}:`, error);
    throw new Error(`Failed to fetch enhanced quote for ${symbol}`);
  }
}

/**
 * Get 52-week high/low data for a symbol
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} 52-week data
 */
async function get52WeekData(symbol) {
  try {
    const yearAgoData = await getYahooFinanceData(symbol, '1y');
    if (!yearAgoData || yearAgoData.length === 0) {
      return { fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null };
    }
    
    const highs = yearAgoData.map(d => d.high).filter(h => h > 0);
    const lows = yearAgoData.map(d => d.low).filter(l => l > 0);
    
    return {
      fiftyTwoWeekHigh: Math.max(...highs),
      fiftyTwoWeekLow: Math.min(...lows)
    };
  } catch (error) {
    logger.warn(`Failed to get 52-week data for ${symbol}: ${error.message}`);
    return { fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null };
  }
}

/**
 * Generate mock enhanced quote
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock enhanced quote
 */
function getMockEnhancedQuote(symbol) {
  const basePrice = getBasePrice(symbol);
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;
  const fiftyTwoWeekHigh = basePrice * (1.2 + Math.random() * 0.3); // 20-50% above current
  const fiftyTwoWeekLow = basePrice * (0.5 + Math.random() * 0.3);  // 50-80% of current
  
  return {
    symbol: symbol,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    previousClose: parseFloat((basePrice - change).toFixed(2)),
    open: parseFloat((basePrice * 0.99).toFixed(2)),
    dayHigh: parseFloat((basePrice * 1.05).toFixed(2)),
    dayLow: parseFloat((basePrice * 0.95).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 500000,
    marketCap: Math.floor(Math.random() * 1000000000000),
    avgVolume: Math.floor(Math.random() * 5000000) + 1000000,
    avgVolume10Day: Math.floor(Math.random() * 8000000) + 800000,
    fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
    fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2)),
    fiftyTwoWeekRange: `${fiftyTwoWeekLow.toFixed(2)} - ${fiftyTwoWeekHigh.toFixed(2)}`,
    peRatio: 15 + Math.random() * 25, // P/E between 15-40
    pegRatio: 0.5 + Math.random() * 2, // PEG between 0.5-2.5
    priceToBook: 1 + Math.random() * 8, // P/B between 1-9
    beta: 0.5 + Math.random() * 1.5, // Beta between 0.5-2
    earningsPerShare: Math.random() * 10, // EPS
    dividendYield: Math.random() * 0.05, // 0-5% dividend yield
    nearFiftyTwoWeekHigh: parseFloat(((basePrice / fiftyTwoWeekHigh) * 100).toFixed(2)),
    nearFiftyTwoWeekLow: parseFloat(((basePrice / fiftyTwoWeekLow) * 100).toFixed(2)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate mock current quote
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock current quote
 */
function getMockCurrentQuote(symbol) {
  const basePrice = getBasePrice(symbol);
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol: symbol,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    previousClose: parseFloat((basePrice - change).toFixed(2)),
    open: parseFloat((basePrice * 0.99).toFixed(2)),
    dayHigh: parseFloat((basePrice * 1.05).toFixed(2)),
    dayLow: parseFloat((basePrice * 0.95).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 500000,
    marketCap: Math.floor(Math.random() * 1000000000000),
    timestamp: new Date().toISOString()
  };
}

/**
 * Compare multiple stocks over the same time period
 * @param {Array<string>} symbols - Array of stock symbols
 * @param {string} timeRange - Time range for comparison
 * @returns {Promise<Object>} Object with data for each symbol
 */
async function compareStocks(symbols, timeRange = '1m') {
  try {
    const cacheKey = `compare_${symbols.join('_')}_${timeRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Get data for each symbol
    const promises = symbols.map(symbol => getStockData(symbol, timeRange));
    const results = await Promise.all(promises);
    
    // Format the data for comparison
    const comparisonData = {};
    symbols.forEach((symbol, index) => {
      comparisonData[symbol] = results[index];
    });
    
    // Cache the result
    cache.set(cacheKey, comparisonData);
    
    return comparisonData;
  } catch (error) {
    logger.error(`Error comparing stocks:`, error);
    throw new Error('Failed to compare stocks');
  }
}

/**
 * Get technical indicator data for a stock
 * @param {string} symbol - Stock symbol
 * @param {string} indicator - Technical indicator
 * @param {string} timeRange - Time range
 * @returns {Promise<Array>} Array of indicator data points
 */
async function getStockIndicator(symbol, indicator, timeRange = '1m') {
  try {
    const cacheKey = `indicator_${symbol}_${indicator}_${timeRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Get historical data
    const historicalData = await getStockData(symbol, timeRange);
    
    if (!historicalData || historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }

    let indicatorData;
    
    if (USE_LIVE_DATA) {
      try {
        indicatorData = calculateTechnicalIndicator(historicalData, indicator);
      } catch (error) {
        logger.warn(`Failed to calculate ${indicator} for ${symbol}: ${error.message}`);
        indicatorData = getMockIndicatorData(symbol, indicator, timeRange);
      }
    } else {
      indicatorData = getMockIndicatorData(symbol, indicator, timeRange);
    }
    
    // Cache the result for 5 minutes
    cache.set(cacheKey, indicatorData, 300);
    
    return indicatorData;
  } catch (error) {
    logger.error(`Error fetching indicator data for ${symbol}:`, error);
    throw new Error(`Failed to fetch indicator data for ${symbol}`);
  }
}

/**
 * Calculate technical indicators using real data
 * @param {Array} historicalData - Historical OHLCV data
 * @param {string} indicator - Indicator type
 * @returns {Array} Calculated indicator values
 */
function calculateTechnicalIndicator(historicalData, indicator) {
  const closes = historicalData.map(d => d.close);
  const highs = historicalData.map(d => d.high);
  const lows = historicalData.map(d => d.low);
  const opens = historicalData.map(d => d.open);
  const volumes = historicalData.map(d => d.volume);
  
  let result = [];
  
  switch (indicator.toLowerCase()) {
    case 'sma':
    case 'sma20':
      const sma20 = TechnicalIndicators.SMA.calculate({
        period: 20,
        values: closes
      });
      result = mapIndicatorToData(historicalData, sma20, 20);
      break;
      
    case 'sma50':
      const sma50 = TechnicalIndicators.SMA.calculate({
        period: 50,
        values: closes
      });
      result = mapIndicatorToData(historicalData, sma50, 50);
      break;
      
    case 'ema':
    case 'ema12':
      const ema12 = TechnicalIndicators.EMA.calculate({
        period: 12,
        values: closes
      });
      result = mapIndicatorToData(historicalData, ema12, 12);
      break;
      
    case 'ema26':
      const ema26 = TechnicalIndicators.EMA.calculate({
        period: 26,
        values: closes
      });
      result = mapIndicatorToData(historicalData, ema26, 26);
      break;
      
    case 'macd':
      const macd = TechnicalIndicators.MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      result = historicalData.map((dataPoint, index) => ({
        date: dataPoint.date,
        macd: macd[index - 25] ? parseFloat(macd[index - 25].MACD?.toFixed(4)) : null,
        signal: macd[index - 25] ? parseFloat(macd[index - 25].signal?.toFixed(4)) : null,
        histogram: macd[index - 25] ? parseFloat(macd[index - 25].histogram?.toFixed(4)) : null
      }));
      break;
      
    case 'rsi':
      const rsi = TechnicalIndicators.RSI.calculate({
        values: closes,
        period: 14
      });
      result = mapIndicatorToData(historicalData, rsi, 14);
      break;
      
    case 'bollinger':
    case 'bb':
      const bb = TechnicalIndicators.BollingerBands.calculate({
        period: 20,
        values: closes,
        stdDev: 2
      });
      result = historicalData.map((dataPoint, index) => ({
        date: dataPoint.date,
        upper: bb[index - 19] ? parseFloat(bb[index - 19].upper?.toFixed(2)) : null,
        middle: bb[index - 19] ? parseFloat(bb[index - 19].middle?.toFixed(2)) : null,
        lower: bb[index - 19] ? parseFloat(bb[index - 19].lower?.toFixed(2)) : null,
        price: dataPoint.close
      }));
      break;
      
    case 'stochastic':
      const stoch = TechnicalIndicators.Stochastic.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14,
        signalPeriod: 3
      });
      result = historicalData.map((dataPoint, index) => ({
        date: dataPoint.date,
        k: stoch[index - 13] ? parseFloat(stoch[index - 13].k?.toFixed(2)) : null,
        d: stoch[index - 13] ? parseFloat(stoch[index - 13].d?.toFixed(2)) : null
      }));
      break;
      
    case 'atr':
      const atr = TechnicalIndicators.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14
      });
      result = mapIndicatorToData(historicalData, atr, 14);
      break;
      
    default:
      throw new Error(`Unsupported indicator: ${indicator}`);
  }
  
  return result;
}

/**
 * Map indicator values to historical data with dates
 * @param {Array} historicalData - Historical data
 * @param {Array} indicatorValues - Calculated indicator values
 * @param {number} period - Indicator period for offset
 * @returns {Array} Mapped indicator data
 */
function mapIndicatorToData(historicalData, indicatorValues, period) {
  return historicalData.map((dataPoint, index) => {
    const indicatorIndex = index - (period - 1);
    return {
      date: dataPoint.date,
      value: indicatorIndex >= 0 && indicatorValues[indicatorIndex] 
        ? parseFloat(indicatorValues[indicatorIndex].toFixed(4))
        : null,
      price: dataPoint.close
    };
  });
}

/**
 * Get comprehensive technical analysis for a stock
 * @param {string} symbol - Stock symbol
 * @param {string} timeRange - Time range
 * @returns {Promise<Object>} Comprehensive technical analysis
 */
async function getTechnicalAnalysis(symbol, timeRange = '3m') {
  try {
    const cacheKey = `technical_analysis_${symbol}_${timeRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    const historicalData = await getStockData(symbol, timeRange);
    
    if (!historicalData || historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }

    // Calculate multiple indicators in parallel
    const [sma20, sma50, ema12, ema26, rsi, macd, bb] = await Promise.all([
      calculateTechnicalIndicator(historicalData, 'sma20'),
      calculateTechnicalIndicator(historicalData, 'sma50'),
      calculateTechnicalIndicator(historicalData, 'ema12'),
      calculateTechnicalIndicator(historicalData, 'ema26'),
      calculateTechnicalIndicator(historicalData, 'rsi'),
      calculateTechnicalIndicator(historicalData, 'macd'),
      calculateTechnicalIndicator(historicalData, 'bollinger')
    ]);

    const analysis = {
      symbol,
      timeRange,
      indicators: {
        sma20,
        sma50,
        ema12,
        ema26,
        rsi,
        macd,
        bollingerBands: bb
      },
      signals: generateTradingSignals(historicalData, { sma20, sma50, ema12, ema26, rsi, macd, bb }),
      timestamp: new Date().toISOString()
    };

    // Cache for 10 minutes
    cache.set(cacheKey, analysis, 600);
    
    return analysis;
  } catch (error) {
    logger.error(`Error generating technical analysis for ${symbol}:`, error);
    throw new Error(`Failed to generate technical analysis for ${symbol}`);
  }
}

/**
 * Generate trading signals based on technical indicators
 * @param {Array} historicalData - Historical data
 * @param {Object} indicators - Calculated indicators
 * @returns {Array} Trading signals
 */
function generateTradingSignals(historicalData, indicators) {
  const signals = [];
  const currentPrice = historicalData[historicalData.length - 1].close;
  
  // Get latest indicator values
  const latestSMA20 = indicators.sma20[indicators.sma20.length - 1]?.value;
  const latestSMA50 = indicators.sma50[indicators.sma50.length - 1]?.value;
  const latestRSI = indicators.rsi[indicators.rsi.length - 1]?.value;
  const latestMACD = indicators.macd[indicators.macd.length - 1];
  const latestBB = indicators.bb[indicators.bb.length - 1];
  
  // Moving Average Signals
  if (latestSMA20 && latestSMA50) {
    if (currentPrice > latestSMA20 && latestSMA20 > latestSMA50) {
      signals.push({
        type: 'BUY',
        signal: 'Golden Cross Pattern',
        strength: 'Strong',
        description: 'Price above SMA20, SMA20 above SMA50'
      });
    } else if (currentPrice < latestSMA20 && latestSMA20 < latestSMA50) {
      signals.push({
        type: 'SELL',
        signal: 'Death Cross Pattern',
        strength: 'Strong',
        description: 'Price below SMA20, SMA20 below SMA50'
      });
    }
  }
  
  // RSI Signals
  if (latestRSI) {
    if (latestRSI > 70) {
      signals.push({
        type: 'SELL',
        signal: 'RSI Overbought',
        strength: 'Medium',
        description: `RSI at ${latestRSI.toFixed(2)} indicates overbought conditions`
      });
    } else if (latestRSI < 30) {
      signals.push({
        type: 'BUY',
        signal: 'RSI Oversold',
        strength: 'Medium',
        description: `RSI at ${latestRSI.toFixed(2)} indicates oversold conditions`
      });
    }
  }
  
  // MACD Signals
  if (latestMACD && latestMACD.macd && latestMACD.signal) {
    if (latestMACD.macd > latestMACD.signal && latestMACD.histogram > 0) {
      signals.push({
        type: 'BUY',
        signal: 'MACD Bullish',
        strength: 'Medium',
        description: 'MACD line above signal line with positive histogram'
      });
    } else if (latestMACD.macd < latestMACD.signal && latestMACD.histogram < 0) {
      signals.push({
        type: 'SELL',
        signal: 'MACD Bearish',
        strength: 'Medium',
        description: 'MACD line below signal line with negative histogram'
      });
    }
  }
  
  // Bollinger Bands Signals
  if (latestBB && latestBB.upper && latestBB.lower) {
    if (currentPrice > latestBB.upper) {
      signals.push({
        type: 'SELL',
        signal: 'Bollinger Upper Breach',
        strength: 'Medium',
        description: 'Price above upper Bollinger Band'
      });
    } else if (currentPrice < latestBB.lower) {
      signals.push({
        type: 'BUY',
        signal: 'Bollinger Lower Breach',
        strength: 'Medium',
        description: 'Price below lower Bollinger Band'
      });
    }
  }
  
  return signals;
}

/**
 * Generate mock stock data for development/testing
 * @param {string} symbol - Stock symbol
 * @param {string} timeRange - Time range
 * @returns {Array} Mock stock data
 */
function getMockStockData(symbol, timeRange) {
  const numDays = getNumDaysFromTimeRange(timeRange);
  const data = [];
  let basePrice = getBasePrice(symbol);
  
  // Generate daily data points going back numDays
  for (let i = numDays; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some randomness to the price
    const volatility = 0.02; // 2% daily volatility
    const change = basePrice * volatility * (Math.random() - 0.5);
    basePrice += change;
    
    // Ensure price doesn't go below 1
    if (basePrice < 1) basePrice = 1;
    
    const open = basePrice;
    const high = open * (1 + Math.random() * 0.015);
    const low = open * (1 - Math.random() * 0.015);
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 10000000) + 500000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return data;
}

/**
 * Generate mock technical indicator data
 * @param {string} symbol - Stock symbol
 * @param {string} indicator - Technical indicator
 * @param {string} timeRange - Time range
 * @returns {Array} Mock indicator data
 */
function getMockIndicatorData(symbol, indicator, timeRange) {
  const stockData = getMockStockData(symbol, timeRange);
  
  // Simple moving average calculation as an example
  if (indicator === 'sma') {
    const period = 14; // 14-day SMA
    return stockData.map((dataPoint, index, array) => {
      if (index < period - 1) {
        return {
          date: dataPoint.date,
          value: null
        };
      }
      
      // Calculate SMA
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += array[index - i].close;
      }
      
      return {
        date: dataPoint.date,
        value: parseFloat((sum / period).toFixed(2))
      };
    });
  }
  
  // Return some random indicator values
  return stockData.map(dataPoint => ({
    date: dataPoint.date,
    value: parseFloat((dataPoint.close * (0.8 + Math.random() * 0.4)).toFixed(2))
  }));
}

/**
 * Get base price for a mock stock
 * @param {string} symbol - Stock symbol
 * @returns {number} Base price
 */
function getBasePrice(symbol) {
  // Generate consistent but semi-random base price from symbol
  let baseValue = 0;
  for (let i = 0; i < symbol.length; i++) {
    baseValue += symbol.charCodeAt(i);
  }
  
  // Scale to a reasonable stock price range (10-500)
  return 10 + (baseValue % 490);
}

/**
 * Convert time range string to number of days
 * @param {string} timeRange - Time range string (1d, 1w, 1m, etc.)
 * @returns {number} Number of days
 */
function getNumDaysFromTimeRange(timeRange) {
  switch (timeRange) {
    case '1d': return 1;
    case '5d': return 5;
    case '1w': return 7;
    case '1m': return 30;
    case '3m': return 90;
    case '6m': return 180;
    case '1y': return 365;
    case '5y': return 365 * 5;
    case 'max': return 365 * 10;
    default: return 30; // Default to 1 month
  }
}

module.exports = {
  getStockData,
  compareStocks,
  getStockIndicator,
  getCurrentQuote,
  getTechnicalAnalysis,
  get52WeekData
};
