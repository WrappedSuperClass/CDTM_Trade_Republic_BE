# Trade Republic Backend

> ⚠️ **IMPORTANT: This application is optimized for Google Chrome. For the best experience, please use Chrome as your browser.**

A modern web application that provides financial data analysis and insights, built with FastAPI and Next.js.

## Project Structure

The project is divided into two main parts:

### Backend (`app/backend/`)
- Built with FastAPI
- Provides various financial data endpoints
- Features:
  - Stock data retrieval and analysis
  - News caching system
  - Trading insights
  - Transaction analysis
  - Integration with Yahoo Finance API

### Frontend (`app/client/`)
- Built with Next.js 15
- Modern UI using Tailwind CSS and Radix UI components
- Features:
  - Interactive stock charts
  - Real-time data visualization
  - Responsive design
  - Dark mode support

## Features

- Stock market data analysis
- Real-time stock price tracking
- News aggregation and caching
- Trading insights and analytics
- Transaction history analysis
- Beautiful and responsive UI
- Dark mode support

## Tech Stack

### Backend
- FastAPI
- Python
- SQLite (for news caching)
- Yahoo Finance API
- Perplexity AI integration

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- Recharts for data visualization
- MUI Joy components

## Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd app/backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd app/client
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## API Endpoints

- `/getTopMovers` - Get top moving stocks
- `/stock-movement` - Get stock movement analysis
- `/stock-data` - Get detailed stock data
- `/trading-wrapped` - Get trading insights
- `/getSubscriptionStories` - Get news stories for subscribed stocks
- `/transaction-insights` - Get transaction analysis

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.