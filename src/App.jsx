import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronDown, 
  Plus, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  TrendingUp,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  X,
  Menu,
  AlertCircle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';

// --- INITIAL MOCK DATA ---
const initialData = {
  accounts: [
    { id: '1', name: 'Main Checking', balance: 5200, type: 'Senior' },
    { id: '2', name: 'Emergency Savings', balance: 10000, type: 'Middle' }
  ],
  transactions: [
    { id: 't1', type: 'expense', amount: 4500, category: 'Food', date: new Date().toISOString().split('T')[0], note: 'Groceries at Supermarket' },
    { id: 't2', type: 'expense', amount: 1200, category: 'Utilities', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], note: 'Electric Bill' },
    { id: 't3', type: 'expense', amount: 3500, category: 'Transport', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], note: 'Fuel' },
    { id: 't4', type: 'income', amount: 85000, category: 'Salary', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], note: 'Monthly Pay' }
  ],
  loans: [
    { id: 'l1', name: 'Car Loan', principal: 1500000, remaining: 1250000, interest: 8.5, emi: 25000, lastUpdateDate: new Date().toISOString().split('T')[0] },
    { id: 'l2', name: 'Student Loan', principal: 500000, remaining: 150000, interest: 5.0, emi: 10000, lastUpdateDate: new Date().toISOString().split('T')[0] }
  ],
  investments: [
    { id: 'i1', name: 'S&P 500 Index', invested: 500000, current: 580000 },
    { id: 'i2', name: 'Fixed Deposit', invested: 200000, current: 210000 }
  ],
  settings: {
    gasUrl: 'https://script.google.com/macros/s/AKfycbylrkrGSUqpLQ0Va9yBEDlpWRBgin2d6pTPpopk1MRa6gynZQHMRoXFw8V5nk9E97rPaA/exec' 
  }
};

// --- CUSTOM UI COMPONENTS ---

