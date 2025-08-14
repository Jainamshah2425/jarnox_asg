/**
 * Simple Technical Indicators implementation
 * Custom implementation to avoid dependency issues
 */

class TechnicalIndicators {
  /**
   * Simple Moving Average
   */
  static SMA = {
    calculate: ({ period, values }) => {
      const result = [];
      for (let i = period - 1; i < values.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[i - j];
        }
        result.push(sum / period);
      }
      return result;
    }
  };

  /**
   * Exponential Moving Average
   */
  static EMA = {
    calculate: ({ period, values }) => {
      const result = [];
      const multiplier = 2 / (period + 1);
      
      // Start with SMA for first value
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += values[i];
      }
      result.push(sum / period);
      
      // Calculate EMA for remaining values
      for (let i = period; i < values.length; i++) {
        const ema = (values[i] * multiplier) + (result[result.length - 1] * (1 - multiplier));
        result.push(ema);
      }
      
      return result;
    }
  };

  /**
   * Relative Strength Index
   */
  static RSI = {
    calculate: ({ values, period = 14 }) => {
      const result = [];
      const gains = [];
      const losses = [];
      
      // Calculate gains and losses
      for (let i = 1; i < values.length; i++) {
        const change = values[i] - values[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
      
      // Calculate initial average gain and loss
      let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      
      // Calculate RSI
      for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
      
      return result;
    }
  };

  /**
   * Moving Average Convergence Divergence
   */
  static MACD = {
    calculate: ({ values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 }) => {
      const fastEMA = TechnicalIndicators.EMA.calculate({ period: fastPeriod, values });
      const slowEMA = TechnicalIndicators.EMA.calculate({ period: slowPeriod, values });
      
      const macdLine = [];
      const startIndex = slowPeriod - fastPeriod;
      
      // Calculate MACD line
      for (let i = 0; i < fastEMA.length - startIndex; i++) {
        macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
      }
      
      // Calculate signal line (EMA of MACD)
      const signalLine = TechnicalIndicators.EMA.calculate({ 
        period: signalPeriod, 
        values: macdLine 
      });
      
      // Calculate histogram
      const result = [];
      const signalStartIndex = signalPeriod - 1;
      
      for (let i = 0; i < signalLine.length; i++) {
        const macd = macdLine[i + signalStartIndex];
        const signal = signalLine[i];
        const histogram = macd - signal;
        
        result.push({
          MACD: macd,
          signal: signal,
          histogram: histogram
        });
      }
      
      return result;
    }
  };

  /**
   * Bollinger Bands
   */
  static BollingerBands = {
    calculate: ({ period, values, stdDev = 2 }) => {
      const result = [];
      
      for (let i = period - 1; i < values.length; i++) {
        // Calculate SMA
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[i - j];
        }
        const sma = sum / period;
        
        // Calculate standard deviation
        let variance = 0;
        for (let j = 0; j < period; j++) {
          variance += Math.pow(values[i - j] - sma, 2);
        }
        const standardDeviation = Math.sqrt(variance / period);
        
        result.push({
          upper: sma + (standardDeviation * stdDev),
          middle: sma,
          lower: sma - (standardDeviation * stdDev)
        });
      }
      
      return result;
    }
  };

  /**
   * Stochastic Oscillator
   */
  static Stochastic = {
    calculate: ({ high, low, close, period = 14, signalPeriod = 3 }) => {
      const kValues = [];
      
      // Calculate %K
      for (let i = period - 1; i < close.length; i++) {
        let highestHigh = high[i];
        let lowestLow = low[i];
        
        for (let j = 1; j < period; j++) {
          if (high[i - j] > highestHigh) highestHigh = high[i - j];
          if (low[i - j] < lowestLow) lowestLow = low[i - j];
        }
        
        const k = ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      }
      
      // Calculate %D (SMA of %K)
      const dValues = TechnicalIndicators.SMA.calculate({
        period: signalPeriod,
        values: kValues
      });
      
      const result = [];
      const dStartIndex = signalPeriod - 1;
      
      for (let i = 0; i < dValues.length; i++) {
        result.push({
          k: kValues[i + dStartIndex],
          d: dValues[i]
        });
      }
      
      return result;
    }
  };

  /**
   * Average True Range
   */
  static ATR = {
    calculate: ({ high, low, close, period = 14 }) => {
      const trueRanges = [];
      
      // Calculate True Range for each period
      for (let i = 1; i < close.length; i++) {
        const tr1 = high[i] - low[i];
        const tr2 = Math.abs(high[i] - close[i - 1]);
        const tr3 = Math.abs(low[i] - close[i - 1]);
        
        trueRanges.push(Math.max(tr1, tr2, tr3));
      }
      
      // Calculate ATR (SMA of True Range)
      return TechnicalIndicators.SMA.calculate({
        period: period,
        values: trueRanges
      });
    }
  };
}

module.exports = TechnicalIndicators;
