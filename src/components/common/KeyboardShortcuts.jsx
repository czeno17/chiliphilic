import React from 'react';
import { formatShortcut } from '../../hooks/useKeyboard';
import styles from './KeyboardShortcuts.module.css';

export const KeyboardShortcuts = ({ shortcuts, className = '' }) => {
  // Make sure shortcuts is an object
  if (!shortcuts || typeof shortcuts !== 'object') {
    return null;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <details className={styles.details}>
        <summary className={styles.summary}>
          ⌨️ Keyboard Shortcuts
        </summary>
        <div className={styles.grid}>
          {Object.entries(shortcuts).map(([key, description]) => (
            <div key={key} className={styles.item}>
              <kbd className={styles.key}>{formatShortcut(key)}</kbd>
              <span className={styles.description}>
                {typeof description === 'function' ? 'Action' : description}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};