const PillBadge = ({ children, variant = 'gray' }) => {
  const variants = {
    gray: 'bg-[#e2e5eb] text-slate-600',
    dark: 'bg-[#1a1d27] text-white',
    orange: 'bg-[#ef5133] text-white',
    blue: 'bg-[#6a95ea] text-white',
    outline: 'border border-slate-200 text-slate-600 bg-white'
  };
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Custom Multi-segment Donut Chart
const MultiDonut = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1; // prevent div by 0
  let currentAngle = 0;
  
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-sm">
        {/* Background track */}
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f0f2f5" strokeWidth="12" />
        
        {data.map((item, i) => {
          if (item.value === 0) return null;
          const percentage = item.value / total;
          const strokeDasharray = `${percentage * 251.2} 251.2`; // 2 * pi * r (r=40) = ~251.2
          const strokeDashoffset = -currentAngle * 251.2;
          currentAngle += percentage;
          
          return (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="transparent"
              stroke={item.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
        <span className="font-bold text-[#1a1d27]">₹{(total).toLocaleString()}</span>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appData, setAppData] = useState(initialData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); 
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (appData.settings.gasUrl) {
      handleSync();
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    if (!appData.settings.gasUrl) return showToast('Please configure Google Script URL in Settings', 'error');
    setSyncStatus('syncing');
    
    try {
      const response = await fetch(appData.settings.gasUrl, {
        method: 'POST',
        body: JSON.stringify(appData),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      setSyncStatus('success');
      showToast('Synced with Google Sheets!');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error("Sync error:", err);
      setSyncStatus('error');
      showToast('Sync failed. Check settings or console.', 'error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const updateData = (key, newData) => setAppData(prev => ({ ...prev, [key]: newData }));

  // Derived Metrics & Chart Data
  const metrics = useMemo(() => {
    const totalCash = appData.accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalInvestments = appData.investments.reduce((sum, i) => sum + Number(i.current), 0);
    const totalLoans = appData.loans.reduce((sum, l) => sum + Number(l.remaining), 0);
    const netWorth = (totalCash + totalInvestments) - totalLoans;

    // Expenses by Category
    const expTotals = appData.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});
    
    const categories = Object.entries(expTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const totalExpenses = categories.reduce((sum, c) => sum + c.value, 0);

    const netCashflow = appData.transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    }, 0);

    // Weekly data for Lollipop chart
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weeklyData = days.map((day, idx) => {
      const isToday = idx === new Date().getDay();
      return { day, value: Math.floor(Math.random() * 5000) + 1000, active: isToday };
    });

    return { totalCash, totalInvestments, totalLoans, netWorth, categories, totalExpenses, weeklyData, netCashflow };
  }, [appData]);

  // --- VIEWS ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Overview Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d27] mb-1">Financial Overview</h1>
          <p className="text-sm font-medium text-slate-500">Your complete monetary infographic.</p>
        </div>
        <button 
          onClick={handleSync} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-semibold hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin text-blue-500' : ''} />
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1d27] rounded-[2rem] p-6 shadow-md text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ">Net Worth</p>
          <h2 className="text-4xl font-bold mb-4" text-color='red;'>₹{metrics.netWorth.toLocaleString()}</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold">
            <TrendingUp size={14} className="text-[#6a95ea]" /> Overall Health
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Assets</p>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#6a95ea]"><Wallet size={16} /></div>
          </div>
          <h2 className="text-3xl font-bold text-[#1a1d27] mb-2">₹{(metrics.totalCash + metrics.totalInvestments).toLocaleString()}</h2>
          <p className="text-xs text-slate-500 font-medium">Cash + Investments</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Liabilities</p>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#ef5133]"><Activity size={16} /></div>
          </div>
          <h2 className="text-3xl font-bold text-[#1a1d27] mb-2">₹{metrics.totalLoans.toLocaleString()}</h2>
          <p className="text-xs text-slate-500 font-medium">Total Active Debt</p>
        </div>
      </div>

      {/* Main Infographic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Asset Allocation (Donut Chart) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600"><PieChart size={20} /></div>
            <h3 className="text-xl font-bold text-[#1a1d27]">Asset Allocation</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
            <div className="w-1/2 flex justify-center">
              <MultiDonut data={[
                { label: 'Cash', value: metrics.totalCash, color: '#6a95ea' },
                { label: 'Investments', value: metrics.totalInvestments, color: '#1a1d27' }
              ]} />
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-3 h-3 rounded-full bg-[#6a95ea]"></div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">Liquid Cash</p>
                  <p className="font-bold text-[#1a1d27]">₹{metrics.totalCash.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-3 h-3 rounded-full bg-[#1a1d27]"></div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">Investments</p>
                  <p className="font-bold text-[#1a1d27]">₹{metrics.totalInvestments.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Expense Categories (Horizontal Bars) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50">
           <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600"><BarChart3 size={20} /></div>
            <h3 className="text-xl font-bold text-[#1a1d27]">Expense Summary</h3>
          </div>

          <div className="space-y-5">
            {metrics.categories.length === 0 ? (
               <p className="text-slate-400 text-sm py-4">No expenses recorded yet.</p>
            ) : metrics.categories.slice(0, 4).map((cat, i) => {
              const pct = (cat.value / metrics.totalExpenses) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-[#1a1d27]">{cat.name}</span>
                    <span className="text-slate-500">₹{cat.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-[#ef5133]' : i===1 ? 'bg-[#1a1d27]' : i===2 ? 'bg-[#6a95ea]' : 'bg-slate-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Weekly Cashflow (Lollipop Chart) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 lg:col-span-1">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600"><CreditCard size={20} /></div>
              <h3 className="text-xl font-bold text-[#1a1d27]">Weekly Cashflow</h3>
            </div>
            <PillBadge variant="gray">Past 7 Days</PillBadge>
          </div>
          
          <div className="flex items-end justify-between h-48 w-full pt-6 relative">
            {metrics.weeklyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 relative h-full justify-end group">
                {d.active && (
                  <div className="absolute top-0 bottom-8 w-10 bg-slate-100 rounded-full -z-10" />
                )}
                <div className="relative flex flex-col items-center justify-end w-full" style={{ height: `${(d.value / 6000) * 100}%`, minHeight: '10%' }}>
                    <div className={`w-3 h-3 rounded-full z-10 ${d.active ? 'bg-[#5a8dee]' : 'bg-[#1a1d27]'}`} />
                    <div className={`w-[2px] flex-grow mt-1 ${d.active ? 'bg-[#5a8dee]/30' : 'bg-slate-200'}`} />
                </div>
                <div className={`mt-3 w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors ${d.active ? 'bg-[#1a1d27] text-white' : 'bg-transparent text-slate-500'}`}>
                  {d.day}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Loan / Debt Progress (Dual-tone Progress) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 lg:col-span-1">
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600"><PiggyBank size={20} /></div>
              <h3 className="text-xl font-bold text-[#1a1d27]">Debt Overview</h3>
            </div>
          </div>

          <div className="space-y-8">
            {appData.loans.length === 0 ? (
               <p className="text-slate-400 text-sm">No active loans.</p>
            ) : appData.loans.slice(0,3).map(loan => {
              const paid = loan.principal - loan.remaining;
              const pctPaid = (paid / loan.principal) * 100;
              return (
                <div key={loan.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h4 className="font-bold text-[#1a1d27] text-sm">{loan.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{loan.interest}% APR</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1a1d27]">₹{loan.remaining.toLocaleString()} <span className="text-slate-400 font-medium text-xs">left</span></p>
                    </div>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                     <div 
                        className="h-full bg-[#1a1d27] transition-all duration-1000"
                        style={{ width: `${pctPaid}%` }}
                     />
                     <div 
                        className="h-full bg-[#ef5133] transition-all duration-1000"
                        style={{ width: `${100 - pctPaid}%` }}
                     />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                     <span>Paid: ₹{paid.toLocaleString()}</span>
                     <span>Total: ₹{loan.principal.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-[#1a1d27] mb-8">Settings & Integrations</h2>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-[#f0f2f5] rounded-xl flex items-center justify-center text-[#1a1d27]">
            <RefreshCw size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1a1d27]">Google Sheets Sync</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md">Connect your app to a Google Sheets database to save your data permanently in the cloud.</p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Apps Script Web App URL</label>
            <input 
              type="text"
              value={appData.settings.gasUrl}
              onChange={(e) => updateData('settings', { ...appData.settings, gasUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full p-4 bg-[#f8f9fa] border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1a1d27] font-medium text-[#1a1d27] placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={handleSync} 
            className="flex items-center gap-2 px-6 py-3 bg-[#1a1d27] text-white rounded-full font-bold hover:bg-slate-800 transition-colors shadow-md w-full sm:w-auto justify-center"
          >
            <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            Test Connection & Sync Now
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50">
        <h3 className="text-xl font-bold text-[#1a1d27] mb-2">Data Management</h3>
        <p className="text-sm text-slate-500 mb-6">Clear all your session data and revert to the default template.</p>
        <button 
          onClick={() => setAppData(initialData)} 
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors"
        >
          <AlertCircle size={18} />
          Reset Session Data
        </button>
      </div>
    </div>
  );

  // Generic List Editor for CRUD tabs
  const GenericListEditor = ({ title, dataKey, columns, defaultItem, summaryLabel, summaryValue }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newItem, setNewItem] = useState(defaultItem);
    const items = appData[dataKey];

    const handleOpenForm = (item = null) => {
      if (item) {
        setEditingId(item.id);
        setNewItem(item);
      } else {
        setEditingId(null);
        setNewItem(defaultItem);
      }
      setIsFormOpen(true);
    };

    const handleCloseForm = () => {
      setIsFormOpen(false);
      setEditingId(null);
      setNewItem(defaultItem);
    };

    const handleSave = () => {
      if (editingId) {
        updateData(dataKey, items.map(i => i.id === editingId ? { ...newItem } : i));
      } else {
        updateData(dataKey, [...items, { ...newItem, id: Date.now().toString() }]);
      }
      handleCloseForm();
    };

    const handleDelete = (id) => updateData(dataKey, items.filter(item => item.id !== id));

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1d27] mb-4">{title}</h2>
            {summaryValue !== undefined && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{summaryLabel}</p>
                <h3 className="text-4xl sm:text-5xl font-bold text-[#1a1d27] tracking-tight">{summaryValue}</h3>
              </div>
            )}
          </div>
          <button 
            onClick={() => isFormOpen ? handleCloseForm() : handleOpenForm()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1d27] text-white rounded-full font-semibold hover:bg-slate-800 transition-colors shadow-md shrink-0 mt-2 sm:mt-0"
          >
            {isFormOpen ? <X size={18} /> : <Plus size={18} />}
            {isFormOpen ? 'Cancel' : 'Add New'}
          </button>
        </div>

        {isFormOpen && (
          <div className="bg-white rounded-[2rem] p-6 mb-8 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {columns.filter(col => col.editable !== false).map(col => (
                <div key={col.key}>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{col.label}</label>
                  {col.type === 'select' ? (
                    <select 
                      className="w-full p-3 bg-[#f8f9fa] border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1a1d27] font-medium text-slate-700"
                      value={newItem[col.key]}
                      onChange={e => setNewItem({...newItem, [col.key]: e.target.value})}
                    >
                      {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      type={col.type || 'text'}
                      className="w-full p-3 bg-[#f8f9fa] border-none rounded-xl outline-none focus:ring-2 focus:ring-[#1a1d27] font-medium text-slate-700"
                      placeholder={`Enter ${col.label.toLowerCase()}`}
                      value={newItem[col.key]}
                      onChange={e => setNewItem({...newItem, [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value})}
                    />
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-[#ef5133] text-white rounded-full font-bold hover:bg-[#d84428] transition-colors">
              <Save size={18} /> {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-medium">No records found. Add one above.</div>
          ) : items.map(item => (
            <div key={item.id} className="bg-white rounded-[1.5rem] p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm border border-slate-50 gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-4 w-full pr-4">
                {columns.map(col => (
                  <div key={col.key} className="min-w-[120px] flex-1">
                    <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{col.label}</div>
                    <div className="font-semibold text-[#1a1d27]">
                      {col.format ? col.format(item[col.key], item) : item[col.key]}
                      {col.key === 'type' && item[col.key] === 'expense' && <span className="ml-2 w-2 h-2 rounded-full bg-[#ef5133] inline-block"></span>}
                      {col.key === 'type' && item[col.key] === 'income' && <span className="ml-2 w-2 h-2 rounded-full bg-[#6a95ea] inline-block"></span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleOpenForm(item)} className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors shrink-0">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shrink-0">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'investments', label: 'Investments' },
    { id: 'loans', label: 'Loans' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f5f8] font-sans selection:bg-[#ef5133] selection:text-white pb-20 md:pb-10 relative">
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-lg font-bold text-sm text-white ${toast.type === 'error' ? 'bg-[#ef5133]' : 'bg-[#1a1d27]'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-[#6a95ea]" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Redesigned Minimalist Top Navigation */}
      <nav className="pt-6 pb-8 sticky top-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        
        {/* Mobile Hamburger */}
        <button className="md:hidden p-3 bg-white rounded-full shadow-sm text-[#1a1d27] absolute left-4 pointer-events-auto" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu size={20} />
        </button>

        {/* Floating Pill Menu (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-white p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 pointer-events-auto backdrop-blur-xl bg-white/90">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-[13px] font-bold px-5 py-2.5 rounded-full transition-all duration-300 ${activeTab === item.id ? 'bg-[#1a1d27] text-white shadow-md' : 'text-slate-500 hover:text-[#1a1d27] hover:bg-slate-50'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white mx-4 rounded-3xl p-3 shadow-2xl border border-slate-100 fixed left-0 right-0 z-40 top-20 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`p-3.5 rounded-2xl text-left font-bold text-sm ${activeTab === item.id ? 'bg-[#1a1d27] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="px-4 md:px-8">
        
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'settings' && renderSettings()}
        
        {activeTab === 'transactions' && <GenericListEditor 
          title="Transactions History" dataKey="transactions"
          summaryLabel="Net Cashflow"
          summaryValue={metrics.netCashflow < 0 ? `-₹${Math.abs(metrics.netCashflow).toLocaleString()}` : `₹${metrics.netCashflow.toLocaleString()}`}
          defaultItem={{ type: 'expense', amount: 0, category: '', date: new Date().toISOString().split('T')[0] }}
          columns={[
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'type', label: 'Type', type: 'select', options: ['expense', 'income'] },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount', type: 'number', format: v => `₹${v.toLocaleString()}` }
          ]}
        />}

        {activeTab === 'accounts' && <GenericListEditor 
          title="Bank Accounts" dataKey="accounts"
          summaryLabel="Total Balance"
          summaryValue={`₹${metrics.totalCash.toLocaleString()}`}
          defaultItem={{ name: '', balance: 0, type: 'Standard' }}
          columns={[
            { key: 'name', label: 'Account Name' },
            { key: 'type', label: 'Account Tier' },
            { key: 'balance', label: 'Current Balance', type: 'number', format: v => `₹${v.toLocaleString()}` }
          ]}
        />}

        {activeTab === 'investments' && <GenericListEditor 
          title="Investment Portfolio" dataKey="investments"
          summaryLabel="Total Current Value"
          summaryValue={`₹${metrics.totalInvestments.toLocaleString()}`}
          defaultItem={{ name: '', invested: 0, current: 0 }}
          columns={[
            { key: 'name', label: 'Asset Name' },
            { key: 'invested', label: 'Invested', type: 'number', format: v => `₹${v.toLocaleString()}` },
            { key: 'current', label: 'Current Value', type: 'number', format: v => `₹${v.toLocaleString()}` },
            { key: 'return', label: 'Return', editable: false, format: (_, item) => {
               const val = (((item?.current || 0) - (item?.invested || 0)) / (item?.invested || 1) * 100).toFixed(1);
               return <span className={val >= 0 ? 'text-[#6a95ea]' : 'text-[#ef5133]'}>{val}%</span>;
            }}
          ]}
        />}

        {activeTab === 'loans' && <GenericListEditor 
          title="Loans & Debt" dataKey="loans"
          summaryLabel="Total Remaining Debt"
          summaryValue={`₹${metrics.totalLoans.toLocaleString()}`}
          defaultItem={{ name: '', principal: 0, remaining: 0, interest: 0, emi: 0, lastUpdateDate: new Date().toISOString().split('T')[0] }}
          columns={[
            { key: 'name', label: 'Loan Name' },
            { key: 'principal', label: 'Principal', type: 'number', format: v => `₹${v.toLocaleString()}` },
            { key: 'remaining', label: 'Remaining', type: 'number', format: v => `₹${v.toLocaleString()}` },
            { key: 'interest', label: 'Interest (%)', type: 'number', format: v => `${v}%` },
            { key: 'emi', label: 'Monthly EMI', type: 'number', format: v => `₹${v.toLocaleString()}` },
            { key: 'remainingMonths', label: 'Est. Left', editable: false, format: (_, item) => item.emi > 0 ? Math.ceil(item.remaining / item.emi) + ' mos' : 'N/A' }
          ]}
        />}

      </main>
    </div>
  );
}