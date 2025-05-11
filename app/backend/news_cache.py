import sqlite3
from datetime import date, datetime
import json
from pydantic import BaseModel
from typing import Optional, List

class NewsStory(BaseModel):
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def store_subscription_story(self, story: NewsStory) -> int:
        """Speichert eine News-Story in der subscription_stories Tabelle."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO subscription_stories (ticker, company_name, headline, content, source, logo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (story.ticker, story.companyName, story.headline, story.content, story.source, story.logo))
            conn.commit()
            return cursor.lastrowid

    def get_subscription_stories_by_tickers(self, tickers: List[str], limit_per_ticker: int = 10) -> dict[str, List[NewsStory]]:
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
                    SELECT ticker, company_name, headline, content, source, logo, created_at
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
                            ticker=row[0],
                            companyName=row[1],
                            headline=row[2],
                            content=row[3],
                            source=row[4],
                            logo=row[5],
                            created_at=datetime.fromisoformat(row[6]) if row[6] else None
                        )
                        for row in rows
                    ]
        
        return result

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