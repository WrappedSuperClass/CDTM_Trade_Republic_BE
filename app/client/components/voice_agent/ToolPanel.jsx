import { useEffect, useState } from "react";

const functionDescription = `
Call this function when a user asks for a color palette.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
      {
        type: "function",
        name: "console_print",
        description: "Print a message to the console when the user asks to print something.",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            message: {
              type: "string",
              description: "The message to print to the console",
            }
          },
          required: ["message"]
        }
      },
      {
        type: "function",
        name: "follow_stock",
        description: "Follow a stock when the user asks to follow or track a specific stock.",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            ticker: {
              type: "string",
              description: "The stock ticker symbol to follow (e.g., AAPL, MSFT, TSLA)",
            }
          },
          required: ["ticker"]
        }
      },
      {
        type: "function",
        name: "get_stock_movement",
        description: "Get historical stock movement data explaining why a stock rose or fell during a specific timeframe",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            ticker: {
              type: "string",
              description: "The stock ticker symbol or name",
            },
            timeframe: {
              type: "string",
              description: "The historical timeframe to check (e.g., 'January 2023', 'Q2 2022')",
            }
          },
          required: ["ticker", "timeframe"]
        }
      }
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  const colorBoxes = colors.map((color) => (
    <div
      key={color}
      className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
      style={{ backgroundColor: color }}
    >
      <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
        {color}
      </p>
    </div>
  ));

  return (
    <div className="flex flex-col gap-2">
      <p>Theme: {theme}</p>
      {colorBoxes}
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}

function StockMovementOutput({ data }) {
  const { timeframe, stock } = data;
  const { symbol, movements } = stock;
  
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">{symbol} Historical Movements - {timeframe}</p>
      
      {movements.map((movement, index) => (
        <div key={index} className="bg-gray-100 rounded-md p-3 mt-2">
          <p className="font-semibold">
            {movement.date}
            {movement.percentChange !== 0 && (
              <span className={movement.direction === "up" ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                {movement.direction === "up" ? "+" : ""}{movement.percentChange}%
              </span>
            )}
          </p>
          <p className="mt-1 text-sm">{movement.story}</p>
          {movement.sources && movement.sources.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Sources:</p>
              <ul className="text-xs text-blue-500">
                {movement.sources.map((source, i) => (
                  <li key={i} className="truncate">
                    <a href={source} target="_blank" rel="noopener noreferrer">{source}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);
  const [stockMovementData, setStockMovementData] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
    console.log("First event:", firstEvent);
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call") {
          if (output.name === "display_color_palette") {
            setFunctionCallOutput(output);
            setTimeout(() => {
              sendClientEvent({
                type: "response.create",
                response: {
                  instructions: `
                  ask for feedback about the color palette - don't repeat 
                  the colors, just ask if they like the colors.
                `,
                },
              });
            }, 500);
          } else if (output.name === "console_print") {
            const { message } = JSON.parse(output.arguments);
            console.log("Voice Agent says:", message);
            setTimeout(() => {
              sendClientEvent({
                type: "response.create",
                response: {
                  instructions: "Ask if they want to print something else.",
                },
              });
            }, 500);
          } else if (output.name === "follow_stock") {
            const { ticker } = JSON.parse(output.arguments);
            window.fetchAndAddStock(ticker);
            setTimeout(() => {
              sendClientEvent({
                type: "response.create",
                response: {
                  instructions: "Confirm that you've added the stock to their following list.",
                },
              });
            }, 500);
          } else if (output.name === "get_stock_movement") {
            const { ticker, timeframe } = JSON.parse(output.arguments);
            
            // First, acknowledge that we're fetching the data
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: "I'll fetch the historical stock data for you. This may take a moment.",
              },
            });
            
            fetch("http://localhost:8000/stock-movement", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ticker, timeframe }),
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(data => {
                console.log("Stock movement data:", data);
                setStockMovementData(data);
                
                // Find the movement with the highest absolute percentChange for the summary
                const significantMovement = data.stock.movements
                  .filter(m => m.percentChange !== 0)
                  .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))[0];
                
                setTimeout(() => {
                  sendClientEvent({
                    type: "response.create",
                    response: {
                      instructions: significantMovement 
                        ? `Briefly summarize that ${data.stock.symbol} ${significantMovement.direction === "up" ? 'rose' : 'fell'} ${Math.abs(significantMovement.percentChange)}% on ${significantMovement.date} during ${data.timeframe}. The main reason was: ${significantMovement.story.split('.')[0]}.`
                        : `Briefly summarize the historical movements of ${data.stock.symbol} during ${data.timeframe}, noting very briefly the key events that affected the stock price.`,
                    },
                  });
                }, 500);
              })
              .catch(error => {
                console.error("Error fetching stock movement:", error);
                setTimeout(() => {
                  sendClientEvent({
                    type: "response.create",
                    response: {
                      instructions: "Apologize for not being able to fetch stock movement data. Ask if they'd like to try again with a different stock or timeframe.",
                    },
                  });
                }, 500);
              });
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
      setStockMovementData(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Tools</h2>
        {isSessionActive ? (
          <>
            {functionCallOutput && (
              <div className="mt-4">
                <h3 className="font-semibold">Color Palette Tool</h3>
                <FunctionCallOutput functionCallOutput={functionCallOutput} />
              </div>
            )}
            {stockMovementData && (
              <div className="mt-4">
                <h3 className="font-semibold">Historical Stock Analysis</h3>
                <StockMovementOutput data={stockMovementData} />
              </div>
            )}
            {!functionCallOutput && !stockMovementData && (
              <p>Ask for a color palette or historical stock movement analysis...</p>
            )}
          </>
        ) : (
          <p>Start the session to use these tools...</p>
        )}
      </div>
    </section>
  );
}
