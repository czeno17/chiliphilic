// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Container } from '../common/Container';
import { Card } from '../common/Card';
import { ResponsiveTable } from '../common/ResponsiveTable';
import { KeyboardShortcuts } from '../common/KeyboardShortcuts';
import { useKeyboard } from '../../hooks/useKeyboard';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    workOrders: { total: 0, active: 0, completed: 0 },
    mps: { total: 0, pending: 0 },
    criticalMaterials: 0,
    openPOs: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [
          { data: workOrders, error: woError },
          { data: mpsData, error: mpsError },
          { data: products, error: prodError },
          { data: purchaseOrders, error: poError }
        ] = await Promise.all([
          supabase.from('work_orders').select('*'),
          supabase.from('mps').select('*'),
          supabase.from('products').select('*'), // Removed the stock filter
          supabase.from('purchase_orders').select('*').eq('status', 'open')
        ]);
        
        if (woError) throw woError;
        if (mpsError) throw mpsError;
        if (prodError) throw prodError;
        if (poError) throw poError;
        
        // Calculate metrics based on your actual data
        const totalWorkOrders = workOrders?.length || 0;
        const activeWorkOrders = workOrders?.filter(wo => wo.status === 'in-progress' || wo.status === 'pending').length || 0;
        const completedWorkOrders = workOrders?.filter(wo => wo.status === 'completed').length || 0;
        
        // For critical materials - check if you have a different column name
        // If you have inventory table, use that instead
        let criticalCount = 0;
        if (products && products.length > 0) {
          // Adjust this based on your actual columns
          // Example: if you have 'current_stock' and 'min_stock' columns
          criticalCount = products.filter(p => 
            (p.current_stock || p.stock_quantity || 0) < (p.min_stock || p.reorder_point || 10)
          ).length;
        }
        
        // Calculate MPS stats
        const totalMPS = mpsData?.length || 0;
        const pendingMPS = mpsData?.filter(m => m.status === 'pending' || m.status === 'planned').length || 0;
        
        // Calculate open POs
        const openPOs = purchaseOrders?.length || 0;
        
        setMetrics({
          workOrders: {
            total: totalWorkOrders,
            active: activeWorkOrders,
            completed: completedWorkOrders,
          },
          mps: {
            total: totalMPS,
            pending: pendingMPS,
          },
          criticalMaterials: criticalCount,
          openPOs: openPOs,
        });
        
        // Set recent orders (last 5)
        setRecentOrders(workOrders?.slice(0, 5) || []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Keyboard shortcuts
  const shortcuts = {
    'ctrl+n': 'Create new order',
    'ctrl+r': 'Refresh data',
    'ctrl+f': 'Focus search',
  };
  
  useKeyboard(shortcuts);

  // Loading state
  if (loading) {
    return (
      <Container>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container>
        <div className={styles.errorState}>
          <p>Error loading dashboard: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.dashboard}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Overview of your production planning and inventory
            </p>
          </div>
          <div className={styles.actions}>
            <button 
              className={styles.primaryBtn} 
              onClick={() => console.log('New WO')}
            >
              + New Work Order
            </button>
            <button 
              className={styles.secondaryBtn} 
              onClick={() => window.location.reload()}
            >
              ↻ Refresh
            </button>
          </div>
        </header>
        
        {/* Primary Metrics */}
        <section className={styles.primaryMetrics}>
          <div className={styles.metricGrid}>
            <Card
              title="Work Orders"
              subtitle={`${metrics.workOrders.active} active, ${metrics.workOrders.completed} completed`}
              icon="🏭"
              status="info"
            >
              <div className={styles.metricValue}>{metrics.workOrders.total}</div>
              <div className={styles.metricDetail}>
                <span className={styles.metricChange}>Total</span>
                <span>work orders</span>
              </div>
            </Card>
            
            <Card
              title="MPS Items"
              subtitle={`${metrics.mps.pending} pending`}
              icon="📅"
              status="warning"
            >
              <div className={styles.metricValue}>{metrics.mps.total}</div>
              <div className={styles.metricDetail}>
                <span>Active</span>
                <span>production schedule</span>
              </div>
            </Card>
          </div>
        </section>
        
        {/* Secondary Metrics */}
        <section className={styles.secondaryMetrics}>
          <div className={styles.metricGrid}>
            <Card
              title="Critical Shortages"
              icon="🚨"
              status="danger"
            >
              <div className={styles.metricValue}>{metrics.criticalMaterials}</div>
              <div className={styles.metricDetail}>
                <span className={styles.metricAlert}>⚠️</span>
                <span>Items below minimum stock</span>
              </div>
            </Card>
            
            <Card
              title="Open Purchase Orders"
              icon="🛒"
              status="info"
            >
              <div className={styles.metricValue}>{metrics.openPOs}</div>
              <div className={styles.metricDetail}>
                <span>Waiting</span>
                <span>for delivery</span>
              </div>
            </Card>
          </div>
        </section>
        
        {/* Recent Orders */}
        <section className={styles.detailedViews}>
          <Card
            title="Recent Work Orders"
            subtitle="Latest orders"
            icon="📋"
          >
            <ResponsiveTable
              headers={[
                { key: 'id', label: 'Order ID' },
                { key: 'product_name', label: 'Product' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Date' },
              ]}
              data={recentOrders}
              renderRow={(item) => (
                <>
                  <td data-label="Order ID">
                    <span className={styles.orderId}>{item.id || 'N/A'}</span>
                  </td>
                  <td data-label="Product">{item.product_name || item.product_id || 'N/A'}</td>
                  <td data-label="Quantity">{item.quantity || 0}</td>
                  <td data-label="Status">
                    <span className={`${styles.status} ${styles[item.status || 'pending']}`}>
                      {item.status || 'pending'}
                    </span>
                  </td>
                  <td data-label="Date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </>
              )}
              sortable
              onRowClick={(item) => console.log('Selected:', item)}
            />
          </Card>
          
          <div className={styles.alertGrid}>
            <Card title="Quick Actions" status="info">
              <div className={styles.alertList}>
                <div className={styles.alertItem}>
                  <span className={styles.alertIcon}>📦</span>
                  <div>
                    <div className={styles.alertTitle}>Create New Work Order</div>
                    <div className={styles.alertDetail}>Click the "New Work Order" button above</div>
                  </div>
                </div>
                <div className={styles.alertItem}>
                  <span className={styles.alertIcon}>🔄</span>
                  <div>
                    <div className={styles.alertTitle}>Refresh Data</div>
                    <div className={styles.alertDetail}>Click refresh or use ⌘R</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
      
      <KeyboardShortcuts shortcuts={shortcuts} />
    </Container>
  );
};