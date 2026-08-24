import React from 'react';
import styles from './Card.module.css';

export const Card = ({ 
  children, 
  title,
  subtitle,
  icon,
  status,
  className = '',
  onClick,
  loading = false,
  ...props 
}) => {
  return (
    <div 
      className={`${styles.card} ${status ? styles[status] : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      ) : (
        <>
          {(title || subtitle || icon) && (
            <div className={styles.header}>
              {icon && <div className={styles.icon}>{icon}</div>}
              <div className={styles.titleGroup}>
                {title && <h3 className={styles.title}>{title}</h3>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
            </div>
          )}
          <div className={styles.body}>
            {children}
          </div>
        </>
      )}
    </div>
  );
};