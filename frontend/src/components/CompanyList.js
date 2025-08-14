import React, { useState } from 'react';
import '../styles/CompanyList.css';

function CompanyList({ companies, selectedCompany, onSelectCompany }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="company-list">
      <div className="company-list-header">
        <h2>Companies</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="company-search"
          />
        </div>
      </div>
      
      {companies.length === 0 ? (
        <div className="company-list-message">Loading companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="company-list-message">No companies match your search.</div>
      ) : (
        <ul className="companies">
          {filteredCompanies.map(company => (
            <li 
              key={company.symbol}
              className={`company-item ${selectedCompany && selectedCompany.symbol === company.symbol ? 'selected' : ''}`}
              onClick={() => onSelectCompany(company)}
            >
              <div className="company-logo">
                {company.symbol.substring(0, 2).toUpperCase()}
              </div>
              <div className="company-info">
                <h3 className="company-name">{company.name}</h3>
                <span className="company-symbol">{company.symbol}</span>
              </div>
              {company.change && (
                <div className={`company-change ${company.change >= 0 ? 'positive' : 'negative'}`}>
                  {company.change >= 0 ? '+' : ''}{company.change}%
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompanyList;
