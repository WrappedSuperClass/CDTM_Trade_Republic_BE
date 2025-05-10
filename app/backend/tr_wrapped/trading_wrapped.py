#!/usr/bin/env python3
"""trading_wrapped.py
Generate a list of 13 "Spotify Wrapped‑style" insights for a single user.

Usage
-----
python trading_wrapped.py <USER_ID> [CSV_PATH]

If *CSV_PATH* is omitted the script looks for *trading_sample_data.csv*
in the current working directory.

The function `get_trading_wrapped_points()` can also be imported and
called directly from your own code.

Dependencies: pandas >=1.5, numpy
"""

import sys
import datetime as dt
from functools import lru_cache
from typing import List

import numpy as np
import pandas as pd


DEFAULT_CSV = "trading_sample_data.csv"


def _load(csv_path: str) -> pd.DataFrame:
    """Read raw trade data and add helper columns."""
    print(f"Loading CSV from: {csv_path}")  # Debug print
    df = pd.read_csv(csv_path, parse_dates=["executedAt"])
    if df.empty:
        raise ValueError(f"No rows found in {csv_path}")
    df["trade_value"] = df["executionSize"] * df["executionPrice"]
    df["is_buy"] = df["direction"].str.upper() == "BUY"
    print(f"Loaded {len(df)} rows")  # Debug print
    return df


