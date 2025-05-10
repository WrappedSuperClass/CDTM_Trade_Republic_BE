import sqlite3
from datetime import date
import json

class NewsCache:
    def __init__(self, db_path="news_cache.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialisiert die SQLite-Datenbank mit der benötigten Tabelle."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS news_cache (
                    date TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

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