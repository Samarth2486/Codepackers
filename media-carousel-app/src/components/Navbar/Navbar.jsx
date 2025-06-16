import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false); // close menu on mobile
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => scrollToSection('hero')}>
          Codepackers Software Solutions
        </div>

        <div className="navbar-links">
          <button onClick={() => scrollToSection('hero')}>Home</button>
          <button onClick={() => scrollToSection('ai-form')}>AI Chat Carousel</button>
          <button onClick={() => scrollToSection('ai-form')}>Form</button>
          <button onClick={() => scrollToSection('media')}>Media Carousel</button>
          <button onClick={() => scrollToSection('capabilities')}>Capabilities</button>
          <button onClick={() => scrollToSection('analytics')}>Analytics</button>
          <button onClick={() => scrollToSection('contact')}>Contact</button>
        </div>

        <div
          className="navbar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu open">
          <button onClick={() => scrollToSection('hero')}>Home</button>
          <button onClick={() => scrollToSection('ai-form')}>AI Chat Carousel</button>
          <button onClick={() => scrollToSection('ai-form')}>Form</button>
          <button onClick={() => scrollToSection('media')}>Media Carousel</button>
          <button onClick={() => scrollToSection('capabilities')}>Capabilities</button>
          <button onClick={() => scrollToSection('analytics')}>Analytics</button>
          <button onClick={() => scrollToSection('contact')}>Contact</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
