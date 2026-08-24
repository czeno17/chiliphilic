import React from 'react';
import styles from './Container.module.css';

export const Container = ({ 
  children, 
  maxWidth = '1280px',
  padding = true,
  className = '' 
}) => {
  return (
    <div 
      className={`${styles.container} ${className}`}
      style={{ '--max-width': maxWidth }}
    >
      {children}
    </div>
  );
};