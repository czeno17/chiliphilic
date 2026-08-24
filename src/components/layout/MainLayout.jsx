import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';

export const MainLayout = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);
  
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button
          className={styles.menuToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
        >
          <span className={styles.hamburger} />
        </button>
        
        <div className={styles.brand}>
          <span className={styles.logo}>🌶️</span>
          <h1 className={styles.title}>chiliphilic</h1>
          <span className={styles.version}>v1.0</span>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} aria-label="Notifications">
            🔔
          </button>
          <button className={styles.actionBtn} aria-label="User menu">
            👤
          </button>
        </div>
      </header>
      
      <div className={styles.body}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};