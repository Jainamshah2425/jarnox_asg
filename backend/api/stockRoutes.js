const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const { validateSymbol, validateTimeRange } = require('../middleware/validators');
const cache = require('../middleware/cache');

/**
 * @route   GET /api/stocks/compare
 * @desc    Compare stock performance of multiple symbols
 * @access  Public
 */
router.get('/compare', cache.middleware(300), async (req, res, next) => {
  try {
    const { symbols, timeRange = '1m' } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        error: true,
        message: 'Symbols parameter is required'
      });
    }
    
    const symbolArray = symbols.split(',');
    const comparisonData = await stockService.compareStocks(symbolArray, timeRange);
    
    res.json(comparisonData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stocks/:symbol
 * @desc    Get stock price data for a specific symbol
 * @access  Public
 */
router.get('/:symbol', validateSymbol, validateTimeRange, cache.middleware(300), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeRange = '1m' } = req.query;
    
    const stockData = await stockService.getStockData(symbol, timeRange);
    
    res.json(stockData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stocks/:symbol/quote
 * @desc    Get current quote for a specific stock symbol
 * @access  Public
 */
router.get('/:symbol/quote', validateSymbol, cache.middleware(30), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const quote = await stockService.getCurrentQuote(symbol);
    
    res.json(quote);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stocks/:symbol/indicators
 * @desc    Get technical indicators for a specific stock
 * @access  Public
 */
router.get('/:symbol/indicators', validateSymbol, cache.middleware(300), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { indicator, timeRange = '1m' } = req.query;
    
    if (!indicator) {
      return res.status(400).json({
        error: true,
        message: 'Indicator parameter is required'
      });
    }
    
    const indicatorData = await stockService.getStockIndicator(symbol, indicator, timeRange);
    
    res.json(indicatorData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stocks/:symbol/technical-analysis
 * @desc    Get comprehensive technical analysis for a specific stock
 * @access  Public
 */
router.get('/:symbol/technical-analysis', validateSymbol, cache.middleware(600), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeRange = '3m' } = req.query;
    
    const analysis = await stockService.getTechnicalAnalysis(symbol, timeRange);
    
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stocks/:symbol/52week
 * @desc    Get 52-week high/low data for a specific stock
 * @access  Public
 */
router.get('/:symbol/52week', validateSymbol, cache.middleware(3600), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const data = await stockService.get52WeekData(symbol);
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
