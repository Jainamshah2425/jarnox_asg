import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Fetch list of available companies
export const fetchCompanies = async () => {
  try {
    const response = await apiClient.get('/companies');
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// Fetch stock data for a specific company and time range
export const fetchStockData = async (symbol, timeRange) => {
  try {
    const response = await apiClient.get(`/stocks/${symbol}`, {
      params: { timeRange },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw error;
  }
};

// Fetch company details
export const fetchCompanyDetails = async (symbol) => {
  try {
    const response = await apiClient.get(`/companies/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching company details for ${symbol}:`, error);
    throw error;
  }
};

// Search for companies
export const searchCompanies = async (query) => {
  try {
    const response = await apiClient.get('/companies/search', {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
};

// Fetch current quote for a stock
export const fetchCurrentQuote = async (symbol) => {
  try {
    const response = await apiClient.get(`/stocks/${symbol}/quote`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching current quote for ${symbol}:`, error);
    throw error;
  }
};

// Compare multiple stocks
export const compareStocks = async (symbols, timeRange = '1m') => {
  try {
    const response = await apiClient.get('/stocks/compare', {
      params: { 
        symbols: symbols.join(','),
        timeRange 
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error comparing stocks:', error);
    throw error;
  }
};

// Fetch technical indicators for a stock
export const fetchStockIndicators = async (symbol, indicator, timeRange = '1m') => {
  try {
    const response = await apiClient.get(`/stocks/${symbol}/indicators`, {
      params: { indicator, timeRange },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching indicators for ${symbol}:`, error);
    throw error;
  }
};

// Fetch comprehensive technical analysis
export const fetchTechnicalAnalysis = async (symbol, timeRange = '3m') => {
  try {
    const response = await apiClient.get(`/stocks/${symbol}/technical-analysis`, {
      params: { timeRange },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching technical analysis for ${symbol}:`, error);
    throw error;
  }
};

// Fetch 52-week high/low data
export const fetch52WeekData = async (symbol) => {
  try {
    const response = await apiClient.get(`/stocks/${symbol}/52week`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching 52-week data for ${symbol}:`, error);
    throw error;
  }
};

// Add request interceptor for potential auth
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error statuses
    if (error.response) {
      // Server responded with an error status code
      console.error('Server Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Error setting up the request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);
