'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, ExternalLink,
  Newspaper, BarChart3
} from 'lucide-react';

const STOCK_SYMBOLS = [
  { symbol: 'PANW', name: 'Palo Alto Networks' },
  { symbol: 'SNOW', name: 'Snowflake' },
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
];

const NEWS_CATEGORIES = [
  { id: 'paloalto', label: 'Palo Alto Networks' },
  { id: 'tech', label: 'General Tech' },
  { id: 'google', label: 'Google Cloud & AI' },
  { id: 'ipo', label: 'IPOs & Markets' },
  { id: 'finance', label: 'Financial Markets' },
];

function StockCard({ stock }) {
  const isUp = stock.change >= 0;
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-accent-green tracking-wider">{stock.symbol}</span>
        <div className={`flex items-center gap-1 text-xs font-mono ${isUp ? 'stock-up' : 'stock-down'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isUp ? '+' : ''}{stock.change}%
        </div>
      </div>
      <div className="text-xl font-bold font-mono text-text-primary">${stock.price}</div>
      <div className="text-[10px] text-text-muted mt-1">{stock.name}</div>
    </div>
  );
}

function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-dark-card border border-dark-border rounded-lg px-4 py-3 card-hover group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-text-muted">{article.source}</span>
            <span className="text-[11px] text-text-muted">·</span>
            <span className="text-[11px] text-text-muted">{article.time}</span>
          </div>
        </div>
        <ExternalLink size={12} className="text-text-muted shrink-0 mt-1 group-hover:text-accent-green transition-colors" />
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stock Tickers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-accent-green" />
            <h2 className="text-base font-semibold">Market Overview</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-accent-green
                     bg-dark-card border border-dark-border rounded-lg hover:border-accent-green/30 transition-all"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(stocks.length > 0 ? stocks : STOCK_SYMBOLS.map(s => ({
            ...s, price: '---', change: 0
          }))).map((stock, i) => (
            <StockCard key={i} stock={stock} />
          ))}
        </div>
      </section>

      {/* News Feed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper size={18} className="text-accent-mint" />
          <h2 className="text-base font-semibold">News Feed</h2>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${activeCategory === cat.id
                  ? 'bg-accent-green/15 border border-accent-green/40 text-accent-green'
                  : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary hover:border-dark-hover'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-dark-card border border-dark-border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-dark-hover rounded w-3/4 mb-2" />
                  <div className="h-3 bg-dark-hover rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : currentNews.length > 0 ? (
            currentNews.map((article, i) => <NewsCard key={i} article={article} />)
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <Newspaper size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">News feeds loading...</p>
              <p className="text-xs text-text-muted mt-1">Data refreshes every 5 minutes</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
