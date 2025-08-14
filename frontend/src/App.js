import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CompanyList from './components/CompanyList';
import StockChart from './components/StockChart';
import StockInfo from './components/StockInfo';
import LiveQuote from './components/LiveQuote';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import StockComparison from './components/StockComparison';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { fetchCompanies, fetchStockData } from './services/stockService';
import './styles/App.css';

function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [timeRange, setTimeRange] = useState('1m'); // Default time range (1 month)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // New state for tab navigation

  // Fetch list of companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await fetchCompanies();
        setCompanies(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load companies. Please try again later.');
        setLoading(false);
      }
    };
    
    loadCompanies();
  }, []);

  // Fetch stock data when selected company or time range changes
  useEffect(() => {
    if (!selectedCompany) return;
    
    const loadStockData = async () => {
      try {
        setLoading(true);
        const data = await fetchStockData(selectedCompany.symbol, timeRange);
        setStockData(data);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load stock data for ${selectedCompany.name}. Please try again later.`);
        setLoading(false);
      }
    };
    
    loadStockData();
  }, [selectedCompany, timeRange]);

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setError(null); // Clear any previous errors
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <aside className="sidebar">
          {loading && !companies.length ? (
            <LoadingSpinner />
          ) : (
            <CompanyList
              companies={companies}
              selectedCompany={selectedCompany}
              onSelectCompany={handleCompanySelect}
            />
          )}
        </aside>
        
        <section className="content">
          {error && <ErrorMessage message={error} />}
          
          {loading && selectedCompany ? (
            <LoadingSpinner />
          ) : selectedCompany ? (
            <>
              <StockInfo
                company={selectedCompany}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
              
              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  📊 Overview
                </button>
                <button 
                  className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chart')}
                >
                  📈 Chart
                </button>
                <button 
                  className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`}
                  onClick={() => setActiveTab('technical')}
                >
                  🔬 Technical Analysis
                </button>
                <button 
                  className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
                  onClick={() => setActiveTab('compare')}
                >
                  ⚖️ Compare Stocks
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <LiveQuote symbol={selectedCompany.symbol} />
                    {stockData && (
                      <div className="mini-chart">
                        <StockChart
                          data={stockData}
                          company={selectedCompany}
                          mini={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chart' && stockData && (
                  <div className="chart-tab">
                    <StockChart
                      data={stockData}
                      company={selectedCompany}
                    />
                  </div>
                )}

                {activeTab === 'technical' && (
                  <div className="technical-tab">
                    <TechnicalAnalysis symbol={selectedCompany.symbol} />
                  </div>
                )}

                {activeTab === 'compare' && (
                  <div className="compare-tab">
                    <StockComparison />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="welcome-message">
              <h2>Welcome to the Enhanced Stock Market Dashboard</h2>
              <p>Select a company from the list to view detailed analysis, or start comparing stocks:</p>
              <ul className="feature-list">
                <li>📊 Real-time quotes with 52-week ranges</li>
                <li>📈 Interactive price charts</li>
                <li>🔬 Advanced technical analysis</li>
                <li>📉 Trading signals & indicators</li>
              </ul>
              <div className="welcome-actions">
                <button 
                  className="compare-mode-btn"
                  onClick={() => setActiveTab('compare')}
                >
                  ⚖️ Compare Stocks
                </button>
              </div>
              
              {/* Show comparison component if activeTab is compare */}
              {activeTab === 'compare' && (
                <div className="global-comparison">
                  <StockComparison />
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Stock Market Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
