/**
 * Validates that a stock symbol is properly formatted
 */
const validateSymbol = (req, res, next) => {
  const { symbol } = req.params;
  
  // Basic validation for stock symbol format
  if (!symbol || !/^[A-Z0-9.]{1,5}$/.test(symbol)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid stock symbol format. Should be 1-5 uppercase letters or numbers.'
    });
  }
  
  next();
};

/**
 * Validates the time range parameter for stock data
 */
const validateTimeRange = (req, res, next) => {
  const { timeRange } = req.query;
  
  if (timeRange) {
    const validRanges = ['1d', '5d', '1w', '1m', '3m', '6m', '1y', '5y', 'max'];
    
    if (!validRanges.includes(timeRange)) {
      return res.status(400).json({
        error: true,
        message: `Invalid time range. Must be one of: ${validRanges.join(', ')}`
      });
    }
  }
  
  next();
};

module.exports = {
  validateSymbol,
  validateTimeRange
};
