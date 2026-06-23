import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from './supabaseClient';

// ─── HELPERS ──────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const getMonday = (d) => { const dt = new Date(d); const day = dt.getDay(); const diff = dt.getDate() - day + (day === 0 ? -6 : 1); dt.setDate(diff); return dt.toISOString().slice(0, 10); };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : n;
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtNum = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toFixed(3).replace(/\.?0+$/, '');
};

// ─── CONSTANTS ────────────────────────────────────────────────────────
const FINISHED_GOODS = [
  { id: 'FG-001', name: 'Buffalo Wing Hot Sauce' },
  { id: 'FG-002', name: 'Green Mamba Chilli Sauce' },
  { id: 'FG-003', name: 'Orange is the New Red' },
  { id: 'FG-004', name: 'A Taste of Bangalore' },
];

// Fallback units (only used if product has no unit stored)
const UNITS = {
  'RM-CHILI-CAY': 'g', 'RM-VEG-GAR': 'g', 'RM-SP-CUM': 'g', 'RM-SP-JUN': 'g',
  'RM-SP-CHFL': 'g', 'RM-CHEM-SALT': 'g', 'RM-LIQ-WAT': 'g', 'RM-LIQ-WVIN': 'g',
  'RM-STAB-XAN': 'g', 'RM-CHILI-KBEL': 'g', 'RM-CHILI-HJAL': 'g', 'RM-VEG-ONION': 'g',
  'RM-VEG-GIN': 'g', 'RM-VEG-COR': 'g', 'RM-LIQ-ACID': 'g', 'RM-LIQ-LIME': 'g',
  'RM-CHEM-SUG': 'g', 'RM-CHILI-HAB': 'g', 'RM-CHILI-SRUSH': 'g', 'RM-VEG-BORN': 'g',
  'RM-CHILI-BANG': 'g', 'PM-BTL-150': 'pcs', 'PM-CAP-24R': 'pcs', 'PM-LBL-BUF': 'pcs',
  'PM-CAP-24G': 'pcs', 'PM-LBL-GRN': 'pcs', 'PM-CAP-24W': 'pcs', 'PM-LBL-ORN': 'pcs',
  'PM-CAP-24B': 'pcs', 'PM-LBL-BNG': 'pcs', 'SF-BUF-FERM': 'kg', 'SF-ORN-MASH': 'kg',
};

const LEAD_TIMES = {
  'RM-CHILI-CAY': 2, 'RM-VEG-GAR': 2, 'RM-SP-CUM': 2, 'RM-SP-JUN': 2,
  'RM-SP-CHFL': 2, 'RM-CHEM-SALT': 2, 'RM-LIQ-WAT': 1, 'RM-LIQ-WVIN': 3,
  'RM-STAB-XAN': 4, 'RM-CHILI-KBEL': 2, 'RM-CHILI-HJAL': 2, 'RM-VEG-ONION': 2,
  'RM-VEG-GIN': 2, 'RM-VEG-COR': 2, 'RM-LIQ-ACID': 2, 'RM-LIQ-LIME': 2,
  'RM-CHEM-SUG': 2, 'RM-CHILI-HAB': 2, 'RM-CHILI-SRUSH': 2, 'RM-VEG-BORN': 2,
  'RM-CHILI-BANG': 2, 'PM-BTL-150': 5, 'PM-CAP-24R': 5, 'PM-LBL-BUF': 5,
  'PM-CAP-24G': 5, 'PM-LBL-GRN': 5, 'PM-CAP-24W': 5, 'PM-LBL-ORN': 5,
  'PM-CAP-24B': 5, 'PM-LBL-BNG': 5, 'SF-BUF-FERM': 7, 'SF-ORN-MASH': 30,
};

const DAILY_CAPACITY = 120;
const WEEKLY_CAPACITY = DAILY_CAPACITY * 6;
const HORIZON = 6;

// ─── UI COMPONENTS (memoized) ──────────────────────────────────────
const Badge = memo(({ type, children }) => {
  const colors = {
    success: '#ea580c',
    warning: '#f59e0b',
    danger: '#dc2626',
    info: '#f97316',
    neutral: '#4b5563',
  };
  return <span style={{ background: colors[type] || colors.neutral, color: '#fff', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .5, whiteSpace: 'nowrap' }}>{children}</span>;
});

const Card = memo(({ title, subtitle, children, accent, style = {}, headerRight }) => {
  const accentColor = accent || '#dc2626';
  return <div style={{ background: '#1a1a1a', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.5)', border: '1px solid #2d2d2d', overflow: 'hidden', ...style }}>
    {title && <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 4, height: 24, background: accentColor, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {headerRight && <div>{headerRight}</div>}
    </div>}
    <div style={{ padding: 20, color: '#f8fafc' }}>{children}</div>
  </div>;
});

const Btn = memo(({ onClick, children, variant = 'primary', size = 'md', disabled = false, style = {} }) => {
  const variants = {
    primary: { background: '#dc2626', color: '#fff' },
    success: { background: '#ea580c', color: '#fff' },
    danger: { background: '#ef4444', color: '#fff' },
    warning: { background: '#f59e0b', color: '#000' },
    ghost: { background: '#2d2d2d', color: '#f8fafc' },
    purple: { background: '#7c3aed', color: '#fff' },
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 11 },
    md: { padding: '8px 18px', fontSize: 13 },
    lg: { padding: '10px 24px', fontSize: 14 }
  };
  return <button disabled={disabled} onClick={onClick} style={{ ...variants[variant], ...sizes[size], borderRadius: 7, border: 'none', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all .2s', ...style }}>{children}</button>;
});

const Input = memo(function Input({ label, value, onChange, type = 'text', style = {}, min, max, step, placeholder, note, id }) {
  const inputId = id || label?.replace(/\s/g, '-') || Math.random().toString(36).slice(2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label htmlFor={inputId} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: .5, textTransform: 'uppercase' }}>{label}</label>}
      <input
        id={inputId}
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        autoComplete="off"
        style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #2d2d2d', fontSize: 13, color: '#f8fafc', background: '#0a0a0a', outline: 'none', transition: 'border .2s', ...style }}
      />
      {note && <span style={{ fontSize: 10, color: '#64748b' }}>{note}</span>}
    </div>
  );
});

const Select = memo(function Select({ label, value, onChange, options, style = {} }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: .5, textTransform: 'uppercase' }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #2d2d2d', fontSize: 13, color: '#f8fafc', background: '#0a0a0a', outline: 'none', transition: 'border .2s', ...style }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>;
});

const CapBar = memo(({ pct, color }) => {
  const p = Math.min(100, Math.max(0, pct));
  const bg = pct > 100 ? '#dc2626' : pct > 80 ? '#f59e0b' : color || '#ea580c';
  return <div style={{ background: '#2d2d2d', borderRadius: 4, height: 8, marginTop: 4 }}>
    <div style={{ width: `${p}%`, background: bg, height: 8, borderRadius: 4, transition: 'width .3s' }} />
  </div>;
});

