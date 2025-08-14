import React from 'react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-icon">📈</span>
        <h1>Stock Market Dashboard</h1>
      </div>
      <nav className="nav">
        <ul className="nav-list">
          <li className="nav-item active">Dashboard</li>
          <li className="nav-item">Markets</li>
          <li className="nav-item">Watchlist</li>
          <li className="nav-item">News</li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