@lru_cache(maxsize=1)
def _aggregate(csv_path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (aggregated_per_user, full_dataframe) with caching."""
    df = _load(csv_path)

    def user_aggs(g: pd.DataFrame) -> pd.Series:
        out: dict[str, object] = {}
        out["first_trade"] = g["executedAt"].min()
        out["total_trades"] = len(g)
        out["volume"] = g["trade_value"].sum()
        out["largest_trade"] = g["trade_value"].max()
        out["distinct_countries"] = g["ISIN"].str.slice(0, 2).nunique()

        # longest streak of consecutive trading days
        days = (
            pd.to_datetime(g["executedAt"]).dt.normalize().drop_duplicates().sort_values()
        )
        longest = cur = 1
        if days.empty:
            longest = 0
        else:
            for prev, curr in zip(days[:-1], days[1:]):
                if (curr - prev).days == 1:
                    cur += 1
                else:
                    longest = max(longest, cur)
                    cur = 1
            longest = max(longest, cur)
        out["longest_streak"] = longest
        return pd.Series(out)

    agg_df = df.groupby("userId").apply(user_aggs)
    return agg_df, df


def _percentile(series: pd.Series, value: float) -> float:
    """Return percentile rank of *value* within *series* (0‑100)."""
    return float((series < value).mean() * 100)


def get_trading_wrapped_points(
    user_id: str, csv_path: str = DEFAULT_CSV
) -> List[str]:
    """Return 13 insight strings for *user_id* from *csv_path*."""
    agg_df, df = _aggregate(csv_path)

    if user_id not in agg_df.index:
        raise ValueError(f"User '{user_id}' not found in {csv_path}")

    df_user = (
        df[df["userId"] == user_id].copy().sort_values("executedAt").reset_index(drop=True)
    )
    metrics = agg_df.loc[user_id]

    def pct(s, v):
        return _percentile(s, v)

    points: list[str] = []

    # 1 — Opening trade
    first = df_user.iloc[0]
    earlier_pct = pct(agg_df["first_trade"], first["executedAt"])
    points.append(
        f"Opened the year on {first['executedAt']:%d %b %Y at %H:%M} "
        f"with a {first['direction'].lower()} of {first['ISIN']} worth "
        f"€{first['trade_value']:,.0f} – earlier than {earlier_pct:.0f}% of traders."
    )

    # 2 — Year in numbers
    total_trades = int(metrics["total_trades"])
    volume = metrics["volume"]
    fees = df_user["executionFee"].sum()
    points.append(
        f"{total_trades} trades, moving €{volume:,.0f} and paying €{fees:,.2f} in fees – "
        f"top {100 - pct(agg_df['total_trades'], total_trades):.0f}% for activity."
    )

    # 3 — Trading rhythm
    df_user["month"] = df_user["executedAt"].dt.month
    month_counts = df_user["month"].value_counts()
    best_month = int(month_counts.idxmax())
    best_count = int(month_counts.max())
    points.append(
        f"Most active in {dt.date(1900, best_month, 1):%B}: {best_count} trades that month."
    )

    # 4 — Top 5 securities
    top_isins = (
        df_user.groupby("ISIN")["trade_value"].sum().sort_values(ascending=False).head(5)
    )
    points.append(
        "Top 5 tickets by volume: " + ", ".join(top_isins.index.tolist()) + "."
    )

    # 5 — World tour
    country_div = int(metrics["distinct_countries"])
    div_pct = pct(agg_df["distinct_countries"], country_div)
    points.append(
        f"Traded across {country_div} countries – more global than {div_pct:.0f}% of the community."
    )

    # 6 — Mega trade
    largest_row = df_user.loc[df_user["trade_value"].idxmax()]
    largest_val = largest_row["trade_value"]
    largest_pct = pct(agg_df["largest_trade"], largest_val)
    points.append(
        f"Largest single order: €{largest_val:,.0f} on {largest_row['ISIN']} – "
        f"bigger than {largest_pct:.0f}% of all trades."
    )

    # 7 — Buy vs Sell mood
    buy_ratio = df_user["is_buy"].mean()
    points.append(f"{buy_ratio:.0%} of your orders were buys.")

    # 8 — Early bird / Night owl
    early = int((df_user["executedAt"].dt.hour < 9).sum())
    late = int((df_user["executedAt"].dt.hour >= 18).sum())
    total = len(df_user)
    early_ratio, late_ratio = early / total, late / total
    if early_ratio > 0.4:
        timing = "early‑bird"
    elif late_ratio > 0.4:
        timing = "night‑owl"
    else:
        timing = "prime‑time"
    points.append(
        f"You're a {timing}: {early} pre‑market and {late} after‑hours trades."
    )

    # 9 — Streaks & gaps
    points.append(
        f"Longest trading streak: {int(metrics['longest_streak'])} consecutive days."
    )

    # 10 — Bonus bonanza
    bonus_trades = int((df_user["type"] == "BONUS").sum())
    avg_reg_fee = df_user.loc[df_user["type"] == "REGULAR", "executionFee"].mean() or 0
    saved = bonus_trades * avg_reg_fee
    points.append(
        f"{bonus_trades} zero‑fee BONUS trades saved roughly €{saved:,.2f}."
    )

    # 11 — Record‑day cameo
    daily_counts = df.groupby(df["executedAt"].dt.date).size()
    record_day = daily_counts.idxmax()
    traded_record = (df_user["executedAt"].dt.date == record_day).any()
    cameo = (
        f"You joined the action on the busiest day ({record_day})!"
        if traded_record
        else f"You sat out the platform's busiest day ({record_day})."
    )
    points.append(cameo)

    # 12 — Persona
    personas = []
    if country_div >= agg_df["distinct_countries"].quantile(0.9):
        personas.append("🌍 Globetrotter")
    if volume >= agg_df["volume"].quantile(0.9):
        personas.append("🐳 Whale")
    if total_trades >= agg_df["total_trades"].quantile(0.9):
        personas.append("⚡ Day‑tripper")
    largest_val = metrics["largest_trade"]
    if total_trades <= agg_df["total_trades"].quantile(0.25) and largest_val >= agg_df[
        "largest_trade"
    ].quantile(0.75):
        personas.append("🎯 Sniper")
    persona = personas[0] if personas else "📈 Explorer"
    points.append(f"Your 2024 persona: {persona}.")

    # 13 — Looking ahead
    buys = df_user[df_user["is_buy"]]["trade_value"].sum()
    sells = df_user[~df_user["is_buy"]]["trade_value"].sum()
    net_flow = buys - sells
    direction = "inflow" if net_flow >= 0 else "outflow"
    points.append(
        f"Net {direction} of €{abs(net_flow):,.0f} – time to set a fresh goal for 2025!"
    )

    return points


if __name__ == "__main__":
    print("Script started")  # Debug print
    if len(sys.argv) < 2:
        sys.exit("Usage: python trading_wrapped.py <USER_ID> [CSV_PATH]")
    user_id = sys.argv[1]
    csv_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_CSV
    print(f"Processing user_id: {user_id}")  # Debug print
    print(f"Using CSV path: {csv_path}")  # Debug print
    try:
        wrapped_points = get_trading_wrapped_points(user_id, csv_path)
        # Output as a JSON‑style array for easy consumption by other tools
        import json
        print(json.dumps(wrapped_points, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Debug print
        raise
