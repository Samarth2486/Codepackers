import React, { useState } from 'react';
import './Navbar.css';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false); // close menu on mobile
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => scrollToSection('hero')}>
          Codepackers Software Solutions
        </div>

        <div className="navbar-links">
          <button onClick={() => scrollToSection('hero')}>{t('navbar.home')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.ai_chat')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.form')}</button>
          <button onClick={() => scrollToSection('media')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('capabilities')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('analytics')}>{t('navbar.analytics')}</button>
          <button onClick={() => scrollToSection('contact')}>{t('navbar.contact')}</button>
        </div>

        <div className="navbar-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
          <span />
          <span />
          <span />
        </div>

        {/* Language Switcher */}
        <div className="language-switcher">
          <button onClick={() => changeLanguage('en')}>EN</button>
          <button onClick={() => changeLanguage('es')}>ES</button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu open">
          <button onClick={() => scrollToSection('hero')}>{t('navbar.home')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.ai_chat')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.form')}</button>
          <button onClick={() => scrollToSection('media')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('capabilities')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('analytics')}>{t('navbar.analytics')}</button>
          <button onClick={() => scrollToSection('contact')}>{t('navbar.contact')}</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
