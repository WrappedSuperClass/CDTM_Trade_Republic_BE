import sqlite3
from datetime import date, datetime
import json
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import yfinance as yf

class NewsStory(BaseModel):
    id: Optional[int] = None
    companyName: str
    ticker: str
    headline: str
    content: str
    source: str
    logo: Optional[str] = None
    created_at: Optional[datetime] = None

class NewsCache:
    def __init__(self, db_path="news_cache.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialisiert die SQLite-Datenbank mit den benötigten Tabellen."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Bestehende news_cache Tabelle
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS news_cache (
                    date TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP
                )
            """)
            # Neue subscription_stories Tabelle
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subscription_stories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticker TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    headline TEXT NOT NULL,
                    content TEXT NOT NULL,
                    source TEXT NOT NULL,
                    logo TEXT,
                    created_at TIMESTAMP
                )
            """)
            conn.commit()

    def store_subscription_story(self, story: NewsStory) -> int:
        """Speichert eine News-Story in der subscription_stories Tabelle."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Konvertiere datetime zu ISO-Format für die Speicherung
            created_at_iso = story.created_at.isoformat() if story.created_at else None
            cursor.execute("""
                INSERT INTO subscription_stories (ticker, company_name, headline, content, source, logo, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (story.ticker, story.companyName, story.headline, story.content, story.source, story.logo, created_at_iso))
            conn.commit()
            return cursor.lastrowid

    def get_subscription_stories_by_tickers(self, tickers: List[str], limit_per_ticker: int = 4) -> dict[str, List[NewsStory]]:
        """Holt die neuesten News-Stories für mehrere Ticker."""
        result = {}
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Lösche Einträge älter als 5 Tage
            cursor.execute("""
                DELETE FROM subscription_stories
                WHERE created_at < datetime('now', '-5 days')
            """)
            conn.commit()
            
            # Hole Stories für jeden Ticker
            for ticker in tickers:
                cursor.execute("""
                    SELECT id, ticker, company_name, headline, content, source, logo, created_at
                    FROM subscription_stories
                    WHERE ticker = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (ticker, limit_per_ticker))
                rows = cursor.fetchall()
                
                # Nur hinzufügen wenn Stories vorhanden sind
                if rows:
                    result[ticker] = [
                        NewsStory(
                            id=row[0],
                            ticker=row[1],
                            companyName=row[2],
                            headline=row[3],
                            content=row[4],
                            source=row[5],
                            logo=row[6],
                            created_at=datetime.fromisoformat(row[7]) if row[7] else None
                        )
                        for row in rows
                    ]
                    result[ticker].sort(key=lambda x: x.created_at, reverse=True)
        
        return result

    def get_subscription_stories_by_ticker(self, ticker: str, limit: int = 4) -> List[NewsStory]:
        """Holt die neuesten News-Stories für einen einzelnen Ticker."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Lösche Einträge älter als 5 Tage
            cursor.execute("""
                DELETE FROM subscription_stories
                WHERE created_at < datetime('now', '-5 days')
            """)
            conn.commit()
            
            # Hole Stories für den Ticker
            cursor.execute("""
                SELECT id, ticker, company_name, headline, content, source, logo, created_at
                FROM subscription_stories
                WHERE ticker = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (ticker, limit))
            rows = cursor.fetchall()
            
            if not rows:
                return []
                
            stories = [
                NewsStory(
                    id=row[0],
                    ticker=row[1],
                    companyName=row[2],
                    headline=row[3],
                    content=row[4],
                    source=row[5],
                    logo=row[6],
                    created_at=datetime.fromisoformat(row[7]) if row[7] else None
                )
                for row in rows
            ]
            stories.sort(key=lambda x: x.created_at, reverse=True)
            
            return stories

    def get_cached_news(self):
        """Holt die gecachten News für den aktuellen Tag."""
        today = date.today().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Lösche alte Einträge
            cursor.execute("DELETE FROM news_cache WHERE date != ?", (today,))
            conn.commit()
            
            # Hole den Eintrag für heute
            cursor.execute("SELECT data FROM news_cache WHERE date = ?", (today,))
            result = cursor.fetchone()
            
            if result:
                return json.loads(result[0])
            return None

    def store_news(self, news_data):
        """Speichert die News für den aktuellen Tag."""
        today = date.today().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Lösche alle alten Einträge
            cursor.execute("DELETE FROM news_cache")
            # Füge neuen Eintrag hinzu
            cursor.execute("""
                INSERT INTO news_cache (date, data)
                VALUES (?, ?)
            """, (today, json.dumps(news_data)))
            conn.commit()

    def transform_stories_with_stock_data(self, stories: Dict[str, List[NewsStory]]) -> Dict[str, Dict[str, Any]]:
        """Transformiert die Stories in das gewünschte Format mit zusätzlichen Aktiendaten."""
        result = {}
        
        for ticker, ticker_stories in stories.items():
            try:
                # Hole Aktiendaten für 2 Tage
                stock = yf.Ticker(ticker)
                hist = stock.history(period="2d", interval="1d")  # Hole 2 Tage mit täglicher Auflösung
                
                if hist.empty or len(hist) < 2:
                    print(f"Nicht genügend Aktiendaten gefunden für {ticker}")
                    # Verwende nur den aktuellen Preis wenn keine Änderung berechnet werden kann
                    current_price = hist['Close'].iloc[-1] if not hist.empty else 0
                    change = 0
                else:
                    # Berechne die Änderung
                    current_price = hist['Close'].iloc[-1]
                    previous_price = hist['Close'].iloc[-2]
                    change = ((current_price - previous_price) / previous_price) * 100
                
                # Hole Firmeninfo
                info = stock.info
                company_name = info.get('longName', ticker)
                
                # Sortiere Stories nach Datum (älteste zuerst)
                sorted_stories = sorted(ticker_stories, key=lambda x: x.created_at if x.created_at else datetime.min)
                
                # Transformiere die Stories
                transformed_stories = [
                    {
                        "headline": story.headline,
                        "content": story.content,
                        "source": story.source,
                        "created_at": story.created_at.isoformat() if story.created_at else None
                    }
                    for story in sorted_stories
                ]
                
                # Erstelle das finale Format
                result[ticker] = {
                    "companyName": company_name,
                    "logo": ticker_stories[0].logo if ticker_stories else None,  # Nimm das Logo der ersten Story
                    "change": round(change, 2),  # Runde auf 2 Dezimalstellen
                    "price": round(current_price, 2),
                    "news": transformed_stories
                }
                
            except Exception as e:
                print(f"Fehler beim Transformieren der Daten für {ticker}: {str(e)}")
                continue
        
        return result