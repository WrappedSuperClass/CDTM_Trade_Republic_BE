#!/usr/bin/env python3
"""banking_balance.py
Simuliert den Kontostand über Zeit basierend auf Kontoauszugsdaten.

Usage
-----
python banking_balance.py <USER_ID> [CSV_PATH]

Die Funktion `get_balance_over_time()` kann auch direkt importiert und
aufgerufen werden.

Dependencies: pandas >=1.5
"""

import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd
import numpy as np


DEFAULT_CSV = "banking_sample_data.csv"


def _load(csv_path: str) -> pd.DataFrame:
    """Liest die Banking-Daten und fügt Hilfsspalten hinzu."""
    print(f"Lade CSV von: {csv_path}")
    df = pd.read_csv(csv_path, parse_dates=["bookingDate"])
    if df.empty:
        raise ValueError(f"Keine Daten in {csv_path} gefunden")
    
    # Konvertiere Beträge basierend auf der Transaktionsseite
    df["signed_amount"] = df.apply(
        lambda row: row["amount"] if row["side"] == "CREDIT" else -row["amount"],
        axis=1
    )
    
    # Füge zusätzliche Zeitinformationen hinzu
    df["date"] = df["bookingDate"].dt.date
    df["month"] = df["bookingDate"].dt.to_period("M")
    
    print(f"{len(df)} Transaktionen geladen")
    return df


def _calculate_statistics(df_user: pd.DataFrame) -> Dict[str, Any]:
    """Berechnet Statistiken für die Transaktionen eines Benutzers."""
    stats = {
        "gesamt": {
            "einnahmen": float(df_user[df_user["side"] == "CREDIT"]["amount"].sum()),
            "ausgaben": float(df_user[df_user["side"] == "DEBIT"]["amount"].sum()),
            "anzahl_transaktionen": len(df_user),
            "durchschnittlicher_kontostand": float(df_user["balance"].mean()),
            "maximaler_kontostand": float(df_user["balance"].max()),
            "minimaler_kontostand": float(df_user["balance"].min()),
            "aktueller_kontostand": float(df_user["balance"].iloc[-1]) if not df_user.empty else 0.0
        },
        "nach_typ": {}
    }
    
    # Statistiken nach Transaktionstyp
    for typ in df_user["type"].unique():
        typ_df = df_user[df_user["type"] == typ]
        stats["nach_typ"][typ] = {
            "anzahl": len(typ_df),
            "gesamt_einnahmen": float(typ_df[typ_df["side"] == "CREDIT"]["amount"].sum()),
            "gesamt_ausgaben": float(typ_df[typ_df["side"] == "DEBIT"]["amount"].sum()),
            "durchschnittlicher_betrag": float(typ_df["amount"].mean())
        }
    
    # Monatliche Statistiken
    monthly_stats = df_user.groupby("month").agg({
        "signed_amount": ["sum", "count"],
        "balance": ["mean", "min", "max"]
    }).round(2)
    
    stats["monatlich"] = {
        str(month): {
            "netto_änderung": float(data[("signed_amount", "sum")]),
            "anzahl_transaktionen": int(data[("signed_amount", "count")]),
            "durchschnittlicher_kontostand": float(data[("balance", "mean")]),
            "minimaler_kontostand": float(data[("balance", "min")]),
            "maximaler_kontostand": float(data[("balance", "max")])
        }
        for month, data in monthly_stats.iterrows()
    }
    
    return stats


def get_balance_over_time(user_id: str="00909ba7-ad01-42f1-9074-2773c7d3cf2c", csv_path: str = DEFAULT_CSV) -> Dict[str, Any]:
    """Berechnet den Kontostand über Zeit für einen Benutzer.
    
    Returns:
        Dict: Dictionary mit Kontostand-Verlauf und Statistiken
        {
            "transaktionen": [
                {
                    "timestamp": "2024-06-03T10:00:00",
                    "balance": 1234.56,
                    "transaction": {
                        "amount": 100.00,
                        "type": "PAYIN",
                        "side": "CREDIT",
                        "currency": "EUR"
                    }
                },
                ...
            ],
            "statistiken": {
                "gesamt": {...},
                "nach_typ": {...},
                "monatlich": {...}
            }
        }
    """
    df = _load(csv_path)
    
    if user_id not in df["userId"].unique():
        raise ValueError(f"Benutzer '{user_id}' nicht in {csv_path} gefunden")
    
    # Filtere nach Benutzer und sortiere nach Datum
    df_user = (
        df[df["userId"] == user_id]
        .sort_values("bookingDate")
        .reset_index(drop=True)
    )
    
    # Berechne den kumulativen Kontostand
    df_user["balance"] = df_user["signed_amount"].cumsum()
    
    # Formatiere die Transaktionen
    transactions = []
    for _, row in df_user.iterrows():
        transactions.append({
            "timestamp": row["bookingDate"].isoformat(),
            "balance": round(row["balance"], 2),
            "transaction": {
                "amount": round(row["amount"], 2),
                "type": row["type"],
                "side": row["side"],
                "currency": row["currency"]
            }
        })
    
    # Berechne Statistiken
    statistics = _calculate_statistics(df_user)
    
    return {
        "transaktionen": transactions,
        "statistiken": statistics
    }


if __name__ == "__main__":
    print("Skript gestartet")
    if len(sys.argv) < 2:
        sys.exit("Verwendung: python banking_balance.py <USER_ID> [CSV_PATH]")
    
    user_id = sys.argv[1]
    csv_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_CSV
    
    print(f"Verarbeite user_id: {user_id}")
    print(f"Verwende CSV-Pfad: {csv_path}")
    
    try:
        result = get_balance_over_time(user_id, csv_path)
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Fehler aufgetreten: {str(e)}")
        raise 