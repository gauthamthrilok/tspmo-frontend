import { useState, useRef, useEffect } from "react";

export default function BotConversation() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Greetings twin! How can I rizz you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message immediately
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("https://tspmo-backend.onrender.com/api/brainrot-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // incomplete part

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const dataStr = part.slice(6).trim();

            // SSE can send empty lines or comments, ignore those
            if (!dataStr) continue;

            // Handle special events: "end" and "error"
            if (part.startsWith("event: end")) {
              setIsStreaming(false);
              abortControllerRef.current = null;
              return; // streaming finished
            }

            try {
              const data = JSON.parse(dataStr);
              // Append new message incrementally
              setMessages((msgs) => [
                ...msgs,
                {
                  role: data.model === "A" ? "assistant" : "user",
                  content: data.text,
                },
              ]);
            } catch {
              // ignore JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Streaming aborted by user");
      } else {
        setMessages((msgs) => [
          ...msgs,
          { role: "assistant", content: `Error: ${err.message}` },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setInput("");
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Header */}
      <header className="py-4 px-6 bg-gray-950 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f916.svg"
            alt="Bot"
            className="w-8 h-8"
          />
          <span className="text-xl font-bold text-white tracking-wide">TS PMO</span>
        </div>
        <span className="text-xs text-gray-400">Powered by skibidi rizzler</span>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative px-5 py-3 rounded-2xl shadow-md max-w-[80%] break-words ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="absolute -left-10 top-1/2 -translate-y-1/2">
                    <img
                      src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f916.svg"
                      alt="Bot"
                      className="w-6 h-6"
                    />
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="bg-gray-950 px-6 py-4 border-t border-gray-800 flex items-center gap-2"
      >
        <input
          type="text"
          className="flex-1 border-none rounded-xl px-5 py-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Type your message..."
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming} // disable typing while streaming
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-red-700 transition flex items-center gap-2"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2"
            disabled={!input.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Send
          </button>
        )}
      </form>
    </div>
  );
}
