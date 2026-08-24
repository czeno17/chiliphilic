import React from 'react';
import styles from './Sidebar.module.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'mps', label: 'MPS', icon: '📅' },
  { id: 'production', label: 'Work Orders', icon: '🏭' },
  { id: 'mrp', label: 'MRP', icon: '📋' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'procurement', label: 'Procurement', icon: '🛒' },
  { id: 'bom', label: 'BOM', icon: '🧾' },
  { id: 'alerts', label: 'Alerts', icon: '🚨' },
  { id: 'history', label: 'History', icon: '📜' },
];

export const Sidebar = ({ isOpen, onClose, isMobile, activeTab, onTabChange }) => {
  return (
    <>
      {isMobile && isOpen && (
        <div className={styles.overlay} onClick={onClose} />
      )}
      
      <aside 
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navLink} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => {
                onTabChange(item.id);
                if (isMobile) onClose();
              }}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className={styles.footer}>
          <div className={styles.shortcutHint}>
            <kbd>⌘B</kbd> Toggle sidebar
          </div>
        </div>
      </aside>
    </>
  );
};