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
      setMenuOpen(false);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo left */}
        <div
          className="navbar-logo"
          onClick={() => scrollToSection('hero')}
          translate="no"
        >
          <span style={{ color: '#1f3c88', fontWeight: 700 }}>
            {t('brand')}
          </span>
        </div>

        {/* Links center/right */}
        <div className="navbar-links">
          <button onClick={() => scrollToSection('hero')}>{t('navbar.home')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.ai_chat')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.form')}</button>
          <button onClick={() => scrollToSection('capabilities')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('analytics')}>{t('navbar.analytics')}</button>
          <button onClick={() => scrollToSection('contact')}>{t('navbar.contact')}</button>
        </div>

        {/* Language toggle + hamburger right */}
        <div className="navbar-actions">
          <div className="language-switcher">
            <button
              className={i18n.language === 'en' ? 'active' : ''}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={i18n.language === 'es' ? 'active' : ''}
              onClick={() => changeLanguage('es')}
            >
              ES
            </button>
          </div>
          <div className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu open">
          <button onClick={() => scrollToSection('hero')}>{t('navbar.home')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.ai_chat')}</button>
          <button onClick={() => scrollToSection('ai-form')}>{t('navbar.form')}</button>
          <button onClick={() => scrollToSection('capabilities')}>{t('navbar.capabilities')}</button>
          <button onClick={() => scrollToSection('analytics')}>{t('navbar.analytics')}</button>
          <button onClick={() => scrollToSection('contact')}>{t('navbar.contact')}</button>
          <div className="mobile-lang">
            <button
              className={i18n.language === 'en' ? 'active' : ''}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={i18n.language === 'es' ? 'active' : ''}
              onClick={() => changeLanguage('es')}
            >
              ES
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
