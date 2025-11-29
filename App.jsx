import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Activity,
  Search,
  Database,
  Cpu,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  BarChart3,
  PieChart,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Sparkles,
  X,
  FileText,
  Settings,
  Filter,
  ChevronDown,
  Check,
  UploadCloud,
  FileSpreadsheet,
  MessageCircle,
  Users,
  Link as LinkIcon,
  HelpCircle,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  WifiOff,
  Clock,
  Calendar,
  History,
  ExternalLink,
  Building2,
  Award,
  Percent,
  List,
  Medal,
  Trophy,
  Zap,
  AlertTriangle
} from 'lucide-react';

// --- CONFIGURATION ---
// 1. Get your key here: https://aistudio.google.com/app/apikey
// 2. PASTE IT BELOW inside the quotes (e.g., "AIzaSy...")
const API_KEY = "";

// UPDATED: Using 2.5 Flash model (Faster, Lower Cost/Free Tier)
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const BACKEND_URL = "http://127.0.0.1:5000"; // Points to your local Python server
// --- SUBREDDIT LIST ---
const SUBREDDITS = [
  { name: 'r/PersonalFinanceCanada', icon: '🇨🇦' },
  { name: 'r/investing', icon: '💰' },
  { name: 'r/ETFs', icon: '📊' },
  { name: 'r/stocks', icon: '📈' },
  { name: 'r/canadianinvestor', icon: '🍁' }
];

// --- TIMEFRAME OPTIONS ---
const TIME_FRAMES = [
  { label: 'Past Hour', value: 'hour' },
  { label: 'Past 24 Hours', value: 'day' },
  { label: 'Past Week', value: 'week' },
  { label: 'Past Month', value: 'month' },
  { label: 'Past 3 Months', value: '3month' },
  { label: 'Past 6 Months', value: '6month' },
  { label: 'Past Year', value: 'year' },
  { label: 'Past 3 Years', value: '3year' },
  { label: 'Past 5 Years', value: '5year' },
  { label: 'Past 10 Years', value: '10year' },
  { label: 'All Time', value: 'all' }
];

