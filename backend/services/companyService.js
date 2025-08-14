const axios = require('axios');
const cache = require('../middleware/cache');
const logger = require('../utils/logger');

// If using a real API, you would use your API key
const API_KEY = process.env.STOCK_API_KEY;
// Base URL for your stock data provider
const API_BASE_URL = process.env.STOCK_API_BASE_URL;

/**
 * Get list of all available companies
 * @returns {Promise<Array>} Array of companies
 */
async function getAllCompanies() {
  try {
    const cacheKey = 'all_companies';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // For demo purposes, use mock data
    const companies = getMockCompanies();
    
    // Cache the result
    cache.set(cacheKey, companies, 3600); // Cache for 1 hour
    
    return companies;
  } catch (error) {
    logger.error('Error fetching companies:', error);
    throw new Error('Failed to fetch companies');
  }
}

/**
 * Search for companies by name or symbol
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching companies
 */
async function searchCompanies(query) {
  try {
    const allCompanies = await getAllCompanies();
    
    const normalizedQuery = query.toLowerCase();
    
    // Filter companies that match the query
    const matchingCompanies = allCompanies.filter(company => 
      company.name.toLowerCase().includes(normalizedQuery) || 
      company.symbol.toLowerCase().includes(normalizedQuery)
    );
    
    return matchingCompanies;
  } catch (error) {
    logger.error('Error searching companies:', error);
    throw new Error('Failed to search companies');
  }
}

/**
 * Get detailed information about a specific company
 * @param {string} symbol - Company symbol
 * @returns {Promise<Object>} Company details
 */
async function getCompanyDetails(symbol) {
  try {
    const cacheKey = `company_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // For demo purposes, use mock data
    const allCompanies = await getAllCompanies();
    const company = allCompanies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!company) {
      return null;
    }
    
    // Add additional mock details
    const companyDetails = {
      ...company,
      description: getCompanyDescription(company.name, company.sector),
      ceo: getRandomCEO(),
      employees: Math.floor(Math.random() * 100000) + 1000,
      founded: 1960 + Math.floor(Math.random() * 50),
      headquarters: getRandomHeadquarters(),
      website: `https://www.${company.symbol.toLowerCase()}.com`,
      marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
      pe_ratio: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      dividend_yield: parseFloat((Math.random() * 5).toFixed(2)),
    };
    
    // Cache the result
    cache.set(cacheKey, companyDetails, 3600); // Cache for 1 hour
    
    return companyDetails;
  } catch (error) {
    logger.error(`Error fetching company details for ${symbol}:`, error);
    throw new Error(`Failed to fetch company details for ${symbol}`);
  }
}

/**
 * Get latest news for a specific company
 * @param {string} symbol - Company symbol
 * @returns {Promise<Array>} Array of news articles
 */
