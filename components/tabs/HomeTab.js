'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, ExternalLink,
  Newspaper, BarChart3, Globe, Cpu, Landmark, Rocket
} from 'lucide-react';

const STOCK_SYMBOLS = [
  { symbol: 'PANW', name: 'Palo Alto Networks' },
  { symbol: 'SNOW', name: 'Snowflake' },
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
];

const NEWS_CATEGORIES = [
  { id: 'paloalto', label: 'Palo Alto Networks', icon: Cpu, color: 'text-accent-blue' },
  { id: 'tech', label: 'General Tech', icon: Globe, color: 'text-accent-cyan' },
  { id: 'google', label: 'Google Cloud & AI', icon: Cpu, color: 'text-green-400' },
  { id: 'ipo', label: 'IPOs & Markets', icon: Rocket, color: 'text-accent-purple' },
  { id: 'finance', label: 'Financial Markets', icon: Landmark, color: 'text-yellow-400' },
];

function StockCard({ stock }) {
  const isUp = stock.change >= 0;
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 card-hover">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-mono font-bold text-text-primary">{stock.symbol}</span>
          <p className="text-xs text-text-secondary">{stock.name}</p>
        </div>
        <div className={`flex items-center gap-1 ${isUp ? 'stock-up' : 'stock-down'}`}>
          {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold font-mono text-text-primary">${stock.price}</span>
        <span className={`text-sm font-mono ${isUp ? 'stock-up' : 'stock-down'}`}>
          {isUp ? '+' : ''}{stock.change}%
        </span>
      </div>
    </div>
  );
}

function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-dark-card border border-dark-border rounded-lg p-4 card-hover group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{article.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-text-muted">{article.source}</span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{article.time}</span>
          </div>
        </div>
        <ExternalLink size={14} className="text-text-muted shrink-0 mt-1 group-hover:text-accent-blue transition-colors" />
      </div>
    </a>
  );
}

export default function HomeTab() {
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState({});
  const [activeCategory, setActiveCategory] = useState('paloalto');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, newsRes] = await Promise.all([
        fetch('/api/stocks').then(r => r.json()).catch(() => null),
        fetch('/api/news').then(r => r.json()).catch(() => null),
      ]);
      if (stockRes?.stocks) setStocks(stockRes.stocks);
      if (newsRes?.news) setNews(newsRes.news);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentNews = news[activeCategory] || [];

  return (
    <div className="space-y-6">
      {/* Stock Tickers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-accent-blue" />
            <h2 className="text-lg font-semibold">Market Overview</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-accent-blue
                     bg-dark-card border border-dark-border rounded-lg hover:border-accent-blue/30 transition-all"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(stocks.length > 0 ? stocks : STOCK_SYMBOLS.map(s => ({
            ...s, price: '---', change: 0, loading: true
          }))).map((stock, i) => (
            <StockCard key={i} stock={stock} />
          ))}
        </div>
      </section>

      {/* News Feed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper size={20} className="text-accent-cyan" />
          <h2 className="text-lg font-semibold">News Feed</h2>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {NEWS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${activeCategory === cat.id
                    ? 'bg-dark-card border border-accent-blue/40 text-accent-blue'
                    : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary hover:border-dark-hover'
                  }`}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* News list */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-dark-card border border-dark-border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-dark-hover rounded w-3/4 mb-2" />
                  <div className="h-3 bg-dark-hover rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : currentNews.length > 0 ? (
            currentNews.map((article, i) => <NewsCard key={i} article={article} />)
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">News feeds loading...</p>
              <p className="text-xs text-text-muted mt-1">Data refreshes every 5 minutes</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