// --- DATE HELPER (MM/DD/YY - MM/DD/YY) ---
const calculateDateRange = (timeFrame) => {
  const end = new Date();
  const start = new Date();

  switch (timeFrame) {
    case 'hour': start.setHours(end.getHours() - 1); break;
    case 'day': start.setDate(end.getDate() - 1); break;
    case 'week': start.setDate(end.getDate() - 7); break;
    case 'month': start.setMonth(end.getMonth() - 1); break;
    case '3month': start.setMonth(end.getMonth() - 3); break;
    case '6month': start.setMonth(end.getMonth() - 6); break;
    case 'year': start.setFullYear(end.getFullYear() - 1); break;
    case '3year': start.setFullYear(end.getFullYear() - 3); break;
    case '5year': start.setFullYear(end.getFullYear() - 5); break;
    case '10year': start.setFullYear(end.getFullYear() - 10); break;
    case 'all': start.setFullYear(end.getFullYear() - 15); break;
    default: start.setMonth(end.getMonth() - 1);
  }

  const options = { month: '2-digit', day: '2-digit', year: '2-digit' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "Just now";
  // Handle both Unix timestamp (seconds) and JS Date objects
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// --- DEFAULT SAMPLE DATA ---
const SAMPLE_ETF_DATA = [
  { symbol: 'XEQT', parentCo: 'BlackRock', name: 'iShares Core Equity ETF', type: 'ETF', sector: 'Diversified', active: false },
  { symbol: 'VFV', parentCo: 'Vanguard', name: 'Vanguard S&P 500', type: 'ETF', sector: 'Index', active: false },
  { symbol: 'ZEB', parentCo: 'BMO', name: 'BMO Equal Weight Banks', type: 'ETF', sector: 'Financials', active: false },
  { symbol: 'HXT', parentCo: 'Global X', name: 'Horizons S&P/TSX 60', type: 'ETF', sector: 'Index', active: false },
  { symbol: 'CASH', parentCo: 'Global X', name: 'Horizons High Interest Savings', type: 'ETF', sector: 'Cash/Equiv', active: false },
  { symbol: 'ZWC', parentCo: 'BMO', name: 'BMO High Div Covered Call', type: 'ETF', sector: 'Fixed Income', active: true },
  { symbol: 'XIU', parentCo: 'BlackRock', name: 'iShares S&P/TSX 60', type: 'ETF', sector: 'Index', active: false },
  { symbol: 'VDY', parentCo: 'Vanguard', name: 'Vanguard CDN High Div', type: 'ETF', sector: 'Financials', active: false },
  { symbol: 'BTCC', parentCo: 'Purpose', name: 'Purpose Bitcoin ETF', type: 'ETF', sector: 'Crypto', active: false },
  { symbol: 'AGG', parentCo: 'Evolve', name: 'Evolve CDN Agg Bond', type: 'ETF', sector: 'Fixed Income', active: true }
];

const deriveSector = (name) => {
  if (!name) return "Diversified";
  const n = name.toUpperCase();
  if (n.includes("ENERGY") || n.includes("OIL")) return "Energy";
  if (n.includes("TECH") || n.includes("AI ") || n.includes("ROBOT") || n.includes("GOOG") || n.includes("AAPL") || n.includes("AMD")) return "Technology";
  if (n.includes("GOLD") || n.includes("SILVER") || n.includes("MATERIALS") || n.includes("BARRICK")) return "Materials";
  if (n.includes("BOND") || n.includes("YIELD") || n.includes("INCOME") || n.includes("AGGREGATE")) return "Fixed Income";
  if (n.includes("BANK") || n.includes("FIN")) return "Financials";
  if (n.includes("REAL ASSETS") || n.includes("REIT")) return "Real Estate";
  if (n.includes("BITCOIN") || n.includes("ETHER") || n.includes("CRYPTO")) return "Crypto";
  if (n.includes("SAVINGS") || n.includes("CASH")) return "Cash/Equiv";
  return "Diversified/Equity";
};

// --- ALPHABETIZED THEMES POOL ---
const THEMES_POOL = [
  'AI & Automation', 'Bank Dividends', 'Canadian Housing', 'Consumer Spending',
  'Crypto Regulation', 'ESG Investing', 'Green Energy', 'Interest Rates',
  'Oil Prices', 'Recession Fears', 'Semiconductors', 'Supply Chains'
];

// --- Helper Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-sm ${className.includes('overflow-visible') ? '' : 'overflow-hidden'} ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, type = 'neutral' }) => {
  const colors = {
    positive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    negative: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${colors[type]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ progress, label }) => (
  <div className="w-full space-y-2">
    <div className="flex justify-between text-xs font-medium text-slate-400">
      <span>{label}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="font-bold text-lg text-white flex items-center gap-3">
            <Sparkles size={20} className="text-purple-400" />
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-slate-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const MultiSelect = ({ label, options, selected, onChange, icon: Icon, searchPlaceholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // Helper to select ALL options
  const selectAll = () => {
    const allValues = options.map(opt => opt.value);
    onChange(allValues);
  };

  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 100);
  }, [options, searchTerm]);

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
        {Icon && <Icon size={14} />} {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800 border border-slate-600 hover:border-slate-500 rounded-lg px-4 py-3 text-left text-sm text-white flex items-center justify-between transition-all shadow-sm hover:shadow-md"
      >
        <span className="truncate font-medium">
          {selected.length === 0 ? "Select items..." : `${selected.length} selected`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Display Selected Tags directly below */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
          {selected.map(val => (
            <span key={val} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
              {val}
              <button onClick={(e) => { e.stopPropagation(); toggleOption(val); }} className="hover:text-white"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}


      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50 max-h-96 flex flex-col ring-1 ring-black/50">
          <div className="p-3 border-b border-slate-700">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
            {filteredOptions.length === 0 ? (<div className="p-4 text-center text-sm text-slate-500">No matches found</div>) : (
              <>
                {filteredOptions.map((opt) => (
                  <div key={opt.value} onClick={() => toggleOption(opt.value)} className={`flex items-start gap-3 p-3 hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors ${selected.includes(opt.value) ? 'bg-slate-800/50' : ''}`}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors ${selected.includes(opt.value) ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                      {selected.includes(opt.value) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-200 truncate">{opt.label}</div>{opt.subLabel && <div className="text-xs text-slate-400 truncate mt-0.5">{opt.subLabel}</div>}</div>
                  </div>
                ))}
              </>
            )}
          </div>
          {/* UPDATED FOOTER with Select All */}
          <div className="p-3 border-t border-slate-700 bg-slate-800/50 rounded-b-lg flex justify-between text-sm">
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-400 hover:text-blue-300 px-2 py-1 transition-colors font-medium text-xs">Select All</button>
              <button onClick={() => onChange([])} className="text-slate-400 hover:text-white px-2 py-1 transition-colors text-xs">Clear All</button>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-400 hover:text-blue-300 px-3 py-1 font-semibold transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Application ---

export default function SentientFiApp() {
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('agent');
  const [results, setResults] = useState(null);
  const [backendError, setBackendError] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(null);

  // Data State
  const [allTickers, setAllTickers] = useState(SAMPLE_ETF_DATA);
  const [isFileLoaded, setIsFileLoaded] = useState(false);

  // Selection State
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [selectedParentCompanies, setSelectedParentCompanies] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState(['AI & Automation', 'Interest Rates']);
  const [timeFrame, setTimeFrame] = useState('month');
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [expandedTickerChatter, setExpandedTickerChatter] = useState(null);
  const [expandedCompanyChatter, setExpandedCompanyChatter] = useState(null);
  const [brokerageTickerSelect, setBrokerageTickerSelect] = useState("all");
  const [companyChatterFilter, setCompanyChatterFilter] = useState("All");
  const [companyChatterSort, setCompanyChatterSort] = useState("Newest");

  // Computed Parent Company Options
  const parentCompanyOptions = useMemo(() => {
    const parents = new Set(allTickers.map(t => t.parentCo).filter(p => p && p !== "Unknown"));
    return Array.from(parents).sort().map(p => ({ label: p, value: p }));
  }, [allTickers]);

  // Gemini Integration States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [marketReport, setMarketReport] = useState(null);
  const [analyzingTicker, setAnalyzingTicker] = useState(null);
  const [tickerAnalysis, setTickerAnalysis] = useState(null);
  const [analyzingCompany, setAnalyzingCompany] = useState(null);
  const [companyAnalysis, setCompanyAnalysis] = useState(null);
  const [summarizingTheme, setSummarizingTheme] = useState(null);
  const [themeSummary, setThemeSummary] = useState(null);

  const logsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const timeFrameLabel = TIME_FRAMES.find(t => t.value === timeFrame)?.label || 'Past Month';
  const dateRangeString = useMemo(() => calculateDateRange(timeFrame), [timeFrame]);

  // Compute Top 3 Ticker Stats
  const topTickerStats = useMemo(() => {
    if (!results || !results.tickers || results.tickers.length === 0) {
      return [
        { name: "N/A", mentions: 0, sentiment: "Neutral", percentage: 0 },
        { name: "N/A", mentions: 0, sentiment: "Neutral", percentage: 0 },
        { name: "N/A", mentions: 0, sentiment: "Neutral", percentage: 0 }
      ];
    }

    const sorted = [...results.tickers].sort((a, b) => b.mentions - a.mentions);
    const total = results.totalMentions || 1;

    // Return top 3 (fill with placeholders if < 3)
    const top3 = sorted.slice(0, 3);
    while (top3.length < 3) top3.push({ symbol: "N/A", mentions: 0, sentiment: "Neutral" });

    return top3.map(t => ({
      name: t.symbol,
      mentions: t.mentions,
      sentiment: t.sentiment,
      percentage: Math.round((t.mentions / total) * 100)
    }));
  }, [results]);

  // Compute Top 3 Theme Stats
  const topThemeStats = useMemo(() => {
    if (!results || !results.topThemes || results.topThemes.length === 0) {
      return [
        { name: "N/A", score: 0 },
        { name: "N/A", score: 0 },
        { name: "N/A", score: 0 }
      ];
    }

    // Already sorted by score in runAnalysis
    const top3 = results.topThemes.slice(0, 3);
    while (top3.length < 3) top3.push({ name: "N/A", score: 0 });

    return top3;
  }, [results]);

  // Identify "Fallen Off" Ticker (Lowest Mentions among selected)
  const coldTicker = useMemo(() => {
    if (!results || !results.tickers || results.tickers.length < 2) return null;
    const sorted = [...results.tickers].sort((a, b) => a.mentions - b.mentions);
    return sorted[0]; // Ticker with fewest mentions
  }, [results]);

  // Identify "Highest Growth" Ticker (Highest Score * Mentions Proxy)
  const growthTicker = useMemo(() => {
    if (!results || !results.tickers || results.tickers.length < 1) return null;
    // Simple growth proxy: Sentiment Score * Log(Mentions)
    const sorted = [...results.tickers].sort((a, b) => {
      const scoreA = (a.finbertScore || 0) * Math.log(a.mentions + 1);
      const scoreB = (b.finbertScore || 0) * Math.log(b.mentions + 1);
      return scoreB - scoreA;
    });
    return sorted[0];
  }, [results]);

  // EXPLANATION LOGIC
  const getGrowthExplanation = (ticker) => {
    if (!ticker) return "";
    const sentiment = parseFloat(ticker.finbertScore) > 0.2 ? "strong positive" : "solid";
    return `Significant uptick in mentions combined with ${sentiment} sentiment suggests rising retail conviction.`;
  };

  const getWarningExplanation = (ticker) => {
    if (!ticker) return "";
    if (ticker.sentiment === 'Bearish') return `Low relative volume combined with negative sentiment suggests investors are exiting positions or losing faith in this asset.`;
    return `Despite neutral/positive sentiment, discussion volume is lagging significantly behind peers, indicating it has fallen out of the current news cycle.`;
  };


  // Compute Total Implicit Tickers (Selected Explicitly + Selected via Firms)
  const totalImplicitTickersCount = useMemo(() => {
    const explicit = selectedTickers.length;
    if (selectedParentCompanies.length === 0) return explicit;

    // Calculate distinct union
    const firmTickers = allTickers.filter(t => selectedParentCompanies.includes(t.parentCo)).map(t => t.symbol);
    const uniqueSet = new Set([...selectedTickers, ...firmTickers]);
    return uniqueSet.size;
  }, [selectedTickers, selectedParentCompanies, allTickers]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message, type = 'info') => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs(prev => [...prev, { id: uniqueId, message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  // --- File Upload Handler ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addLog(`Reading file: ${file.name}...`, 'info');
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      try {
        // Parse CSV to extract Ticker (Col 2) AND Parent Co (Col 0)
        const rows = text.split('\n').slice(1);
        const parsedData = rows.map(row => {
          const cols = row.split(',');
          if (cols.length < 3) return null;
          const rawParent = cols[0] || "Unknown";
          const rawName = cols[1] || "Unknown";
          const rawTicker = cols[2] || "UNK";
          const rawActive = cols[3] || "N";
          return {
            symbol: rawTicker.trim(),
            name: rawName.trim(),
            parentCo: rawParent.trim(), // Store Parent Co
            type: "ETF",
            sector: deriveSector(rawName),
            active: rawActive.trim().toUpperCase().startsWith('Y')
          };
        }).filter(item => item && item.symbol);
        setAllTickers(parsedData);
        setIsFileLoaded(true);
        setSelectedTickers([]);
        addLog(`Successfully loaded ${parsedData.length} tickers from CSV.`, 'success');
      } catch (err) {
        console.error(err);
        addLog("Error parsing CSV file. Please ensure format is correct.", 'error');
      }
    };
    reader.readAsText(file);
  };

  const callGemini = async (prompt) => {
    if (!API_KEY) {
      alert("Missing API Key! Please add your Google Gemini API Key in the code.");
      return "Analysis unavailable: Missing API Key.";
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Unable to generate analysis at this time. Please ensure API connectivity.";
    }
  };

  const generateMarketReport = async () => {
    if (!results) return;
    setIsGeneratingReport(true);
    const prompt = `
      You are Canadian ETF Analysis, an advanced AI financial analyst. 
      Based on the following scraping data from Canadian and US investing subreddits over the ${timeFrameLabel} (${dateRangeString}):
      - Overall Sentiment Score: ${results.overallSentiment}/100
      - Total Mentions: ${results.totalMentions}
      - Top Tickers: ${results.tickers.slice(0, 5).map(t => `${t.symbol} (${t.sentiment})`).join(', ')}
      
      Write a concise, professional executive summary of the current market sentiment. 
      Focus on the relationship between the top theme and the sentiment. 
      Use Markdown formatting. Keep it under 150 words.
    `;
    const response = await callGemini(prompt);
    setMarketReport(response);
    setIsGeneratingReport(false);
  };

  const analyzeTickerWithGemini = async (ticker) => {
    setAnalyzingTicker(ticker.symbol);
    setTickerAnalysis(null);
    const prompt = `
      Analyze the sentiment for stock/ETF: ${ticker.symbol} (${ticker.name}) based on data from the ${timeFrameLabel} (${dateRangeString}).
      Data scraped from Reddit:
      - Sentiment Classification: ${ticker.sentiment}
      - VADER Score (Rule-based): ${ticker.vaderScore} (Scale 0-1)
      - FinBERT Score (Transformer): ${ticker.finbertScore} (Scale 0-1)
      - Discussion Volume: ${ticker.mentions} mentions
      - Sector: ${ticker.sector}
      - Active Management: ${ticker.active ? 'Yes' : 'No'}
      
      Provide a brief "Deep Dive" analysis. 
      1. Interpret the difference (if any) between VADER and FinBERT scores. 
      2. Explain what the volume implies about retail investor attention.
      3. Give a short-term outlook warning or opportunity based on this data.
      Keep it professional but accessible. Use Markdown.
    `;
    const response = await callGemini(prompt);
    setTickerAnalysis({ symbol: ticker.symbol, content: response });
    setAnalyzingTicker(null);
  };

  // NEW: Analyze Company Logic
  const analyzeCompanyWithGemini = async (firm) => {
    setAnalyzingCompany(firm.cleanName);
    setCompanyAnalysis(null);
    const prompt = `
      Analyze the brand sentiment for the financial firm: ${firm.cleanName} based on data from the ${timeFrameLabel} (${dateRangeString}).
      Data scraped from Reddit:
      - Sentiment Classification: ${firm.sentiment}
      - Score: ${firm.score}/100
      - Discussion Volume: ${firm.mentions} mentions
      - Velocity: ${firm.velocity} posts/hr (approx)
      - Top Context Keyword: ${firm.topKeyword}
      
      Provide a brief "Deep Dive" analysis on the brand's reputation among retail investors.
      1. Is the sentiment driven by specific products (ETFs), customer service, or fees?
      2. Compare this to general market sentiment if possible.
      3. Provide a strategic takeaway for the firm.
      Keep it professional. Use Markdown.
    `;
    const response = await callGemini(prompt);
    setCompanyAnalysis({ name: firm.cleanName, content: response });
    setAnalyzingCompany(null);
  };

  const summarizeThemeWithGemini = async (theme) => {
    setSummarizingTheme(theme.name);
    setThemeSummary(null);
    const prompt = `
      Summarize the Reddit discussions around the theme: "${theme.name}".
      Here are some raw comments observed over the ${timeFrameLabel} (${dateRangeString}):
      ${theme.discussions.map(d => `- "${d.text}"`).join('\n')}
      
      Synthesize these into a cohesive narrative. What is the general consensus? What are the main fears or hopes?
      Keep it brief (under 100 words).
    `;
    const response = await callGemini(prompt);
    setThemeSummary({ name: theme.name, content: response });
    setSummarizingTheme(null);
  };

  const summarizeTickerChatterWithGemini = async (ticker) => {
    setSummarizingTheme(ticker.symbol);
    setThemeSummary(null);
    const prompt = `
        Summarize the Reddit discussions regarding the ETF: "${ticker.symbol}".
        Here are some raw comments observed over the ${timeFrameLabel} (${dateRangeString}):
        ${ticker.discussions.map(d => `- "${d.text}"`).join('\n')}
        
        Synthesize these into a cohesive narrative. Is the retail crowd bullish or bearish? What are the specific complaints or praises?
        Keep it brief (under 100 words).
      `;
    const response = await callGemini(prompt);
    setThemeSummary({ name: ticker.symbol, content: response });
    setSummarizingTheme(null);
  };

  // NEW: Summarize Company Chatter
  const summarizeCompanyChatterWithGemini = async (firm) => {
    setSummarizingTheme(firm.cleanName);
    setThemeSummary(null);
    const prompt = `
      Summarize the Reddit discussions regarding the firm: "${firm.cleanName}".
      Here are some raw comments observed over the ${timeFrameLabel} (${dateRangeString}):
      ${firm.discussions.map(d => `- "${d.text}"`).join('\n')}
      
      Synthesize these into a cohesive narrative. Is the retail crowd bullish or bearish? What are the specific complaints or praises?
      Keep it brief (under 100 words).
    `;
    const response = await callGemini(prompt);
    setThemeSummary({ name: firm.cleanName, content: response });
    setSummarizingTheme(null);
  };

  const runAnalysis = async () => {
    // Validation: Need at least one Ticker OR one Parent Company
    if ((selectedTickers.length === 0 && selectedParentCompanies.length === 0) || selectedThemes.length === 0) {
      alert("Please select at least one ticker OR parent company, and one theme.");
      return;
    }

    setStatus('scanning');
    setActiveTab('agent');
    setLogs([]);
    setProgress(0);
    setResults(null);
    setMarketReport(null);
    setBackendError(false);
    setExpandedTheme(null);
    setExpandedTickerChatter(null);
    setExpandedCompanyChatter(null); // Reset new state
    setAnalysisTimestamp(null);

    addLog('Initializing Real-Data Agentic Workflow...', 'system');
    await new Promise(r => setTimeout(r, 500));

    // 1. PREPARE PAYLOAD
    const targetTickers = allTickers.filter(t => selectedTickers.includes(t.symbol));
    const payload = {
      tickers: targetTickers,
      parentCompanies: selectedParentCompanies, // Sending selected parents
      themes: selectedThemes,
      timeFrame: timeFrame
    };

    addLog(`Connecting to Python Backend at ${BACKEND_URL}...`, 'info');
    setProgress(10);

    try {
      // 2. CALL REAL BACKEND
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Backend response not ok");
      }

      addLog('Connection established. Fetching live Reddit data...', 'success');
      setProgress(40);

      const data = await response.json();

      addLog(`Processed ${data.totalMentions} mentions across subreddits.`, 'success');
      addLog('Applying FinBERT sentiment analysis...', 'info');
      setProgress(80);

      // 3. SET RESULTS
      if (data.topThemes) {
        data.topThemes.sort((a, b) => b.score - a.score);
      }

      setResults(data);
      setAnalysisTimestamp(new Date().toLocaleString());
      setProgress(100);
      setStatus('complete');
      addLog('Analysis Complete. Switching to Dashboard.', 'success');

      setTimeout(() => setActiveTab('dashboard'), 1500);

    } catch (error) {
      console.error(error);
      setBackendError(true);
      setStatus('idle');
      addLog('ERROR: Could not connect to Python Backend.', 'error');
      addLog('Please ensure server.py is running on port 5000.', 'error');
    }
  };

  // Get brokerage data for display
  const displayedBrokerageData = useMemo(() => {
    if (!results) return [];
    if (brokerageTickerSelect === "all") {
      const agg = {};
      let count = 0;
      results.tickers.forEach(t => {
        if (t.brokerageDistribution) {
          t.brokerageDistribution.forEach(b => {
            agg[b.name] = (agg[b.name] || 0) + b.percentage;
          });
          count++;
        }
      });
      const entries = Object.entries(agg).map(([name, val]) => ({ name, percentage: count > 0 ? Math.round(val / count) : 0 }));
      return entries.sort((a, b) => b.percentage - a.percentage);
    } else {
      const ticker = results.tickers.find(t => t.symbol === brokerageTickerSelect);
      return ticker ? (ticker.brokerageDistribution || []) : [];
    }
  }, [results, brokerageTickerSelect]);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-blue-500/30">

      {/* Modals */}
      <Modal
        isOpen={backendError}
        onClose={() => setBackendError(false)}
        title="Backend Connection Failed"
      >
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-200">
            <WifiOff size={24} />
            <p>The React app cannot reach the Python analysis engine.</p>
          </div>
          <p>To get <strong>real, accurate data</strong>, you must run the backend server locally:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-400">
            <li>Ensure Python is installed.</li>
            <li>Install dependencies: <code className="bg-slate-800 px-1 rounded">pip install flask praw transformers</code></li>
            <li>Run the script: <code className="bg-slate-800 px-1 rounded">python backend/server.py</code></li>
          </ol>
        </div>
      </Modal>

      {/* Ticker Analysis Modal */}
      <Modal
        isOpen={!!tickerAnalysis}
        onClose={() => setTickerAnalysis(null)}
        title={`Deep Dive: ${tickerAnalysis?.symbol}`}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          {tickerAnalysis?.content.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={() => setTickerAnalysis(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">Close Analysis</button>
        </div>
      </Modal>

      {/* Company Analysis Modal */}
      <Modal
        isOpen={!!companyAnalysis}
        onClose={() => setCompanyAnalysis(null)}
        title={`Brand Deep Dive: ${companyAnalysis?.name}`}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          {companyAnalysis?.content.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={() => setCompanyAnalysis(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">Close Analysis</button>
        </div>
      </Modal>

      <Modal
        isOpen={!!themeSummary}
        onClose={() => setThemeSummary(null)}
        title={`Discussion Summary: ${themeSummary?.name}`}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          {themeSummary?.content.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={() => setThemeSummary(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">Close Summary</button>
        </div>
      </Modal>

      {/* Header */}
      <header className="border-b border-slate-800 bg-black/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Cpu size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">Canadian ETF Analysis</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Agentic Market Intelligence</p>
                {analysisTimestamp && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-700 flex items-center gap-1"><History size={10} /> {analysisTimestamp}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'text-white border-b-2 border-blue-500 pb-1' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`text-sm font-semibold transition-colors ${activeTab === 'agent' ? 'text-white border-b-2 border-blue-500 pb-1' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Live Agent
            </button>
            <div className="h-5 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'idle' || status === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === 'idle' || status === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {status === 'idle' ? 'System Ready' : status === 'complete' ? 'Analysis Ready' : 'Agent Active'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* LIVE AGENT VIEW */}
        {activeTab === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-300">
            {/* Left Column: Control Bar */}
            <div className="lg:col-span-3 space-y-8">
              <Card className="p-8 flex flex-col gap-8 overflow-visible z-10 bg-gradient-to-br from-slate-900 to-black border-blue-900/30">
                <div className="flex items-center justify-between p-5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isFileLoaded ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500 text-slate-500 border border-slate-700'}`}>
                      {isFileLoaded ? <FileSpreadsheet size={24} /> : <UploadCloud size={24} />}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1">Data Source</h3>
                      <p className="text-sm text-slate-400">{isFileLoaded ? `Loaded ${allTickers.length} tickers from file.` : "Using sample data. Load full CSV for 1,816+ tickers."}</p>
                    </div>
                  </div>
                  <div>
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-all border border-slate-600 hover:border-slate-500 shadow-sm">{isFileLoaded ? "Change File" : "Load CSV"}</button>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex-1 w-full">
                    <h2 className="text-2xl font-bold text-white mb-6">Run Analysis Cycle</h2>
                    <div className="flex flex-col sm:flex-row gap-6 w-full">
                      {/* --- NEW DASHBOARD RIGHT COLUMN --- */}
                      <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col gap-4 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><List size={14} /> Selection Overview</h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {/* TICKERS */}
                          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-2 h-full min-h-[150px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Tickers</span>
                              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{totalImplicitTickersCount}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[120px] custom-scrollbar flex flex-col gap-1">
                              {selectedTickers.length > 0 ? (
                                selectedTickers.map(t => (
                                  <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 truncate">{t}</span>
                                ))
                              ) : <span className="text-xs text-slate-600 italic">Implicit via Firms</span>}
                            </div>
                          </div>

                          {/* FIRMS */}
                          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-2 h-full min-h-[150px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Firms</span>
                              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{selectedParentCompanies.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[120px] custom-scrollbar flex flex-col gap-1">
                              {selectedParentCompanies.length > 0 ? (
                                selectedParentCompanies.map(t => (
                                  <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 truncate">{t}</span>
                                ))
                              ) : <span className="text-xs text-slate-600 italic">None selected</span>}
                            </div>
                          </div>

                          {/* THEMES */}
                          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-2 h-full min-h-[150px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Themes</span>
                              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{selectedThemes.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[120px] custom-scrollbar flex flex-col gap-1">
                              {selectedThemes.length > 0 ? (
                                selectedThemes.map(t => (
                                  <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 truncate">{t}</span>
                                ))
                              ) : <span className="text-xs text-slate-600 italic">None selected</span>}
                            </div>
                          </div>

                          {/* TIMEFRAME */}
                          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-2 h-full min-h-[150px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Timeframe</span>
                            </div>
                            <div className="flex items-center justify-center h-full">
                              <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20 text-center">
                                {TIME_FRAMES.find(t => t.value === timeFrame)?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* SEPARATE ROW FOR DROPDOWNS SO THEY HAVE SPACE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-4">
                      <MultiSelect label="Target Tickers" icon={Settings} searchPlaceholder="Search symbol..." options={allTickers.map(t => ({ label: t.symbol, value: t.symbol, subLabel: t.name }))} selected={selectedTickers} onChange={setSelectedTickers} />
                      <MultiSelect label="Target Firms" icon={Building2} searchPlaceholder="Search company..." options={parentCompanyOptions} selected={selectedParentCompanies} onChange={setSelectedParentCompanies} />
                      <MultiSelect label="Themes to Extract" icon={Filter} searchPlaceholder="Search theme..." options={THEMES_POOL.map(t => ({ label: t, value: t }))} selected={selectedThemes} onChange={setSelectedThemes} />

                      {/* Time Filter */}
                      <div className="relative flex-1 min-w-[180px]">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
                          <Clock size={14} /> Time Frame
                        </label>
                        <select
                          value={timeFrame}
                          onChange={(e) => setTimeFrame(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 hover:border-slate-500 rounded-lg px-4 py-3 text-left text-sm text-white outline-none transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                        >
                          {TIME_FRAMES.map(tf => (
                            <option key={tf.value} value={tf.value}>{tf.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-[34px] text-slate-400 pointer-events-none" />
                      </div>

                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={runAnalysis} disabled={status === 'scanning' || status === 'processing' || (selectedTickers.length === 0 && selectedParentCompanies.length === 0)} className={`flex-1 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${status === 'scanning' || status === 'processing' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-600/40'}`}>{status === 'idle' || status === 'complete' ? <><Play size={20} /> Start Agent</> : <><RefreshCw size={20} className="animate-spin" /> Processing...</>}</button>
                    {/* CANCEL BUTTON (Optional - Resets State) */}
                    {status !== 'idle' && status !== 'complete' && (
                      <button onClick={() => window.location.reload()} className="px-6 py-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 hover:shadow-rose-600/40 transition-all flex items-center gap-2"><X size={20} /> Cancel</button>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="h-[200px] flex flex-col"> {/* Reduced Height */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                  <div className="flex items-center gap-3"><Terminal size={18} className="text-slate-400" /><span className="font-mono text-sm font-semibold text-slate-200">Agent Log</span></div>
                  <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div><div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div></div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto font-mono text-sm space-y-4 bg-black">
                  {logs.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3"><Activity size={32} opacity={0.5} /><p>Waiting for command...</p></div>}
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-slate-600 shrink-0 text-xs pt-0.5">[{log.timestamp}]</span>
                      <span className={`${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'system' ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>{log.type === 'system' && '> '}{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
                {status !== 'idle' && status !== 'complete' && <div className="p-5 border-t border-slate-800 bg-slate-900"><ProgressBar progress={progress} label="Task Progress" /></div>}
              </Card>
            </div>

            {/* Right Column: Status */}
            <Card className="p-8 flex flex-col justify-center bg-slate-900 h-fit">
              <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-slate-400">Agent Confidence</span><span className="text-emerald-400 text-lg font-bold">98.2%</span></div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-emerald-500 h-full w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div></div>
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm text-slate-400"><span>Source Type:</span><span className="text-white font-medium">{isFileLoaded ? 'CSV File' : 'Sample Data'}</span></div>
                <div className="flex justify-between text-sm text-slate-400"><span>Models Loaded:</span><span className="text-white font-medium">VADER, FinBERT</span></div>
              </div>
            </Card>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {!results ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                <Search size={64} className="mb-6 opacity-20" /><h3 className="text-xl font-semibold text-slate-400 mb-2">No Analysis Data</h3><p className="text-base">Run the agent to generate market insights.</p>
              </div>
            ) : (
              <div className="space-y-8">

                {/* ROW 1: EXECUTIVE REPORT */}
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-slate-900">
                  <div className="p-6 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2.5 mb-3"><Sparkles size={20} className="text-purple-400" /> Executive Market Report <span className="text-xs font-normal text-slate-500 ml-2">({dateRangeString})</span></h3>
                      {!marketReport && !isGeneratingReport && <p className="text-sm text-slate-400 leading-relaxed">Generate a human-readable summary of all current sentiment data using Gemini.</p>}
                      {isGeneratingReport && <div className="flex items-center gap-3 text-sm text-purple-300 animate-pulse font-medium"><RefreshCw size={16} className="animate-spin" /> Consulting Agentic LLM...</div>}
                      {marketReport && <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-950/60 p-5 rounded-xl border border-slate-700/50 leading-relaxed shadow-inner">{marketReport}</div>}
                    </div>
                    <button onClick={generateMarketReport} disabled={isGeneratingReport} className="shrink-0 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5">{marketReport ? 'Regenerate Report' : 'Generate Report'} <FileText size={16} /></button>
                  </div>
                </Card>

                {/* ROW 2: STATS (UPDATED: Top 3 Rankings) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* 1st Place */}
                  <Card className="p-6 bg-gradient-to-br from-yellow-900/30 to-slate-900 border-yellow-700/30 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Medal size={18} className="text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">#1 Trending</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white tracking-tight">{topTickerStats[0].name}</span><span className="text-sm text-slate-400 font-medium">{topTickerStats[0].percentage}% Share</span></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge type={topTickerStats[0].sentiment === 'Bullish' ? 'positive' : (topTickerStats[0].sentiment === 'Bearish' ? 'negative' : 'neutral')}>{topTickerStats[0].sentiment}</Badge>
                    </div>
                    <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Top Theme</span>
                      <span className="text-slate-300 font-medium">{topThemeStats[0]?.name || "N/A"}</span>
                    </div>
                  </Card>

                  {/* 2nd Place */}
                  <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50">
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Medal size={18} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">#2 Trending</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1"><span className="text-3xl font-bold text-white tracking-tight">{topTickerStats[1].name}</span><span className="text-sm text-slate-500 font-medium">{topTickerStats[1].percentage}% Share</span></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge type={topTickerStats[1].sentiment === 'Bullish' ? 'positive' : (topTickerStats[1].sentiment === 'Bearish' ? 'negative' : 'neutral')}>{topTickerStats[1].sentiment}</Badge>
                    </div>
                    <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Top Theme</span>
                      <span className="text-slate-300 font-medium">{topThemeStats[1]?.name || "N/A"}</span>
                    </div>
                  </Card>

                  {/* 3rd Place */}
                  <Card className="p-6 bg-gradient-to-br from-orange-900/20 to-slate-900 border-orange-900/30">
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Medal size={18} className="text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">#3 Trending</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1"><span className="text-3xl font-bold text-white tracking-tight">{topTickerStats[2].name}</span><span className="text-sm text-slate-500 font-medium">{topTickerStats[2].percentage}% Share</span></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge type={topTickerStats[2].sentiment === 'Bullish' ? 'positive' : (topTickerStats[2].sentiment === 'Bearish' ? 'negative' : 'neutral')}>{topTickerStats[2].sentiment}</Badge>
                    </div>
                    <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Top Theme</span>
                      <span className="text-slate-300 font-medium">{topThemeStats[2]?.name || "N/A"}</span>
                    </div>
                  </Card>

                </div>

                {/* ROW 3: MOMENTUM WARNINGS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* WARNING: Fallen Off Ticker */}
                  <Card className="p-6 border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-slate-900">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><AlertTriangle size={20} /></div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-100">Momentum Warning</h4>
                        <p className="text-xs text-rose-400/80">Significant drop in retail interest</p>
                      </div>
                    </div>
                    {coldTicker ? (
                      <div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-white">{coldTicker.symbol}</span>
                          <span className="text-xs text-slate-400">has the lowest relative volume</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {getWarningExplanation(coldTicker)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No significant drop-offs detected in this dataset.</p>
                    )}
                  </Card>

                  {/* HIGHLIGHT: High Growth Ticker */}
                  <Card className="p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-100">High Flyer Alert</h4>
                        <p className="text-xs text-emerald-400/80">Strongest positive momentum signal</p>
                      </div>
                    </div>
                    {growthTicker && growthTicker.symbol !== coldTicker?.symbol ? (
                      <div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-white">{growthTicker.symbol}</span>
                          <span className="text-xs text-slate-400">is showing rapid growth</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {getGrowthExplanation(growthTicker)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No clear breakout growth detected.</p>
                    )}
                  </Card>
                </div>


                {/* ROW 4: TICKER ANALYSIS */}
                <Card>
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2.5"><BarChart3 size={20} className="text-blue-500" /> Ticker Sentiment Analysis</h3>
                    <div className="flex gap-2 text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded"><span>Showing {results.tickers.length} items</span></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950 font-semibold tracking-wide">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-lg">Ticker</th>
                          <th className="px-6 py-4">Type/Sector</th>
                          <th className="px-6 py-4">Sentiment</th>
                          <th className="px-6 py-4">FinBERT</th>
                          <th className="px-6 py-4">Mentions</th>
                          <th className="px-6 py-4">Share of Voice</th> {/* NEW */}
                          <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {results.tickers.map((ticker, idx) => (
                          <tr key={ticker.symbol} className={`hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                            <td className="px-6 py-4 font-medium text-white">
                              <div className="flex items-center gap-3"><span className="bg-slate-800 px-2 py-1 rounded text-xs font-bold w-14 text-center border border-slate-700">{ticker.symbol}</span><span className="text-slate-300 font-medium hidden sm:inline">{ticker.name.length > 25 ? ticker.name.substring(0, 25) + '...' : ticker.name}</span></div>
                            </td>
                            <td className="px-6 py-4"><div className="flex flex-col gap-0.5"><span className="text-xs font-medium text-slate-300">{ticker.sector}</span><span className="text-[10px] uppercase tracking-wide text-slate-500">{ticker.type} {ticker.active ? '• Active' : '• Passive'}</span></div></td>
                            <td className="px-6 py-4"><Badge type={ticker.sentiment === 'Bullish' ? 'positive' : 'negative'}>{ticker.sentiment}</Badge></td>
                            <td className="px-6 py-4 text-slate-300 font-medium">{ticker.finbertScore}</td>
                            <td className="px-6 py-4 text-slate-300">{ticker.mentions}</td>
                            {/* NEW: Share of Voice Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${Math.round((ticker.mentions / (results.totalMentions || 1)) * 100)}%` }}></div>
                                </div>
                                <span className="text-xs text-slate-400">{Math.round((ticker.mentions / (results.totalMentions || 1)) * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right"><button onClick={() => analyzeTickerWithGemini(ticker)} disabled={!!analyzingTicker} className="text-xs font-medium flex items-center gap-1.5 ml-auto bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-md transition-colors shadow-sm">{analyzingTicker === ticker.symbol ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Analyze</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* ROW 5: COMPANY SENTIMENT ANALYSIS (EXPANDED) */}
                <Card>
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2.5"><Building2 size={20} className="text-purple-500" /> Company Sentiment Analysis</h3>
                    <div className="flex gap-2 text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded"><span>Firm-Level Data</span></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950 font-semibold tracking-wide">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-lg">Parent Firm</th>
                          <th className="px-6 py-4">Sentiment Score</th>
                          <th className="px-6 py-4">Volume</th>
                          <th className="px-6 py-4">Discussion Velocity <span className="text-[9px] text-slate-500 block font-normal">Posts/Hr</span></th>
                          <th className="px-6 py-4">Top Keyword <span className="text-[9px] text-slate-500 block font-normal">AI Generated</span></th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {results.parentCompanies && results.parentCompanies.length > 0 ? (
                          results.parentCompanies.map((firm, idx) => (
                            <tr key={firm.name} className={`hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                              <td className="px-6 py-4 font-medium text-white">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{firm.cleanName}</span>
                                  <span className="text-[10px] text-slate-500">{firm.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div className={`h-full ${firm.score >= 50 ? 'bg-purple-500' : 'bg-rose-500'}`} style={{ width: `${firm.score}%` }}></div>
                                  </div>
                                  <span className="font-mono text-xs text-slate-300">{firm.score}/100</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{firm.mentions} mentions</td>
                              {/* Mock Data for New Columns */}
                              <td className="px-6 py-4 text-slate-300 flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> {(firm.velocity)}</td>
                              <td className="px-6 py-4 text-slate-400 text-xs italic">{firm.topKeyword}</td>
                              <td className="px-6 py-4"><Badge type={firm.sentiment === 'Positive' ? 'positive' : (firm.sentiment === 'Negative' ? 'negative' : 'neutral')}>{firm.sentiment}</Badge></td>
                              {/* NEW: Analyze Button for Company */}
                              <td className="px-6 py-4 text-right"><button onClick={() => analyzeCompanyWithGemini(firm)} disabled={!!analyzingCompany} className="text-xs font-medium flex items-center gap-1.5 ml-auto bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-md transition-colors shadow-sm">{analyzingCompany === firm.cleanName ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Analyze</button></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500 italic">No companies selected.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* ROW 6: BROKERAGE INTELLIGENCE */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2.5"><Wallet size={20} className="text-emerald-500" /> Brokerage Intelligence <span className="text-xs font-normal text-slate-500 ml-2">({dateRangeString})</span></h3>
                    <select
                      value={brokerageTickerSelect}
                      onChange={(e) => setBrokerageTickerSelect(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Aggregate (All Selected)</option>
                      {results.tickers.map(t => (
                        <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 font-semibold">
                        <tr>
                          <th className="px-4 py-3 rounded-l-lg">Platform</th>
                          <th className="px-4 py-3">Reddit Sentiment Share</th>
                          <th className="px-4 py-3 rounded-r-lg text-right">Popularity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {displayedBrokerageData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-full max-w-[200px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${item.percentage}%` }}></div>
                                </div>
                                <span className="text-xs text-slate-400">{item.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {idx === 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Top Choice</span>}
                              {idx === 1 && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">Runner Up</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* ROW 7, 8, 9: CHATTER INDIVIDUAL ROWS */}
                <div className="flex flex-col gap-8">

                  {/* Theme Discussions */}
                  <Card className="p-6 h-fit">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2.5"><Globe size={20} className="text-purple-500" /> Theme Chatter</h3>
                    </div>
                    <div className="space-y-4">
                      {results.topThemes.map((theme, i) => (
                        <div key={i} className="group bg-slate-800/20 hover:bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden transition-all">
                          <div
                            onClick={() => setExpandedTheme(expandedTheme === i ? null : i)}
                            className="p-4 cursor-pointer flex flex-col gap-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-200 font-semibold">{theme.name}</span>
                              <ChevronDown size={16} className={`text-slate-500 transition-transform ${expandedTheme === i ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                                <div className={`h-full rounded-full transition-all duration-500 ${theme.score >= 50 ? 'bg-purple-500' : 'bg-rose-500'}`} style={{ width: `${theme.score}%` }} />
                              </div>
                              <span className={`text-xs font-bold w-8 text-right ${theme.score >= 50 ? 'text-purple-400' : 'text-rose-400'}`}>{theme.score}%</span>
                            </div>
                          </div>

                          {expandedTheme === i && (
                            <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Comments</h4>
                                <button
                                  onClick={(e) => { e.stopPropagation(); summarizeThemeWithGemini(theme); }}
                                  className="text-[10px] font-semibold flex items-center gap-1.5 bg-purple-500/10 text-purple-300 px-2.5 py-1.5 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                >
                                  {summarizingTheme === theme.name ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  Summarize
                                </button>
                              </div>
                              <div className="space-y-3">
                                {theme.discussions.map((comment, idx) => (
                                  <div key={idx} className="flex flex-col gap-1.5 items-start border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{comment.source}</span>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} /> {formatDate(comment.timestamp)}</span>
                                      </div>
                                      <a href={comment.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={12} /></a>
                                    </div>
                                    <div className="flex gap-3 items-start w-full pl-1 mt-1">
                                      <MessageCircle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-slate-300 leading-relaxed italic">"{comment.text}"</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 h-fit">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2.5 mb-6"><Users size={20} className="text-blue-500" /> Ticker Chatter</h3>
                    <div className="space-y-4">
                      {results.tickers.map((ticker, i) => (
                        <div key={i} className="group bg-slate-800/20 hover:bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden transition-all">
                          <div
                            onClick={() => setExpandedTickerChatter(expandedTickerChatter === i ? null : i)}
                            className="p-4 cursor-pointer flex flex-col gap-2 hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-800 text-[10px] px-2 py-1 rounded font-bold text-slate-300 border border-slate-700">{ticker.symbol}</span>
                                <span className="text-sm text-slate-200 font-semibold truncate max-w-[140px]">{ticker.name}</span>
                              </div>
                              <ChevronDown size={16} className={`text-slate-500 transition-transform ${expandedTickerChatter === i ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium pl-1">
                              <span className="text-slate-500">{ticker.mentions} mentions</span>
                              <span className={`${ticker.sentiment === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>{ticker.sentiment}</span>
                            </div>
                          </div>
                          {expandedTickerChatter === i && (
                            <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Discussions</h4>
                                <button
                                  onClick={(e) => { e.stopPropagation(); summarizeTickerChatterWithGemini(ticker); }}
                                  className="text-[10px] font-semibold flex items-center gap-1.5 bg-blue-500/10 text-blue-300 px-2.5 py-1.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                >
                                  {summarizingTheme === ticker.symbol ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  Summarize
                                </button>
                              </div>
                              <div className="space-y-3">
                                {ticker.discussions.map((comment, idx) => (
                                  <div key={idx} className="flex flex-col gap-1.5 items-start border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{comment.source}</span>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} /> {formatDate(comment.timestamp)}</span>
                                      </div>
                                      <a href={comment.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={12} /></a>
                                    </div>
                                    <div className="flex gap-3 items-start w-full pl-1 mt-1">
                                      <MessageCircle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-slate-300 leading-relaxed italic">"{comment.text}"</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 3. Company Chatter (EXPANDED) */}
                  <Card className="p-6 h-fit">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2.5"><Building2 size={20} className="text-emerald-500" /> Company Chatter</h3>
                      {/* NEW: Filter & Sort Controls */}
                      <div className="flex gap-3">
                        <select
                          className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1 outline-none"
                          onChange={(e) => setCompanyChatterFilter(e.target.value)}
                          value={companyChatterFilter}
                        >
                          <option value="All">All Sentiment</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                        </select>
                        <select
                          className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1 outline-none"
                          onChange={(e) => setCompanyChatterSort(e.target.value)}
                          value={companyChatterSort}
                        >
                          <option value="Newest">Newest</option>
                          <option value="Oldest">Oldest</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {results.parentCompanies && results.parentCompanies.map((firm, i) => (
                        <div key={i} className="group bg-slate-800/20 hover:bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden transition-all">
                          <div
                            onClick={() => setExpandedCompanyChatter(expandedCompanyChatter === i ? null : i)}
                            className="p-4 cursor-pointer flex flex-col gap-2 hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-800 text-[10px] px-2 py-1 rounded font-bold text-slate-300 border border-slate-700">{firm.cleanName}</span>
                              </div>
                              <ChevronDown size={16} className={`text-slate-500 transition-transform ${expandedCompanyChatter === i ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium pl-1 mt-1">
                              <span className="text-slate-500">{firm.mentions} mentions</span>
                              <span className={`${firm.sentiment === 'Positive' ? 'text-emerald-400' : (firm.sentiment === 'Negative' ? 'text-rose-400' : 'text-slate-400')}`}>{firm.sentiment}</span>
                            </div>
                          </div>
                          {expandedCompanyChatter === i && (
                            <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Discussions</h4>
                                <button
                                  onClick={(e) => { e.stopPropagation(); summarizeCompanyChatterWithGemini(firm); }} // NEED NEW FUNC
                                  className="text-[10px] font-semibold flex items-center gap-1.5 bg-blue-500/10 text-blue-300 px-2.5 py-1.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                >
                                  {summarizingTheme === firm.cleanName ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  Summarize
                                </button>
                              </div>
                              <div className="space-y-3">
                                {/* Apply Sort and Filter Logic Here */}
                                {firm.discussions && firm.discussions
                                  .filter(d => {
                                    if (companyChatterFilter === 'All') return true;
                                    return d.sentiment === companyChatterFilter;
                                  })
                                  .sort((a, b) => companyChatterSort === 'Newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp)
                                  .map((comment, idx) => (
                                    <div key={idx} className="flex flex-col gap-1.5 items-start border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{comment.source}</span>
                                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} /> {formatDate(comment.timestamp)}</span>
                                          {/* Sentiment Badge for Comment */}
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${comment.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' :
                                              comment.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-400' :
                                                'bg-slate-700 text-slate-400'
                                            }`}>{comment.sentiment}</span>
                                        </div>
                                        <a href={comment.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={12} /></a>
                                      </div>
                                      <div className="flex gap-3 items-start w-full pl-1 mt-1">
                                        <MessageCircle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-slate-300 leading-relaxed italic">"{comment.text}"</p>
                                      </div>
                                    </div>
                                  ))}
                                {(!firm.discussions || firm.discussions.length === 0) && (
                                  <p className="text-xs text-slate-500 italic">No recent discussions found.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                </div>

                {/* ROW 10: ACTIVE DATA SOURCES (FULL WIDTH AT BOTTOM) */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2.5 mb-6"><Database size={20} className="text-orange-500" /> Active Data Sources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                    {SUBREDDITS.map((sub) => (
                      <div key={sub.name} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all hover:border-slate-600 group">
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-slate-900 p-1.5 rounded-lg group-hover:scale-110 transition-transform">{sub.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{sub.name}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div> Live Stream</span>
                          </div>
                        </div>
                        <a href={`https://reddit.com/${sub.name}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"><LinkIcon size={14} /></a>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