async function getCompanyNews(symbol) {
  try {
    const cacheKey = `news_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // For demo purposes, generate mock news data
    const news = getMockNews(symbol);
    
    // Cache the result
    cache.set(cacheKey, news, 1800); // Cache for 30 minutes
    
    return news;
  } catch (error) {
    logger.error(`Error fetching news for ${symbol}:`, error);
    throw new Error(`Failed to fetch news for ${symbol}`);
  }
}

/**
 * Generate mock company data for development/testing
 * @returns {Array} Mock company data
 */
function getMockCompanies() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', exchange: 'NASDAQ', change: 1.23 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software', exchange: 'NASDAQ', change: 0.85 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'Internet Retail', exchange: 'NASDAQ', change: -0.52 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', industry: 'Internet Content & Information', exchange: 'NASDAQ', change: 1.45 },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', industry: 'Internet Content & Information', exchange: 'NASDAQ', change: -0.32 },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', exchange: 'NASDAQ', change: 2.56 },
    { symbol: 'BRK.A', name: 'Berkshire Hathaway Inc.', sector: 'Financial Services', industry: 'Insurance', exchange: 'NYSE', change: 0.21 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers', exchange: 'NYSE', change: -0.78 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banks', exchange: 'NYSE', change: 0.65 },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', industry: 'Credit Services', exchange: 'NYSE', change: 0.12 },
    { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Defensive', industry: 'Household Products', exchange: 'NYSE', change: -0.45 },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', industry: 'Healthcare Plans', exchange: 'NYSE', change: 1.34 },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Cyclical', industry: 'Home Improvement Retail', exchange: 'NYSE', change: -1.23 },
    { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication Services', industry: 'Entertainment', exchange: 'NYSE', change: 0.87 },
    { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financial Services', industry: 'Banks', exchange: 'NYSE', change: 0.54 },
    { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', industry: 'Telecom Services', exchange: 'NYSE', change: -0.23 },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', industry: 'Software', exchange: 'NASDAQ', change: 1.76 },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Entertainment', exchange: 'NASDAQ', change: 2.34 },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', industry: 'Software', exchange: 'NYSE', change: 0.43 },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', industry: 'Semiconductors', exchange: 'NASDAQ', change: -1.56 }
  ];
}

/**
 * Generate a random company description
 * @param {string} name - Company name
 * @param {string} sector - Company sector
 * @returns {string} Company description
 */
function getCompanyDescription(name, sector) {
  const descriptions = [
    `${name} is a leading global company in the ${sector} sector, known for innovative products and services.`,
    `Founded with a mission to revolutionize the ${sector} industry, ${name} has grown to become a major player in global markets.`,
    `${name} develops and delivers cutting-edge solutions for customers in the ${sector} space, with operations in over 50 countries.`,
    `As a pioneer in the ${sector} sector, ${name} continues to set industry standards with its commitment to excellence and innovation.`,
    `${name} is dedicated to creating sustainable value for shareholders while providing exceptional products and services in the ${sector} industry.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate a random CEO name
 * @returns {string} CEO name
 */
function getRandomCEO() {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Jennifer', 'Robert', 'Lisa', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * Generate a random headquarters location
 * @returns {string} Headquarters location
 */
function getRandomHeadquarters() {
  const cities = ['New York', 'San Francisco', 'Seattle', 'Chicago', 'Boston', 'Los Angeles', 'Austin', 'Denver', 'Atlanta', 'Miami'];
  const states = ['NY', 'CA', 'WA', 'IL', 'MA', 'CA', 'TX', 'CO', 'GA', 'FL'];
  
  const index = Math.floor(Math.random() * cities.length);
  return `${cities[index]}, ${states[index]}`;
}

/**
 * Generate mock news data for a company
 * @param {string} symbol - Company symbol
 * @returns {Array} Mock news articles
 */
function getMockNews(symbol) {
  const companies = getMockCompanies();
  const company = companies.find(c => c.symbol === symbol) || { name: symbol };
  
  const newsHeadlines = [
    `${company.name} Reports Strong Quarterly Earnings, Exceeding Analyst Expectations`,
    `${company.name} Announces New Product Launch Set for Next Quarter`,
    `${company.name} Expands Operations with New Facility Opening`,
    `${company.name} CEO Discusses Future Growth Strategy in Interview`,
    `${company.name} Stock Rises on Positive Industry Outlook`,
    `Analysts Upgrade ${company.name} Stock Rating to "Buy"`,
    `${company.name} Partners with Tech Giant for New Initiative`,
    `${company.name} Announces Stock Buyback Program`,
    `${company.name} Invests in Renewable Energy for Operations`,
    `${company.name} Faces Regulatory Scrutiny Over Recent Acquisition`
  ];
  
  const news = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 10; i++) {
    const publishedDate = new Date(currentDate);
    publishedDate.setDate(publishedDate.getDate() - Math.floor(Math.random() * 30));
    
    news.push({
      id: `news-${symbol}-${i}`,
      headline: newsHeadlines[i],
      summary: `${newsHeadlines[i]}. This is a mock news summary for ${company.name} that would contain more details about the headline event.`,
      source: ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal'][Math.floor(Math.random() * 5)],
      url: `https://example.com/news/${symbol.toLowerCase()}/${i}`,
      publishedDate: publishedDate.toISOString(),
      image: `https://via.placeholder.com/300x200?text=${symbol}`
    });
  }
  
  return news;
}

module.exports = {
  getAllCompanies,
  searchCompanies,
  getCompanyDetails,
  getCompanyNews
};