const KpiCard = memo(({ icon, label, value, color }) => {
  return <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '18px 16px', border: '1px solid #2d2d2d', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 24, background: `${color}22`, borderRadius: 10, padding: '8px 10px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  </div>;
});

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [bom, setBom] = useState([]);
  const [mpsEntries, setMpsEntries] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notif, setNotif] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editingPOId, setEditingPOId] = useState(null);
  const [editPOData, setEditPOData] = useState({
  supplier: '',
  unit_cost: 0,
  expected_date: '',
  notes: '',
});
  const [bomParent, setBomParent] = useState(FINISHED_GOODS[0]?.id || '');
  const [mpsView, setMpsView] = useState('schedule');

  // ── Demand Forecast (now saved to Supabase) ──────────────────────
  const [demandRows, setDemandRows] = useState([]);
  const [demandForecastLoaded, setDemandForecastLoaded] = useState(false);

  const [woFilter, setWoFilter] = useState('All');

  // ── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ── Data fetching ───────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [prodRes, bomRes, mpsRes, woRes, poRes, auditRes, demandForecastRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('bom').select('*'),
        supabase.from('mps').select('*').order('week_start', { ascending: true }),
        supabase.from('work_orders').select('*').order('scheduled_date', { ascending: true }),
        supabase.from('purchase_orders').select('*').order('order_date', { ascending: false }),
        supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(200),
        supabase.from('demand_forecast').select('*'),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (bomRes.error) throw bomRes.error;
      if (mpsRes.error) throw mpsRes.error;
      if (woRes.error) throw woRes.error;
      if (poRes.error) throw poRes.error;
      if (auditRes.error) throw auditRes.error;
      if (demandForecastRes.error) throw demandForecastRes.error;
      
      setProducts(prodRes.data || []);
      setBom(bomRes.data || []);
      setMpsEntries(mpsRes.data || []);
      setWorkOrders(woRes.data || []);
      setPurchaseOrders(poRes.data || []);
      setAuditLogs(auditRes.data || []);
      
      // ── Load demand forecast ──
      if (demandForecastRes.data) {
        setDemandRowsFromDB(demandForecastRes.data);
      } else {
        setDemandRowsFromDB([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load data: ' + err.message);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  // ── Demand forecast: convert DB rows to format used by DemandView ──
  const setDemandRowsFromDB = useCallback((dbData) => {
    const weekStarts = Array.from({ length: HORIZON }, (_, i) => getMonday(addDays(today(), i * 7)));
    const grouped = {};
    dbData.forEach(row => {
      if (!grouped[row.product_id]) {
        grouped[row.product_id] = { productId: row.product_id, weeks: {} };
      }
      grouped[row.product_id].weeks[row.week_start] = row.quantity;
    });

    const result = FINISHED_GOODS.map(fg => {
      const existing = grouped[fg.id];
      if (existing) {
        weekStarts.forEach(w => {
          if (!existing.weeks[w]) existing.weeks[w] = 0;
        });
        return existing;
      } else {
        return {
          productId: fg.id,
          weeks: Object.fromEntries(weekStarts.map(w => [w, 0]))
        };
      }
    });
    setDemandRows(result);
    setDemandForecastLoaded(true);
  }, []);

  // ─── Save a single demand forecast entry ────────────────────────
  const saveDemandForecast = useCallback(async (productId, weekStart, quantity) => {
    const { data: existing } = await supabase
      .from('demand_forecast')
      .select('id')
      .eq('product_id', productId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('demand_forecast')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) console.error('Update demand forecast error:', error);
    } else {
      const { error } = await supabase
        .from('demand_forecast')
        .insert([{ product_id: productId, week_start: weekStart, quantity }]);
      if (error) console.error('Insert demand forecast error:', error);
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────
  const getProductName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : id;
  };
  // getProductUnit now prioritises product's own unit field
  const getProductUnit = (id) => {
    const p = products.find(p => p.id === id);
    if (p && p.unit) return p.unit;
    return UNITS[id] || 'unit';
  };
  const getProductLeadTime = (id) => LEAD_TIMES[id] || 2;
  const getProductStock = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.currentstock : 0;
  };
  const getProductSafetyStock = (id) => {
    const p = products.find(p => p.id === id);
    return p ? p.safetystock : 0;
  };
  const getProductReorderPoint = (id) => {
    return Math.round((getProductSafetyStock(id) || 0) * 1.5);
  };

  // ── MRP Engine ──────────────────────────────────────────────────
  const mrpData = useMemo(() => {
    const activeOrders = workOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
    const gross = {};
    const explode = (productId, quantity) => {
      const children = bom.filter(b => b.parentid === productId);
      if (children.length === 0) return;
      children.forEach(child => {
        const childQty = quantity * child.quantity;
        gross[child.componentid] = (gross[child.componentid] || 0) + childQty;
        const hasSub = bom.some(b => b.parentid === child.componentid);
        if (hasSub) explode(child.componentid, childQty);
      });
    };
    activeOrders.forEach(wo => {
      const hasBom = bom.some(b => b.parentid === wo.product_id);
      if (hasBom) explode(wo.product_id, wo.quantity);
      else gross[wo.product_id] = (gross[wo.product_id] || 0) + wo.quantity;
    });
    return Object.entries(gross).map(([mat, req]) => {
      const onHand = getProductStock(mat);
      const ss = getProductSafetyStock(mat);
      const net = Math.max(0, req + ss - onHand);
      const status = onHand >= req ? 'OK' : onHand >= req * 0.5 ? 'Low' : 'Critical';
      return {
        material: mat,
        unit: getProductUnit(mat),
        gross: +req.toFixed(3),
        onHand: +onHand.toFixed(3),
        safetyStock: +ss.toFixed(3),
        net: +net.toFixed(3),
        leadTime: getProductLeadTime(mat),
        status,
        name: getProductName(mat),
      };
    }).sort((a, b) => b.net - a.net);
  }, [workOrders, bom, products]);

  const alerts = useMemo(() => {
    const lowStock = products.filter(p => p.currentstock <= (p.safetystock * 1.5));
    const criticalStock = products.filter(p => p.currentstock <= p.safetystock);
    const overdueOrders = workOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.scheduled_date < today());
    return { lowStock, criticalStock, overdueOrders };
  }, [products, workOrders]);

  const notify = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  };

  const logAction = useCallback(async (tableName, recordId, action, oldData, newData) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email || 'unknown';
    const entry = {
      table_name: tableName,
      record_id: recordId,
      action,
      old_data: oldData || null,
      new_data: newData || null,
      changed_by: userEmail,
    };
    const { error } = await supabase.from('audit_log').insert([entry]);
    if (error) console.error('Audit log error:', error);
    else fetchData();
  }, [fetchData]);

  // ─── PRODUCT CRUD (with category and unit, using FG-xxx for finished goods) ──
  const addProduct = useCallback(async (productData) => {
    if (!productData.name.trim()) { notify('Please enter a product name.', 'danger'); return; }
    const existingProducts = products.filter(p => p.israw === productData.isRaw);
    let prefix;
    if (productData.isRaw) {
      prefix = 'RM';
    } else {
      // For finished goods, use FG
      prefix = 'FG';
    }
    // If category is subassembly, we might want SF prefix, but we'll keep it simple: only FG or RM.
    // To support subassemblies, we can also check category.
    if (!productData.isRaw && productData.category === 'subassembly') {
      prefix = 'SF';
    }
    const nextNum = existingProducts.length + 1;
    const id = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const exists = products.some(p => p.id === id);
    if (exists) {
      notify('ID collision, try again.', 'danger');
      return;
    }
    const dbProduct = {
      id,
      name: productData.name,
      leadtime: productData.leadTime,
      lotsize: productData.lotSize,
      currentstock: productData.currentStock,
      safetystock: productData.safetyStock,
      israw: productData.isRaw,
      category: productData.category || 'ingredient',
      unit: productData.unit || 'g',
    };
    try {
      const { error } = await supabase.from('products').insert([dbProduct]);
      if (error) throw error;
      await logAction('products', id, 'INSERT', null, dbProduct);
      fetchData();
      notify(`Product ${id} added.`, 'success');
    } catch (err) {
      alert('Error adding product: ' + err.message);
    }
  }, [products, logAction, fetchData, notify]);

  const startEditProduct = useCallback((product) => {
    setEditingProductId(product.id);
    setEditFormData({
      name: product.name,
      leadtime: product.leadtime,
      lotsize: product.lotsize,
      currentstock: product.currentstock,
      safetystock: product.safetystock,
      israw: product.israw,
      category: product.category || 'ingredient',
      unit: product.unit || 'g',
    });
  }, []);

  const cancelEditProduct = useCallback(() => {
    setEditingProductId(null);
    setEditFormData({});
  }, []);

  const saveEditProduct = useCallback(async (id) => {
    const existing = products.find(p => p.id === id);
    if (!existing) return;
    const updated = {
      name: editFormData.name,
      leadtime: editFormData.leadtime,
      lotsize: editFormData.lotsize,
      currentstock: editFormData.currentstock,
      safetystock: editFormData.safetystock,
      israw: editFormData.israw,
      category: editFormData.category,
      unit: editFormData.unit,
    };
    try {
      const { error } = await supabase.from('products').update(updated).eq('id', id);
      if (error) throw error;
      await logAction('products', id, 'UPDATE', existing, { ...existing, ...updated });
      fetchData();
      setEditingProductId(null);
      setEditFormData({});
      notify('Product updated.', 'success');
    } catch (err) {
      alert('Update error: ' + err.message);
    }
  }, [products, editFormData, logAction, fetchData, notify]);

  const deleteProduct = useCallback(async (id) => {
    const existing = products.find(p => p.id === id);
    if (!existing) return;
    if (!confirm(`Delete ${existing.name} (${id})?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await logAction('products', id, 'DELETE', existing, null);
      fetchData();
      notify('Product deleted.', 'warning');
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }, [products, logAction, fetchData, notify]);

  // ─── MPS CRUD ──────────────────────────────────────────────────
  const addMpsEntry = useCallback(async (productId, weekStart, quantity) => {
    if (!productId || !weekStart || quantity <= 0) { notify('Invalid entry.', 'danger'); return; }
    // Check if existing entry exists for this product+week
    const existing = mpsEntries.find(e => e.product_id === productId && e.week_start === weekStart);
    const payload = { product_id: productId, week_start: weekStart, quantity, shift: 'All' };
    try {
      if (existing) {
        const { error } = await supabase.from('mps').update(payload).eq('id', existing.id);
        if (error) throw error;
        await logAction('mps', existing.id, 'UPDATE', existing, payload);
        notify('MPS updated.');
      } else {
        const newId = `MPS-${Date.now()}`;
        const { error } = await supabase.from('mps').insert([{ ...payload, id: newId }]);
        if (error) throw error;
        await logAction('mps', newId, 'INSERT', null, payload);
        notify('MPS entry added.');
      }
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [mpsEntries, logAction, fetchData, notify]);

  const deleteMpsEntry = useCallback(async (id) => {
    const existing = mpsEntries.find(e => e.id === id);
    if (!existing) return;
    try {
      const { error } = await supabase.from('mps').delete().eq('id', id);
      if (error) throw error;
      await logAction('mps', id, 'DELETE', existing, null);
      fetchData();
      notify('MPS entry deleted.', 'warning');
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }, [mpsEntries, logAction, fetchData, notify]);

  const pushMpsToWorkOrders = useCallback(async () => {
    const newOrders = [];
    for (const e of mpsEntries) {
      const exists = workOrders.some(wo => wo.product_id === e.product_id && wo.scheduled_date === e.week_start && wo.from_mps === true);
      if (!exists) {
        newOrders.push({
          id: `WO-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
          product_id: e.product_id,
          quantity: e.quantity,
          scheduled_date: e.week_start,
          shift: e.shift || 'Morning',
          priority: 'Normal',
          status: 'Pending',
          from_mps: true,
        });
      }
    }
    if (newOrders.length === 0) { notify('No new WOs to create.', 'info'); return; }
    try {
      const { error } = await supabase.from('work_orders').insert(newOrders);
      if (error) throw error;
      for (const wo of newOrders) await logAction('work_orders', wo.id, 'INSERT', null, wo);
      fetchData();
      notify(`${newOrders.length} work order(s) created from MPS.`, 'success');
    } catch (err) {
      alert('Error creating WOs: ' + err.message);
    }
  }, [mpsEntries, workOrders, logAction, fetchData, notify]);

  // ─── WORK ORDER CRUD ──────────────────────────────────────────
  const createWorkOrder = useCallback(async (woData) => {
    const { productId, qty, schedDate, shift, priority } = woData;
    if (!productId || qty <= 0) { notify('Fill all fields.', 'danger'); return; }
    const wo = {
      id: `WO-${Date.now()}`,
      product_id: productId,
      quantity: qty,
      scheduled_date: schedDate,
      shift,
      priority,
      status: 'Pending',
      from_mps: false,
    };
    try {
      const { error } = await supabase.from('work_orders').insert([wo]);
      if (error) throw error;
      await logAction('work_orders', wo.id, 'INSERT', null, wo);
      fetchData();
      notify(`WO ${wo.id} created.`, 'success');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [logAction, fetchData, notify]);

  const updateWorkOrderStatus = useCallback(async (id, status) => {
    const existing = workOrders.find(o => o.id === id);
    if (!existing) return;
    try {
      const { error } = await supabase.from('work_orders').update({ status }).eq('id', id);
      if (error) throw error;
      await logAction('work_orders', id, 'UPDATE', existing, { ...existing, status });
      fetchData();
      notify(`WO ${id} → ${status}.`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [workOrders, logAction, fetchData, notify]);

  // ─── INVENTORY CRUD ───────────────────────────────────────────
  const adjustInventory = useCallback(async (material, qty, type, reason) => {
    if (!material || qty <= 0) { notify('Enter valid data.', 'danger'); return; }
    const delta = type === 'Add' ? qty : -qty;
    const product = products.find(p => p.id === material);
    if (!product) return;
    const newStock = Math.max(0, product.currentstock + delta);
    try {
      const { error } = await supabase.from('products').update({ currentstock: newStock }).eq('id', material);
      if (error) throw error;
      await logAction('products', material, 'UPDATE', product, { ...product, currentstock: newStock });
      fetchData();
      notify(`Inventory ${type}ed for ${material}.`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [products, logAction, fetchData, notify]);

  // ─── PURCHASE ORDER CRUD ──────────────────────────────────────
  const createPO = useCallback(async (poData) => {
    const { material, qty, supplier, expDate, unitCost, notes } = poData;
    if (!material || qty <= 0) { notify('Fill required fields.', 'danger'); return; }
    const po = {
      id: `PO-${Date.now()}`,
      material_id: material,
      quantity: qty,
      unit: getProductUnit(material),
      order_date: today(),
      expected_date: expDate,
      status: 'Open',
      supplier: supplier || 'TBD',
      unit_cost: +unitCost,
      notes,
    };
    try {
      const { error } = await supabase.from('purchase_orders').insert([po]);
      if (error) throw error;
      await logAction('purchase_orders', po.id, 'INSERT', null, po);
      fetchData();
      notify(`PO ${po.id} created.`, 'success');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [logAction, fetchData, notify]);

  const receivePO = useCallback(async (id) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;
    if (po.status === 'Received') { notify('PO already received.', 'info'); return; }
    const product = products.find(p => p.id === po.material_id);
    if (!product) return;
    const newStock = product.currentstock + po.quantity;
    try {
      const { error: updateErr } = await supabase.from('products').update({ currentstock: newStock }).eq('id', po.material_id);
      if (updateErr) throw updateErr;
      await logAction('products', po.material_id, 'UPDATE', product, { ...product, currentstock: newStock });
      const { error: poErr } = await supabase.from('purchase_orders').update({ status: 'Received' }).eq('id', id);
      if (poErr) throw poErr;
      await logAction('purchase_orders', id, 'UPDATE', po, { ...po, status: 'Received' });
      fetchData();
      notify(`PO ${id} received – inventory updated.`, 'success');
    } catch (err) {
      alert('Error receiving PO: ' + err.message);
    }
  }, [purchaseOrders, products, logAction, fetchData, notify]);

  // ─── BOM CRUD ──────────────────────────────────────────────────
  const addOrUpdateBOM = useCallback(async (parent, child, qty) => {
    if (!parent || !child || qty <= 0) { notify('Fill all fields.', 'danger'); return; }
    const existing = bom.find(b => b.parentid === parent && b.componentid === child);
    const payload = { parentid: parent, componentid: child, quantity: qty };
    try {
      if (existing) {
        const { error } = await supabase.from('bom').update(payload).match({ parentid: parent, componentid: child });
        if (error) throw error;
        await logAction('bom', `${parent}|${child}`, 'UPDATE', existing, payload);
        notify('BOM updated.');
      } else {
        const { error } = await supabase.from('bom').insert([payload]);
        if (error) throw error;
        await logAction('bom', `${parent}|${child}`, 'INSERT', null, payload);
        notify('BOM added.');
      }
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [bom, logAction, fetchData, notify]);

  const deleteBOM = useCallback(async (parent, child) => {
    const existing = bom.find(b => b.parentid === parent && b.componentid === child);
    if (!existing) return;
    try {
      const { error } = await supabase.from('bom').delete().match({ parentid: parent, componentid: child });
      if (error) throw error;
      await logAction('bom', `${parent}|${child}`, 'DELETE', existing, null);
      fetchData();
      notify('BOM entry deleted.', 'warning');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }, [bom, logAction, fetchData, notify]);

  const autoCreatePOs = useCallback(async () => {
    const needed = mrpData.filter(m => m.net > 0);
    if (needed.length === 0) { notify('No shortages.', 'info'); return; }
    const newPOs = [];
    for (const m of needed) {
      const existingPO = purchaseOrders.find(p => p.material_id === m.material && p.status === 'Open');
      if (existingPO) continue;
      newPOs.push({
        id: `PO-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        material_id: m.material,
        quantity: Math.ceil(m.net * 1.1),
        unit: m.unit,
        order_date: today(),
        expected_date: addDays(today(), m.leadTime),
        status: 'Open',
        supplier: 'TBD',
        unit_cost: 0,
        notes: 'Auto-generated by MRP',
      });
    }
    if (newPOs.length === 0) { notify('All shortages have open POs.', 'info'); return; }
    try {
      const { error } = await supabase.from('purchase_orders').insert(newPOs);
      if (error) throw error;
      for (const po of newPOs) await logAction('purchase_orders', po.id, 'INSERT', null, po);
      fetchData();
      notify(`${newPOs.length} PO(s) created.`, 'success');
    } catch (err) {
      alert('Error creating POs: ' + err.message);
    }
  }, [mrpData, purchaseOrders, logAction, fetchData, notify]);

  // ─── TABS ──────────────────────────────────────────────────────
  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'products', label: '📦 Products' },
    { id: 'mps', label: '📅 Master Prod. Schedule' },
    { id: 'production', label: '🏭 Work Orders' },
    { id: 'mrp', label: '📋 MRP Explosion' },
    { id: 'inventory', label: '📦 Inventory' },
    { id: 'procurement', label: '🛒 Procurement' },
    { id: 'bom', label: '🧾 BOM' },
    { id: 'alerts', label: '🚨 Alerts' },
    { id: 'history', label: '📜 History' },
  ];

  // ─── ISOLATED FORM COMPONENTS (memoized) ──────────────────────

  // Product Form (with category & unit)
  const ProductForm = memo(({ onAdd }) => {
    const [local, setLocal] = useState({
      name: '',
      leadTime: 1,
      lotSize: 1,
      currentStock: 0,
      safetyStock: 0,
      isRaw: false,
      category: 'ingredient',
      unit: 'g',
    });

    // Auto-set unit based on category when isRaw is true
    const handleCategoryChange = (cat) => {
      const unitMap = {
        ingredient: 'g',
        packaging: 'pcs',
        subassembly: 'kg',
      };
      setLocal({
        ...local,
        category: cat,
        unit: unitMap[cat] || 'g',
      });
    };

    const handleSubmit = useCallback(() => {
      onAdd(local);
      setLocal({ name: '', leadTime: 1, lotSize: 1, currentStock: 0, safetyStock: 0, isRaw: false, category: 'ingredient', unit: 'g' });
    }, [onAdd, local]);

    return (
      <Card title="Add New Product" accent="#dc2626">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
          <Input key="p-name" label="Name" value={local.name} onChange={v => setLocal({...local, name: v})} placeholder="e.g. Ghost Pepper Sauce" />
          <Input key="p-leadtime" label="Lead Time (days)" type="number" value={local.leadTime} onChange={v => setLocal({...local, leadTime: +v})} min={1} />
          <Input key="p-lotsize" label="Lot Size" type="number" value={local.lotSize} onChange={v => setLocal({...local, lotSize: +v})} min={1} />
          <Input key="p-stock" label="Starting Stock" type="number" value={local.currentStock} onChange={v => setLocal({...local, currentStock: +v})} min={0} />
          <Input key="p-safety" label="Safety Stock" type="number" value={local.safetyStock} onChange={v => setLocal({...local, safetyStock: +v})} min={0} />
          <Select label="Type" value={local.isRaw ? 'raw' : 'product'} onChange={v => setLocal({...local, isRaw: v === 'raw'})} options={['product', 'raw']} />
          {local.isRaw && (
            <Select
              label="Category"
              value={local.category}
              onChange={handleCategoryChange}
              options={[
                { value: 'ingredient', label: 'Ingredient (g)' },
                { value: 'packaging', label: 'Packaging (pcs)' },
                { value: 'subassembly', label: 'Sub‑assembly (kg)' },
              ]}
            />
          )}
          {local.isRaw && (
            <Input label="Unit" value={local.unit} onChange={() => {}} style={{ background: '#1a1a1a', cursor: 'default' }} />
          )}
        </div>
        <Btn onClick={handleSubmit}>＋ Add Product</Btn>
      </Card>
    );
  });

  // Inventory Form
  const InventoryForm = memo(({ products, onAdjust }) => {
    const [local, setLocal] = useState({
      material: '',
      qty: 0,
      type: 'Add',
      reason: '',
    });

    const productOpts = products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }));

    const handleSubmit = useCallback(() => {
      onAdjust(local.material, local.qty, local.type, local.reason);
      setLocal({ material: '', qty: 0, type: 'Add', reason: '' });
    }, [onAdjust, local]);

    return (
      <Card title="Inventory Adjustment" accent="#ea580c">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
          <Select label="Material" value={local.material} onChange={v => setLocal({...local, material: v})} options={productOpts} />
          <Select label="Type" value={local.type} onChange={v => setLocal({...local, type: v})} options={['Add','Deduct']} />
          <Input label={`Qty (${getProductUnit(local.material)})`} type="number" value={local.qty} onChange={v => setLocal({...local, qty: +v})} min={0} step={0.01} />
          <Input label="Reason" value={local.reason} onChange={v => setLocal({...local, reason: v})} placeholder="e.g. Spoilage, Receipt" />
        </div>
        <Btn onClick={handleSubmit} variant={local.type === 'Add' ? 'success' : 'warning'}>
          {local.type === 'Add' ? '＋ Add Stock' : '− Deduct Stock'}
        </Btn>
      </Card>
    );
  });

  // Procurement Form
  const ProcurementForm = memo(({ products, onCreate }) => {
    const [local, setLocal] = useState({
      material: '',
      qty: 0,
      supplier: '',
      expDate: addDays(today(), 5),
      unitCost: 0,
      notes: '',
    });

    const productOpts = products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }));

    const handleSubmit = useCallback(() => {
      onCreate(local);
      setLocal({ material: '', qty: 0, supplier: '', expDate: addDays(today(), 5), unitCost: 0, notes: '' });
    }, [onCreate, local]);

    return (
      <Card title="Create Purchase Order" accent="#7c3aed">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
          <Select label="Material" value={local.material} onChange={v => setLocal({...local, material: v})} options={productOpts} />
          <Input label={`Qty (${getProductUnit(local.material)})`} type="number" value={local.qty} onChange={v => setLocal({...local, qty: +v})} min={0} step={0.01} />
          <Input label="Supplier" value={local.supplier} onChange={v => setLocal({...local, supplier: v})} placeholder="Supplier name" />
          <Input label="Expected Date" type="date" value={local.expDate} onChange={v => setLocal({...local, expDate: v})} />
          <Input label="Unit Cost (₱)" type="number" value={local.unitCost} onChange={v => setLocal({...local, unitCost: +v})} min={0} step={0.01} />
          <Input label="Notes" value={local.notes} onChange={v => setLocal({...local, notes: v})} placeholder="Optional" />
        </div>
        <Btn onClick={handleSubmit}>＋ Create PO</Btn>
      </Card>
    );
  });

  // Work Order Form
  const WorkOrderForm = memo(({ products, onCreate }) => {
    const [local, setLocal] = useState({
      productId: products.length > 0 ? products.find(p => FINISHED_GOODS.some(fg => fg.id === p.id))?.id || '' : '',
      qty: 100,
      schedDate: addDays(today(), 2),
      shift: 'Morning',
      priority: 'Normal',
    });

    const productOpts = products.filter(p => FINISHED_GOODS.some(fg => fg.id === p.id)).map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }));

    const handleSubmit = useCallback(() => {
      onCreate(local);
      setLocal({ ...local, qty: 100 });
    }, [onCreate, local]);

    return (
      <Card title="Create Work Order" accent="#dc2626">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
          <Select label="Product" value={local.productId} onChange={v => setLocal({...local, productId: v})} options={productOpts} />
          <Input label="Qty (bottles)" type="number" value={local.qty} onChange={v => setLocal({...local, qty: +v})} min={1} />
          <Input label="Scheduled Date" type="date" value={local.schedDate} onChange={v => setLocal({...local, schedDate: v})} />
          <Select label="Shift" value={local.shift} onChange={v => setLocal({...local, shift: v})} options={['Morning', 'Afternoon', 'Night']} />
          <Select label="Priority" value={local.priority} onChange={v => setLocal({...local, priority: v})} options={['Low', 'Normal', 'High', 'Urgent']} />
        </div>
        <Btn onClick={handleSubmit}>＋ Add WO</Btn>
      </Card>
    );
  });

  // MPS Form
  const MpsForm = memo(({ products, weekStarts, onAdd }) => {
    const [local, setLocal] = useState({
      productId: products.length > 0 ? products.find(p => FINISHED_GOODS.some(fg => fg.id === p.id))?.id || '' : '',
      week: weekStarts.length > 0 ? weekStarts[0] : '',
      qty: 100,
    });

    const productOpts = products.filter(p => FINISHED_GOODS.some(fg => fg.id === p.id)).map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }));

    const handleSubmit = useCallback(() => {
      onAdd(local.productId, local.week, local.qty);
      setLocal({ ...local, qty: 100 });
    }, [onAdd, local]);

    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Select label="Product" value={local.productId} onChange={v => setLocal({...local, productId: v})} options={productOpts} />
        <Select label="Week Start" value={local.week} onChange={v => setLocal({...local, week: v})} options={weekStarts.map(w => ({ value: w, label: `${fmtDate(w)} – ${fmtDate(addDays(w,5))}` }))} />
        <Input label="Quantity (bottles)" type="number" value={local.qty} onChange={v => setLocal({...local, qty: +v})} min={1} />
        <Btn onClick={handleSubmit}>＋ Add / Update MPS</Btn>
      </div>
    );
  });

  // BOM Form (used in BOM tab)
  const BomForm = memo(({ products, parent, onSave }) => {
    const [local, setLocal] = useState({
      child: '',
      qty: 0,
    });

    const allProductOptions = products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }));

    const handleSubmit = useCallback(() => {
      if (!parent) {
        alert('Please select a parent product first.');
        return;
      }
      if (!local.child || local.qty <= 0) {
        alert('Please select a component and enter a valid quantity.');
        return;
      }
      onSave(parent, local.child, local.qty);
      setLocal({ child: '', qty: 0 });
    }, [parent, local, onSave]);

    return (
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: 16, border: '1px solid #4b5563' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>✏️ Add / Update Component</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Select
            label="Component"
            value={local.child}
            onChange={v => setLocal({...local, child: v})}
            options={allProductOptions}
          />
          <Input
            label="Qty per unit"
            type="number"
            value={local.qty}
            onChange={v => setLocal({...local, qty: +v})}
            min={0}
            step={0.001}
          />
          <Btn onClick={handleSubmit} variant="warning">Save to BOM</Btn>
        </div>
      </div>
    );
  });

  // ─── RENDER FUNCTIONS ─────────────────────────────────────────

  // ── DASHBOARD ──────────────────────────────────────────────────
  function Dashboard() {
    const active = workOrders.filter(o => o.status === 'In Progress').length;
    const pending = workOrders.filter(o => o.status === 'Pending').length;
    const done = workOrders.filter(o => o.status === 'Completed').length;
    const openPO = purchaseOrders.filter(p => p.status === 'Open').length;
    const critMat = mrpData.filter(m => m.status === 'Critical').length;
    const totalCups = workOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.quantity, 0);
    const mpsCups = mpsEntries.reduce((s, e) => s + e.quantity, 0);

    const kpis = [
      { icon: '🏭', label: 'Active WOs', value: active, color: '#ea580c' },
      { icon: '⏳', label: 'Pending WOs', value: pending, color: '#f59e0b' },
      { icon: '✅', label: 'Completed', value: done, color: '#22c55e' },
      { icon: '📦', label: 'Open POs', value: openPO, color: '#dc2626' },
      { icon: '🚨', label: 'Critical Mat.', value: critMat, color: '#dc2626' },
      { icon: '📅', label: 'MPS Planned', value: fmt(mpsCups), color: '#f97316' },
      { icon: '🌶️', label: 'WO Planned', value: fmt(totalCups), color: '#ea580c' },
    ];

    const flavorBreakdown = FINISHED_GOODS.map(fg => ({
      ...fg,
      qty: workOrders.filter(wo => wo.product_id === fg.id && wo.status !== 'Cancelled').reduce((s, o) => s + o.quantity, 0)
    })).filter(f => f.qty > 0).sort((a, b) => b.qty - a.qty);

    return <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {kpis.map(k => <KpiCard key={k.label} icon={k.icon} label={k.label} value={k.value} color={k.color} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Top Planned Products (WOs)" accent="#ea580c">
          {flavorBreakdown.length === 0 ? <p style={{ color: '#64748b', fontSize: 13 }}>No active work orders.</p> :
            flavorBreakdown.map(f => {
              const max = flavorBreakdown[0].qty || 1;
              return <div key={f.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{f.name}</span>
                  <span style={{ color: '#94a3b8' }}>{fmt(f.qty)} bottles</span>
                </div>
                <div style={{ background: '#2d2d2d', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${(f.qty / max) * 100}%`, background: '#ea580c', height: 6, borderRadius: 4 }} />
                </div>
              </div>;
            })
          }
        </Card>
        <Card title="Material Alert Status" accent="#dc2626">
          {alerts.lowStock.length === 0 ? <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>✅ All materials above reorder points.</p> :
            alerts.lowStock.map(p => {
              const rop = getProductReorderPoint(p.id);
              return <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2d2d2d' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.currentstock} {getProductUnit(p.id)} | ROP: {rop}</div>
                </div>
                <Badge type={p.currentstock <= p.safetystock ? 'danger' : 'warning'}>
                  {p.currentstock <= p.safetystock ? 'CRITICAL' : 'LOW'}
                </Badge>
              </div>;
            })
          }
        </Card>
      </div>
      <Card title="Recent Activity" accent="#7c3aed">
        {auditLogs.length === 0 ? <p style={{ color: '#64748b' }}>No activity yet.</p> :
          auditLogs.map(h => <div key={h.id} style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '1px solid #2d2d2d', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 10, color: '#64748b', minWidth: 140, paddingTop: 1 }}>{new Date(h.changed_at).toLocaleString()}</div>
            <div><span style={{ fontWeight: 600, fontSize: 12, color: '#f8fafc' }}>{h.action}</span><span style={{ fontSize: 12, color: '#94a3b8' }}> — {h.record_id}</span></div>
          </div>)
        }
      </Card>
    </div>;
  }

  // ── PRODUCTS TAB (with category & unit) ──────────────────────
  function ProductsTab() {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <ProductForm onAdd={addProduct} />
        <Card title="All Products" accent="#ea580c">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                <th style={{ padding: '10px 12px' }}>ID</th>
                <th style={{ padding: '10px 12px' }}>Name</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Unit</th>
                <th style={{ padding: '10px 12px' }}>Lead Time</th>
                <th style={{ padding: '10px 12px' }}>Lot Size</th>
                <th style={{ padding: '10px 12px' }}>Stock</th>
                <th style={{ padding: '10px 12px' }}>Safety</th>
                <th style={{ padding: '10px 12px' }}>Action</th>
              </tr></thead>
              <tbody>
                {products.map(p => {
                  const isEditing = editingProductId === p.id;
                  return <tr key={p.id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#dc2626' }}>{p.id}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? <input value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }} /> : p.name}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? (
                        <select value={editFormData.israw ? 'raw' : 'product'} onChange={e => setEditFormData({...editFormData, israw: e.target.value === 'raw'})} style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                          <option value="product">Product</option>
                          <option value="raw">Raw</option>
                        </select>
                      ) : (
                        <Badge type={p.israw ? 'warning' : 'info'}>{p.israw ? 'Raw' : 'Product'}</Badge>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? (
                        <select value={editFormData.category || 'ingredient'} onChange={e => {
                          const cat = e.target.value;
                          const unitMap = { ingredient: 'g', packaging: 'pcs', subassembly: 'kg' };
                          setEditFormData({...editFormData, category: cat, unit: unitMap[cat] || 'g'});
                        }} style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                          <option value="ingredient">Ingredient</option>
                          <option value="packaging">Packaging</option>
                          <option value="subassembly">Sub‑assembly</option>
                          <option value="finished">Finished</option>
                        </select>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>{p.category || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? <input value={editFormData.unit || ''} onChange={e => setEditFormData({...editFormData, unit: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4, width: 50 }} /> : p.unit}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? <input type="number" value={editFormData.leadtime || 0} onChange={e => setEditFormData({...editFormData, leadtime: +e.target.value})} style={{ width: 60, background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }} /> : p.leadtime}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? <input type="number" value={editFormData.lotsize || 0} onChange={e => setEditFormData({...editFormData, lotsize: +e.target.value})} style={{ width: 60, background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }} /> : p.lotsize}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: p.currentstock <= p.safetystock ? '#dc2626' : '#f8fafc' }}>
                      {isEditing ? <input type="number" value={editFormData.currentstock || 0} onChange={e => setEditFormData({...editFormData, currentstock: +e.target.value})} style={{ width: 80, background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }} /> : p.currentstock}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? <input type="number" value={editFormData.safetystock || 0} onChange={e => setEditFormData({...editFormData, safetystock: +e.target.value})} style={{ width: 60, background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4 }} /> : p.safetystock}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn size="sm" variant="success" onClick={() => saveEditProduct(p.id)}>Save</Btn>
                          <Btn size="sm" variant="ghost" onClick={cancelEditProduct}>Cancel</Btn>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn size="sm" variant="primary" onClick={() => startEditProduct(p)}>Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => deleteProduct(p.id)}>Delete</Btn>
                        </div>
                      )}
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ── MPS TAB ────────────────────────────────────────────────────
  function MPSTab() {
    const weekStarts = useMemo(() => {
      return Array.from({ length: HORIZON }, (_, i) => getMonday(addDays(today(), i * 7)));
    }, []);

    const weekTotals = useMemo(() => {
      const totals = {};
      weekStarts.forEach(w => totals[w] = 0);
      mpsEntries.forEach(e => {
        if (totals[e.week_start] !== undefined) {
          totals[e.week_start] += e.quantity;
        }
      });
      return totals;
    }, [mpsEntries, weekStarts]);

    const subTabs = [
      { id: 'schedule', label: '📅 Schedule Entry' },
      { id: 'capacity', label: '⚡ Capacity View' },
      { id: 'demand', label: '📈 Demand vs MPS' },
    ];

    function ScheduleView() {
      return (
        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Add / Update MPS Entry" accent="#f97316">
            <MpsForm products={products} weekStarts={weekStarts} onAdd={addMpsEntry} />
            <div style={{ marginTop: 12 }}>
              <Btn onClick={pushMpsToWorkOrders} variant="success">🚀 Push All MPS → Work Orders</Btn>
            </div>
          </Card>
          <Card title="MPS – 6-Week Plan" accent="#ea580c">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
                <thead><tr style={{ background: '#2d2d2d' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Product</th>
                  {weekStarts.map(w => <th key={w} style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {fmtDate(w)}<br/><span style={{ fontWeight: 400, fontSize: 10, color: '#94a3b8' }}>Cap: {fmt(WEEKLY_CAPACITY)}</span>
                  </th>)}
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Total</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {mpsEntries.length === 0 ? <tr><td colSpan={weekStarts.length+2} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No MPS entries yet.</td></tr> :
                    mpsEntries.map(e => {
                      const total = weekStarts.reduce((s, w) => s + (e.week_start === w ? e.quantity : 0), 0);
                      return <tr key={e.id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{getProductName(e.product_id)}</td>
                        {weekStarts.map(w => {
                          const val = e.week_start === w ? e.quantity : 0;
                          return <td key={w} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: val > 0 ? 700 : 400, color: val > 0 ? '#f8fafc' : '#4b5563' }}>
                            {val > 0 ? fmt(val) : '—'}
                          </td>;
                        })}
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>{fmt(total)}</td>
                        <td style={{ padding: '10px 8px' }}><Btn size="sm" variant="danger" onClick={() => deleteMpsEntry(e.id)}>✕</Btn></td>
                      </tr>;
                    })
                  }
                  <tr style={{ background: '#2d2d2d', fontWeight: 700 }}>
                    <td style={{ padding: '10px 12px', color: '#f8fafc' }}>Total Planned</td>
                    {weekStarts.map(w => {
                      const t = weekTotals[w] || 0;
                      const pct = (t / WEEKLY_CAPACITY) * 100;
                      return <td key={w} style={{ padding: '10px 8px', textAlign: 'center', color: pct > 100 ? '#dc2626' : pct > 80 ? '#f59e0b' : '#ea580c' }}>
                        <div>{fmt(t)}</div>
                        <CapBar pct={pct} color="#ea580c" />
                        <div style={{ fontSize: 9, marginTop: 2, color: '#94a3b8' }}>{pct.toFixed(0)}%</div>
                      </td>;
                    })}
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f8fafc' }}>{fmt(Object.values(weekTotals).reduce((s, v) => s + v, 0))}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      );
    }

    function CapacityView() {
      return (
        <Card title="Capacity Utilization — 6-Week View" accent="#7c3aed"
          subtitle={`Plant max: ${fmt(WEEKLY_CAPACITY)} bottles/week (${fmt(DAILY_CAPACITY)} bottles/day × 6 days)`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {weekStarts.map((w, i) => {
              const planned = weekTotals[w] || 0;
              const pct = (planned / WEEKLY_CAPACITY) * 100;
              const avail = Math.max(0, WEEKLY_CAPACITY - planned);
              const color = pct > 100 ? '#dc2626' : pct > 85 ? '#f59e0b' : pct > 60 ? '#ea580c' : '#22c55e';
              return <div key={w} style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, border: `2px solid ${color}44`, boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>WEEK {i+1}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>{fmtDate(w)} – {fmtDate(addDays(w,5))}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{pct.toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Utilized</div>
                <div style={{ background: '#2d2d2d', borderRadius: 6, height: 10, marginTop: 8, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, pct)}%`, background: color, height: 10, borderRadius: 6, transition: 'width .4s' }} />
                </div>
                <div style={{ fontSize: 11, display: 'grid', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Planned</span><span style={{ fontWeight: 700, color }}>{fmt(planned)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Available</span><span style={{ fontWeight: 600, color: '#22c55e' }}>{fmt(avail)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Capacity</span><span style={{ fontWeight: 600 }}>{fmt(WEEKLY_CAPACITY)}</span></div>
                </div>
                {pct > 100 && <div style={{ marginTop: 8, background: '#3b0a0a', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#dc2626', textAlign: 'center' }}>⚠ OVER CAPACITY</div>}
                {pct > 85 && pct <= 100 && <div style={{ marginTop: 8, background: '#3b2a0a', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}>⚡ Near full capacity</div>}
              </div>;
            })}
          </div>
        </Card>
      );
    }

    function DemandView() {
      const updateDemand = (productId, week, value) => {
        const numValue = +value;
        if (isNaN(numValue) || numValue < 0) return;

        setDemandRows(prev => prev.map(row => {
          if (row.productId === productId) {
            return { ...row, weeks: { ...row.weeks, [week]: numValue } };
          }
          return row;
        }));

        saveDemandForecast(productId, week, numValue);
      };

      const demandTotals = {};
      weekStarts.forEach(w => demandTotals[w] = 0);
      demandRows.forEach(row => {
        weekStarts.forEach(w => {
          demandTotals[w] += +(row.weeks[w] || 0);
        });
      });

      const gapTotals = {};
      weekStarts.forEach(w => gapTotals[w] = (weekTotals[w] || 0) - (demandTotals[w] || 0));

      if (!demandForecastLoaded) {
        return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading demand forecast...</div>;
      }

      return (
        <Card title="📈 Demand Forecast vs MPS Planned" accent="#22c55e"
          subtitle="Enter forecasted demand per flavor/week – saved automatically to the cloud">
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 130 }}>Flavor</th>
                {weekStarts.map((w, i) => <th key={w} style={{ padding: '10px 8px', textAlign: 'center', minWidth: 100 }}>
                  Wk {i+1}<br/><span style={{ fontWeight: 400, fontSize: 10, color: '#94a3b8' }}>{fmtDate(w)}</span>
                </th>)}
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Total</th>
              </tr></thead>
              <tbody>
                {demandRows.map(row => {
                  const total = weekStarts.reduce((s, w) => s + (+(row.weeks[w] || 0)), 0);
                  return <tr key={row.productId} style={{ borderBottom: '1px solid #2d2d2d' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f8fafc' }}>{getProductName(row.productId)}</td>
                    {weekStarts.map(w => {
                      const val = +(row.weeks[w] || 0);
                      return <td key={w} style={{ padding: '4px 6px' }}>
                        <input type="number" min={0} value={val} placeholder="0"
                          onChange={e => updateDemand(row.productId, w, e.target.value)}
                          style={{ width: '100%', padding: '5px 7px', borderRadius: 5, border: '1.5px solid #2d2d2d', fontSize: 12, textAlign: 'right', background: '#0a0a0a', color: '#f8fafc' }} />
                      </td>;
                    })}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>{fmt(total)}</td>
                  </tr>;
                })}
                <tr style={{ background: '#2d2d2d', fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px', color: '#22c55e' }}>Total Demand</td>
                  {weekStarts.map(w => <td key={w} style={{ padding: '10px 8px', textAlign: 'right', color: '#22c55e' }}>{fmt(demandTotals[w] || 0)}</td>)}
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#22c55e' }}>{fmt(Object.values(demandTotals).reduce((s, v) => s + v, 0))}</td>
                </tr>
                <tr style={{ background: '#2d2d2d', fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px', color: '#ea580c' }}>MPS Planned</td>
                  {weekStarts.map(w => <td key={w} style={{ padding: '10px 8px', textAlign: 'right', color: '#ea580c' }}>{fmt(weekTotals[w] || 0)}</td>)}
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ea580c' }}>{fmt(Object.values(weekTotals).reduce((s, v) => s + v, 0))}</td>
                </tr>
                <tr style={{ background: '#3b2a0a', fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px', color: '#f59e0b' }}>Gap (MPS − Demand)</td>
                  {weekStarts.map(w => {
                    const gap = gapTotals[w] || 0;
                    const color = gap < 0 ? '#dc2626' : gap > 0 ? '#22c55e' : '#94a3b8';
                    return <td key={w} style={{ padding: '10px 8px', textAlign: 'right', color, fontWeight: 700 }}>
                      {gap === 0 ? '✓' : gap > 0 ? `+${fmt(gap)}` : fmt(gap)}
                    </td>;
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {(() => {
                      const totalGap = Object.values(gapTotals).reduce((s, v) => s + v, 0);
                      return <span style={{ color: totalGap < 0 ? '#dc2626' : totalGap > 0 ? '#22c55e' : '#94a3b8' }}>
                        {totalGap > 0 ? '+' : ''}{fmt(totalGap)}
                      </span>;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, background: '#dc2626', borderRadius: 2, display: 'inline-block' }}/> 
              Negative gap = demand exceeds MPS (shortage risk)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2, display: 'inline-block' }}/> 
              Positive gap = MPS exceeds demand (buffer stock)
            </span>
          </div>
        </Card>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #2d2d2d', paddingBottom: 8 }}>
          {subTabs.map(st => (
            <button key={st.id} onClick={() => setMpsView(st.id)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid #2d2d2d', background: mpsView === st.id ? '#dc2626' : 'transparent', color: mpsView === st.id ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
              {st.label}
            </button>
          ))}
        </div>
        {mpsView === 'schedule' && <ScheduleView />}
        {mpsView === 'capacity' && <CapacityView />}
        {mpsView === 'demand' && <DemandView />}
      </div>
    );
  }

  // ── WORK ORDERS TAB ────────────────────────────────────────────
  function WorkOrdersTab() {
    const filtered = woFilter === 'All' ? workOrders : workOrders.filter(o => o.status === woFilter);

    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <WorkOrderForm products={products} onCreate={createWorkOrder} />
        <Card title="Work Orders" accent="#ea580c">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {['All','Pending','In Progress','Completed','Cancelled'].map(s => (
              <button key={s} onClick={() => setWoFilter(s)} style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #2d2d2d', background: woFilter === s ? '#dc2626' : 'transparent', color: woFilter === s ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                {s} ({s==='All' ? workOrders.length : workOrders.filter(o => o.status === s).length})
              </button>
            ))}
          </div>
          {filtered.length === 0 ? <p style={{ color: '#64748b' }}>No orders found.</p> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                <th style={{ padding: '10px 12px' }}>ID</th><th>Product</th><th>Qty</th><th>Sched Date</th><th>Shift</th><th>Priority</th><th>From MPS</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#dc2626' }}>{o.id}</td>
                    <td>{getProductName(o.product_id)}</td>
                    <td>{fmt(o.quantity)}</td>
                    <td>{o.scheduled_date}</td>
                    <td>{o.shift}</td>
                    <td><Badge type={o.priority === 'Urgent' ? 'danger' : o.priority === 'High' ? 'warning' : 'neutral'}>{o.priority}</Badge></td>
                    <td>{o.from_mps ? <Badge type="info">MPS</Badge> : '—'}</td>
                    <td><Badge type={o.status === 'Completed' ? 'success' : o.status === 'Pending' ? 'warning' : o.status === 'In Progress' ? 'info' : 'danger'}>{o.status}</Badge></td>
                    <td>
                      {o.status === 'Pending' && <Btn size="sm" variant="primary" onClick={() => updateWorkOrderStatus(o.id, 'In Progress')}>Start</Btn>}
                      {o.status === 'In Progress' && <Btn size="sm" variant="success" onClick={() => updateWorkOrderStatus(o.id, 'Completed')}>Done</Btn>}
                      {o.status !== 'Completed' && o.status !== 'Cancelled' && <Btn size="sm" variant="danger" onClick={() => updateWorkOrderStatus(o.id, 'Cancelled')}>Cancel</Btn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </Card>
      </div>
    );
  }

  // ── MRP TAB ──────────────────────────────────────────────────────
  function MRPTab() {
    const [filter, setFilter] = useState('All');
    const displayed = filter === 'All' ? mrpData : mrpData.filter(m => m.status === filter);

    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <Card title="MRP Explosion – Net Requirements" accent="#f97316">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            {['All','OK','Low','Critical'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #2d2d2d', background: filter === s ? '#dc2626' : 'transparent', color: filter === s ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                {s} ({s==='All' ? mrpData.length : mrpData.filter(m => m.status === s).length})
              </button>
            ))}
            <Btn onClick={autoCreatePOs} variant="success" style={{ marginLeft: 'auto' }}>⚡ Auto-Create POs</Btn>
          </div>
          {displayed.length === 0 ? <p style={{ color: '#64748b' }}>No requirements.</p> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                <th style={{ padding: '10px 12px' }}>Material</th><th>Unit</th><th>Gross Req.</th><th>On Hand</th><th>Safety Stock</th><th>Net Req.</th><th>Lead Time</th><th>Status</th>
              </tr></thead>
              <tbody>
                {displayed.map(m => (
                  <tr key={m.material} style={{ borderBottom: '1px solid #2d2d2d', background: m.status === 'Critical' ? '#3b0a0a' : m.status === 'Low' ? '#3b2a0a' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.name}</td>
                    <td>{m.unit}</td>
                    <td>{fmtNum(m.gross)}</td>
                    <td style={{ fontWeight: 700, color: m.onHand >= m.gross ? '#ea580c' : '#dc2626' }}>{fmtNum(m.onHand)}</td>
                    <td>{fmtNum(m.safetyStock)}</td>
                    <td style={{ fontWeight: 700, color: m.net > 0 ? '#dc2626' : '#ea580c' }}>{m.net > 0 ? fmtNum(m.net) : '—'}</td>
                    <td>{m.leadTime}d</td>
                    <td><Badge type={m.status === 'OK' ? 'success' : m.status === 'Low' ? 'warning' : 'danger'}>{m.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </Card>
      </div>
    );
  }

  // ── INVENTORY TAB ─────────────────────────────────────────────
  function InventoryTab() {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <InventoryForm products={products} onAdjust={adjustInventory} />
        <Card title="Inventory Ledger" accent="#dc2626">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                <th style={{ padding: '10px 12px' }}>ID</th><th>Name</th><th>Unit</th><th>On Hand</th><th>Safety Stock</th><th>Reorder Point</th><th>Status</th>
              </tr></thead>
              <tbody>
                {products.map(p => {
                  const rop = getProductReorderPoint(p.id);
                  const status = p.currentstock <= p.safetystock ? 'Critical' : p.currentstock <= rop ? 'Low' : 'OK';
                  const unit = getProductUnit(p.id);
                  return <tr key={p.id} style={{ borderBottom: '1px solid #2d2d2d', background: status === 'Critical' ? '#3b0a0a' : status === 'Low' ? '#3b2a0a' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{unit}</td>
                    <td style={{ fontWeight: 700, color: status === 'Critical' ? '#dc2626' : status === 'Low' ? '#f59e0b' : '#ea580c' }}>{p.currentstock}</td>
                    <td>{p.safetystock}</td>
                    <td>{rop}</td>
                    <td><Badge type={status === 'OK' ? 'success' : status === 'Low' ? 'warning' : 'danger'}>{status}</Badge></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

// ── PROCUREMENT TAB (with inline editing) ────────────────────────
function ProcurementTab() {
  const totalVal = purchaseOrders.filter(p => p.status === 'Open').reduce((s, p) => s + p.quantity * (p.unit_cost || 0), 0);

  // ── Local edit state ────────────────────────────────────────────
  const [editingPOId, setEditingPOId] = useState(null);
  const [editPOData, setEditPOData] = useState({
    supplier: '',
    unit_cost: 0,
    expected_date: '',
    notes: '',
  });

  const startEditPO = (po) => {
    setEditingPOId(po.id);
    setEditPOData({
      supplier: po.supplier || '',
      unit_cost: po.unit_cost || 0,
      expected_date: po.expected_date || '',
      notes: po.notes || '',
    });
  };

  const cancelEditPO = () => {
    setEditingPOId(null);
    setEditPOData({ supplier: '', unit_cost: 0, expected_date: '', notes: '' });
  };

  const saveEditPO = async (id) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          supplier: editPOData.supplier,
          unit_cost: editPOData.unit_cost,
          expected_date: editPOData.expected_date,
          notes: editPOData.notes,
        })
        .eq('id', id);
      if (error) throw error;
      await logAction('purchase_orders', id, 'UPDATE', null, editPOData);
      fetchData();
      setEditingPOId(null);
      setEditPOData({ supplier: '', unit_cost: 0, expected_date: '', notes: '' });
      notify('PO updated.', 'success');
    } catch (err) {
      alert('Error updating PO: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <ProcurementForm products={products} onCreate={createPO} />
      <Card title={`Purchase Orders  |  Open PO Value: ₱${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} accent="#ea580c">
        {purchaseOrders.length === 0 ? (
          <p style={{ color: '#64748b' }}>No POs yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
              <thead>
                <tr style={{ background: '#2d2d2d' }}>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>PO ID</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>Material</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#94a3b8' }}>Qty</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>Unit</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>Supplier</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>Expected</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#94a3b8' }}>Value (₱)</th>
                  <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>Status</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...purchaseOrders].reverse().map(p => {
                  const isEditing = editingPOId === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#dc2626' }}>{p.id}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{getProductName(p.material_id)}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>{p.quantity}</td>
                      <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{getProductUnit(p.material_id)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        {isEditing ? (
                          <input
                            value={editPOData.supplier}
                            onChange={e => setEditPOData({...editPOData, supplier: e.target.value})}
                            style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4, width: '100%' }}
                            placeholder="Supplier"
                          />
                        ) : (
                          p.supplier
                        )}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editPOData.expected_date}
                            onChange={e => setEditPOData({...editPOData, expected_date: e.target.value})}
                            style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4, width: '100%' }}
                          />
                        ) : (
                          p.expected_date
                        )}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editPOData.unit_cost}
                            onChange={e => setEditPOData({...editPOData, unit_cost: +e.target.value})}
                            style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', color: '#f8fafc', padding: '4px 8px', borderRadius: 4, width: 80, textAlign: 'right' }}
                          />
                        ) : (
                          `₱${(p.quantity * (p.unit_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <Badge type={p.status === 'Received' ? 'success' : 'info'}>{p.status}</Badge>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <Btn size="sm" variant="success" onClick={() => saveEditPO(p.id)}>Save</Btn>
                            <Btn size="sm" variant="ghost" onClick={cancelEditPO}>Cancel</Btn>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            {p.status === 'Open' && (
                              <Btn size="sm" variant="success" onClick={() => receivePO(p.id)}>✓ Receive</Btn>
                            )}
                            <Btn size="sm" variant="primary" onClick={() => startEditPO(p)}>✏️ Edit</Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

  // ── BOM TAB (with Enroll Mode) ────────────────────────────────
  function BOMTab() {
    const [mode, setMode] = useState('edit');
    const [editingRow, setEditingRow] = useState(null);
    const [editData, setEditData] = useState({ componentid: '', quantity: '' });
    const [search, setSearch] = useState('');
    const [newMaterial, setNewMaterial] = useState({ componentid: '', qty: 0 });

    // Enroll state
    const [newRecipe, setNewRecipe] = useState({ name: '', category: 'Standard', description: '' });
    const [ingredients, setIngredients] = useState([]);
    const [ingredientInput, setIngredientInput] = useState({ componentid: '', qty: 0 });

    if (products.length === 0) {
      return (
        <Card title="BOM Viewer & Editor" accent="#f59e0b">
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading products...</div>
        </Card>
      );
    }

    const validFinishedGoods = FINISHED_GOODS.filter(f => products.some(p => p.id === f.id));

    useEffect(() => {
      if (!bomParent && validFinishedGoods.length > 0) {
        setBomParent(validFinishedGoods[0].id);
      }
    }, [bomParent, validFinishedGoods]);

    const children = bom.filter(b => b.parentid === bomParent);
    const getMaterialCount = (productId) => bom.filter(b => b.parentid === productId).length;

    const filteredGoods = validFinishedGoods.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase())
    );

    // Edit row handlers
    const startEditRow = (child) => {
      setEditingRow(child.componentid);
      setEditData({ componentid: child.componentid, quantity: child.quantity });
    };
    const cancelEditRow = () => {
      setEditingRow(null);
      setEditData({ componentid: '', quantity: '' });
    };
    const saveEditRow = async (parentId, oldComponentId) => {
      const newComponentId = editData.componentid;
      const newQty = editData.quantity;
      if (!newComponentId || newQty <= 0) {
        alert('Please select a component and enter a valid quantity.');
        return;
      }
      if (oldComponentId !== newComponentId) {
        await deleteBOM(parentId, oldComponentId);
        await addOrUpdateBOM(parentId, newComponentId, newQty);
      } else {
        await addOrUpdateBOM(parentId, newComponentId, newQty);
      }
      setEditingRow(null);
      setEditData({ componentid: '', quantity: '' });
    };

    // Add material to existing BOM
    const handleAddMaterial = () => {
      if (!newMaterial.componentid || newMaterial.qty <= 0) {
        alert('Please select a component and enter a valid quantity.');
        return;
      }
      addOrUpdateBOM(bomParent, newMaterial.componentid, newMaterial.qty);
      setNewMaterial({ componentid: '', qty: 0 });
    };

    // Enroll new recipe
    const handleAddIngredient = () => {
      if (!ingredientInput.componentid || ingredientInput.qty <= 0) {
        alert('Please select a component and enter a valid quantity.');
        return;
      }
      if (ingredients.some(r => r.componentid === ingredientInput.componentid)) {
        alert('Ingredient already added. Edit the quantity in the table.');
        return;
      }
      const comp = products.find(p => p.id === ingredientInput.componentid);
      setIngredients([
        ...ingredients,
        {
          componentid: ingredientInput.componentid,
          name: comp ? comp.name : ingredientInput.componentid,
          unit: getProductUnit(ingredientInput.componentid),
          qty: ingredientInput.qty,
        },
      ]);
      setIngredientInput({ componentid: '', qty: 0 });
    };

    const removeIngredient = (componentid) => {
      setIngredients(ingredients.filter(r => r.componentid !== componentid));
    };

    const updateIngredientQty = (componentid, qty) => {
      setIngredients(ingredients.map(r =>
        r.componentid === componentid ? { ...r, qty: +qty } : r
      ));
    };

    const handleEnroll = async () => {
      if (!newRecipe.name.trim()) {
        alert('Please enter a recipe name.');
        return;
      }
      if (ingredients.length === 0) {
        alert('Please add at least one ingredient.');
        return;
      }

      const existingProducts = products.filter(p => !p.israw);
      const nextNum = existingProducts.length + 1;
      const fgId = `FG-${String(nextNum).padStart(3, '0')}`;

      const dbProduct = {
        id: fgId,
        name: newRecipe.name.trim(),
        leadtime: 1,
        lotsize: 1,
        currentstock: 0,
        safetystock: 0,
        israw: false,
        category: 'finished',
        unit: 'unit',
      };

      try {
        const { error: pErr } = await supabase.from('products').insert([dbProduct]);
        if (pErr) throw pErr;
        await logAction('products', fgId, 'INSERT', null, dbProduct);

        const bomRows = ingredients.map(r => ({
          parentid: fgId,
          componentid: r.componentid,
          quantity: r.qty,
        }));
        const { error: bErr } = await supabase.from('bom').insert(bomRows);
        if (bErr) throw bErr;
        for (const row of bomRows) {
          await logAction('bom', `${fgId}|${row.componentid}`, 'INSERT', null, row);
        }

        fetchData();
        notify(`✅ "${newRecipe.name.trim()}" enrolled as ${fgId}!`, 'success');

        setNewRecipe({ name: '', category: 'Standard', description: '' });
        setIngredients([]);
        setMode('edit');
        setBomParent(fgId);
      } catch (err) {
        alert('Error enrolling recipe: ' + err.message);
      }
    };

    // ─── RENDER MODE SWITCHER ────────────────────────────────────
    const renderModeSwitcher = () => (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={() => setMode('edit')}
          style={{
            padding: '8px 18px',
            borderRadius: 20,
            border: '2px solid',
            borderColor: mode === 'edit' ? '#f59e0b' : '#2d2d2d',
            background: mode === 'edit' ? '#f59e0b' : 'transparent',
            color: mode === 'edit' ? '#000' : '#94a3b8',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          📋 Edit Existing Recipe
        </button>
        <button
          onClick={() => setMode('enroll')}
          style={{
            padding: '8px 18px',
            borderRadius: 20,
            border: '2px solid',
            borderColor: mode === 'enroll' ? '#22c55e' : '#2d2d2d',
            background: mode === 'enroll' ? '#22c55e' : 'transparent',
            color: mode === 'enroll' ? '#000' : '#94a3b8',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          ➕ Enroll New Recipe
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
          {validFinishedGoods.length} recipe{validFinishedGoods.length !== 1 ? 's' : ''} registered
        </div>
      </div>
    );

    // ─── EDIT MODE ────────────────────────────────────────────────
    const renderEditMode = () => (
      <>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
          <Select
            label="Finished Good / Recipe"
            value={bomParent}
            onChange={v => setBomParent(v)}
            options={validFinishedGoods.map(f => ({ value: f.id, label: `${f.id} – ${f.name}` }))}
            style={{ minWidth: 220 }}
          />
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#f8fafc' }}>
            <thead><tr style={{ background: '#2d2d2d' }}>
              {['Material', 'Qty per unit', 'Unit', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {children.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No BOM entries.</td></tr>
              ) : (
                children.map(c => {
                  const isEditing = editingRow === c.componentid;
                  return (
                    <tr key={c.componentid} style={{ borderBottom: '1px solid #2d2d2d' }}>
                      {isEditing ? (
                        <>
                          <td style={{ padding: '8px 12px' }}>
                            <Select
                              value={editData.componentid}
                              onChange={v => setEditData({...editData, componentid: v})}
                              options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }))}
                            />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <Input
                              type="number"
                              value={editData.quantity}
                              onChange={v => setEditData({...editData, quantity: +v})}
                              min={0}
                              step={0.001}
                              style={{ width: 80, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                            {getProductUnit(c.componentid)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Btn size="sm" variant="success" onClick={() => saveEditRow(c.parentid, c.componentid)}>Save</Btn>
                            <Btn size="sm" variant="ghost" onClick={cancelEditRow} style={{ marginLeft: 6 }}>Cancel</Btn>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{getProductName(c.componentid)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{c.quantity}</td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{getProductUnit(c.componentid)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Btn size="sm" variant="primary" onClick={() => startEditRow(c)}>Edit</Btn>
                            <Btn size="sm" variant="danger" onClick={() => deleteBOM(c.parentid, c.componentid)} style={{ marginLeft: 6 }}>Del</Btn>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add material */}
        <div style={{ background: '#2d2d2d', borderRadius: 8, padding: 16, border: '1px solid #4b5563' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>➕ Add Material — {getProductName(bomParent)}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Select
              label="Material"
              value={newMaterial.componentid}
              onChange={v => setNewMaterial({...newMaterial, componentid: v})}
              options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }))}
            />
            <Input
              label="Qty per unit"
              type="number"
              value={newMaterial.qty}
              onChange={v => setNewMaterial({...newMaterial, qty: +v})}
              min={0}
              step={0.001}
            />
            <Btn variant="warning" onClick={handleAddMaterial}>Save to BOM</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setNewMaterial({ componentid: '', qty: 0 })}>Clear</Btn>
          </div>
        </div>
      </>
    );

    // ─── ENROLL MODE ──────────────────────────────────────────────
    const renderEnrollMode = () => (
      <Card title="➕ Enroll New Hot Sauce Recipe" accent="#22c55e"
        subtitle="Register a new sauce as a finished good and define its ingredient BOM">

        <div style={{ background: '#0f2a1a', borderRadius: 8, padding: 16, border: '1px solid #166534', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 12 }}>📝 Recipe Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Input label="Recipe / Product Name *" value={newRecipe.name} onChange={v => setNewRecipe({...newRecipe, name: v})} placeholder="e.g. Ghost Pepper X-Treme" />
            <Select label="Category" value={newRecipe.category} onChange={v => setNewRecipe({...newRecipe, category: v})} options={['Standard', 'Premium', 'Seasonal', 'Limited Edition', 'Extra Hot', 'Mild', 'Custom']} />
            <Input label="Description (optional)" value={newRecipe.description} onChange={v => setNewRecipe({...newRecipe, description: v})} placeholder="e.g. Smoky habanero blend" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>🧪 Ingredient List <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(quantities per batch)</span></p>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc', marginBottom: 12 }}>
              <thead><tr style={{ background: '#2d2d2d' }}>
                {['Component', 'Name', 'Qty per batch', 'Unit', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#94a3b8' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ingredients.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 12 }}>No ingredients yet.</td></tr>
                ) : (
                  ingredients.map((r, i) => (
                    <tr key={r.componentid} style={{ borderBottom: '1px solid #2d2d2d', background: i % 2 === 0 ? 'transparent' : '#1a1a1a' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{r.componentid}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={r.qty}
                          onChange={e => updateIngredientQty(r.componentid, e.target.value)}
                          style={{ width: 90, padding: '4px 7px', borderRadius: 5, border: '1.5px solid #2d2d2d', fontSize: 12, background: '#0a0a0a', color: '#f8fafc' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{r.unit}</td>
                      <td style={{ padding: '8px 8px' }}><Btn size="sm" variant="danger" onClick={() => removeIngredient(r.componentid)}>✕</Btn></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#0f1a0a', borderRadius: 8, padding: 14, border: '1px dashed #166534' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>➕ Add Ingredient from Material Master</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Select
                label="Component"
                value={ingredientInput.componentid}
                onChange={v => setIngredientInput({...ingredientInput, componentid: v})}
                options={[{ value: '', label: '— Select material —' }, ...products.map(p => ({ value: p.id, label: `${p.id} – ${p.name}` }))]}
                style={{ minWidth: 220 }}
              />
              <Input
                label="Qty per batch"
                type="number"
                value={ingredientInput.qty}
                onChange={v => setIngredientInput({...ingredientInput, qty: +v})}
                min={0}
                step={0.001}
                style={{ width: 120 }}
              />
              <Btn onClick={handleAddIngredient} variant="success" style={{ marginTop: 'auto' }}>➕ Add</Btn>
            </div>
          </div>
        </div>

        <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, border: '1px solid #2d2d2d' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>READY TO ENROLL</div>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 15 }}>{newRecipe.name || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>No name set</span>}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{newRecipe.category} · {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => { setMode('edit'); setNewRecipe({ name: '', category: 'Standard', description: '' }); setIngredients([]); }}>Cancel</Btn>
            <Btn variant="success" size="lg" onClick={handleEnroll} disabled={!newRecipe.name.trim() || ingredients.length === 0}>✅ Enroll Recipe</Btn>
          </div>
        </div>
      </Card>
    );

    // ─── MAIN RETURN ──────────────────────────────────────────────
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        {renderModeSwitcher()}
        {mode === 'edit' && renderEditMode()}
        {mode === 'enroll' && renderEnrollMode()}
      </div>
    );
  }

  // ── ALERTS TAB ─────────────────────────────────────────────────
  function AlertsTab() {
    const crit = mrpData.filter(m => m.status === 'Critical');
    const low = mrpData.filter(m => m.status === 'Low');
    const overdue = workOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled' && o.scheduled_date < today());
    const lowStock = alerts.lowStock;

    return <div style={{ display: 'grid', gap: 16 }}>
      {overdue.length > 0 && <Card title={`⚠️ Overdue Work Orders (${overdue.length})`} accent="#dc2626">
        {overdue.map(o => <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d2d' }}>
          <div><span style={{ fontWeight: 700, color: '#dc2626' }}>{o.id}</span> — {getProductName(o.product_id)} | {fmt(o.quantity)} bottles</div>
          <div style={{ fontSize: 12, color: '#dc2626' }}>Due: {o.scheduled_date}</div>
        </div>)}
      </Card>}
      {crit.length > 0 && <Card title={`🚨 Critical Shortages (${crit.length})`} accent="#dc2626">
        {crit.map(m => <div key={m.material} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d2d' }}>
          <div><div style={{ fontWeight: 700, color: '#f8fafc' }}>{m.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Need: {fmtNum(m.gross)} {m.unit} | Have: {fmtNum(m.onHand)} | Short: {fmtNum(m.net)}</div></div>
          <Badge type="danger">SHORT</Badge>
        </div>)}
      </Card>}
      {low.length > 0 && <Card title={`⚠️ Low Materials (${low.length})`} accent="#f59e0b">
        {low.map(m => <div key={m.material} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d2d' }}>
          <div><div style={{ fontWeight: 700, color: '#f8fafc' }}>{m.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Need: {fmtNum(m.gross)} | Have: {fmtNum(m.onHand)} {m.unit}</div></div>
          <Badge type="warning">LOW</Badge>
        </div>)}
      </Card>}
      {lowStock.length > 0 && <Card title={`📦 Below Reorder Point (${lowStock.length})`} accent="#f59e0b">
        {lowStock.map(p => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d2d2d' }}>
          <div><div style={{ fontWeight: 700, color: '#f8fafc' }}>{p.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>On hand: {p.currentstock} | SS: {p.safetystock} | ROP: {getProductReorderPoint(p.id)}</div></div>
          <Badge type={p.currentstock <= p.safetystock ? 'danger' : 'warning'}>{p.currentstock <= p.safetystock ? 'CRITICAL' : 'REORDER'}</Badge>
        </div>)}
      </Card>}
      {overdue.length === 0 && crit.length === 0 && low.length === 0 && lowStock.length === 0 &&
        <Card title="All Clear!" accent="#ea580c">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <div style={{ fontWeight: 700, color: '#ea580c', marginTop: 10, fontSize: 16 }}>No Alerts</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Operations running smoothly.</div>
          </div>
        </Card>
      }
    </div>;
  }

  // ── HISTORY TAB ────────────────────────────────────────────────
  function HistoryTab() {
    return <Card title="Activity Log" accent="#64748b">
      {auditLogs.length === 0 ? <p style={{ color: '#64748b' }}>No activity yet.</p> :
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#f8fafc' }}>
          <thead><tr style={{ background: '#2d2d2d' }}>
            <th style={{ padding: '10px 12px' }}>#</th><th>Timestamp</th><th>Action</th><th>Table</th><th>Record</th><th>Details</th>
          </tr></thead>
          <tbody>
            {auditLogs.map((h, i) => (
              <tr key={h.id} style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '10px 12px' }}>{i+1}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#94a3b8' }}>{new Date(h.changed_at).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#dc2626' }}>{h.action}</td>
                <td style={{ padding: '10px 12px' }}>{h.table_name}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>{h.record_id}</td>
                <td style={{ padding: '10px 12px' }}>
                  {h.old_data && h.new_data ? <details><summary style={{ color: '#f59e0b', cursor: 'pointer' }}>View diff</summary><pre style={{ fontSize: 10, background: '#0a0a0a', padding: 6, borderRadius: 4, color: '#f8fafc' }}>{JSON.stringify({ old: h.old_data, new: h.new_data }, null, 2)}</pre></details> :
                    h.old_data ? <details><summary style={{ color: '#dc2626', cursor: 'pointer' }}>Deleted</summary><pre style={{ fontSize: 10, background: '#0a0a0a', padding: 6, borderRadius: 4, color: '#f8fafc' }}>{JSON.stringify(h.old_data, null, 2)}</pre></details> :
                    h.new_data ? <details><summary style={{ color: '#ea580c', cursor: 'pointer' }}>Added</summary><pre style={{ fontSize: 10, background: '#0a0a0a', padding: 6, borderRadius: 4, color: '#f8fafc' }}>{JSON.stringify(h.new_data, null, 2)}</pre></details> :
                    '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </Card>;
  }

  // ─── MAIN RENDER ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#f8fafc' }}>
      {notif && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, background: notif.type === 'danger' ? '#dc2626' : notif.type === 'info' ? '#f97316' : notif.type === 'warning' ? '#f59e0b' : '#ea580c', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.5)', maxWidth: 360 }}>{notif.msg}</div>}

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 40%, #d97706 100%)', padding: '0 24px', boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>🌶️</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: .5 }}>CHILIPHILIC PPIC</div>
                <div style={{ color: '#fcd34d', fontSize: 11, fontWeight: 500, letterSpacing: .8 }}>HOT SAUCE MANUFACTURING — PPIC SUPERVISOR EDITION</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}><div style={{ color: '#fcd34d', fontSize: 10 }}>TODAY</div><div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{today()}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ color: '#fcd34d', fontSize: 10 }}>DAILY CAP</div><div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{fmt(DAILY_CAPACITY)} bottles</div></div>
              {alerts.criticalStock.length + alerts.overdueOrders.length > 0 && <div style={{ background: '#dc2626', color: '#fff', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>🚨 {alerts.criticalStock.length + alerts.overdueOrders.length} Alerts</div>}
            </div>
          </div>
          {/* TABS – black background, bigger font, active white */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '12px 20px',
                border: 'none',
                background: '#0a0a0a',
                color: activeTab === t.id ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: 16,
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: activeTab === t.id ? '3px solid #dc2626' : '3px solid transparent',
                transition: 'all .2s',
                opacity: activeTab === t.id ? 1 : 0.8,
                marginRight: '2px',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 20px' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'mps' && <MPSTab />}
        {activeTab === 'production' && <WorkOrdersTab />}
        {activeTab === 'mrp' && <MRPTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'procurement' && <ProcurementTab />}
        {activeTab === 'bom' && <BOMTab />}
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.65} }
        input:focus, select:focus { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,.15); }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
      `}</style>
    </div>
  );
}