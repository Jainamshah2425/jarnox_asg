const express = require('express');
const router = express.Router();
const companyService = require('../services/companyService');
const { validateSymbol } = require('../middleware/validators');
const cache = require('../middleware/cache');

/**
 * @route   GET /api/companies
 * @desc    Get list of all available companies
 * @access  Public
 */
router.get('/', cache.middleware(3600), async (req, res, next) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.json(companies);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/companies/search
 * @desc    Search for companies by name or symbol
 * @access  Public
 */
router.get('/search', cache.middleware(300), async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: true,
        message: 'Query parameter is required'
      });
    }
    
    const results = await companyService.searchCompanies(query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/companies/:symbol
 * @desc    Get detailed information about a specific company
 * @access  Public
 */
router.get('/:symbol', validateSymbol, cache.middleware(3600), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const companyDetails = await companyService.getCompanyDetails(symbol);
    
    if (!companyDetails) {
      return res.status(404).json({
        error: true,
        message: `Company with symbol ${symbol} not found`
      });
    }
    
    res.json(companyDetails);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/companies/:symbol/news
 * @desc    Get latest news for a specific company
 * @access  Public
 */
router.get('/:symbol/news', validateSymbol, cache.middleware(300), async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const news = await companyService.getCompanyNews(symbol);
    res.json(news);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
