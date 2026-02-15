/**
 * Optimierte Stream-Response mit Conversation Context
 * @param {Array} messages - Array von message objects: [{role, content}, ...]
 * @param {string} selectedModel - Model name
 * @param {function} onChunk - Callback function for streaming chunks
 * @param {boolean} reasoning - Enable high reasoning effort
 * @param {number} updateInterval - 50ms = flüssig, 100ms = performant
 * @param {AbortSignal} signal - AbortController signal to cancel the request
 */
export const streamResponse = async (
  messages,
  selectedModel = "openai/gpt-oss-120b",
  onChunk = null,
  reasoning = false,
  updateInterval = 50,
  signal = null,
) => {
  try {
    // Validierung
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages array darf nicht leer sein");
    }

    // API Request with signal
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: selectedModel,
        reasoning_effort: reasoning ? "high" : "medium",
      }),
      signal,
    });

    // Response Status Check
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Content-Type Check
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/event-stream")) {
      const text = await response.text();
      throw new Error(
        `Ungültiger Response-Typ: ${contentType}. Response: ${text.substring(0, 200)}`,
      );
    }

    // Stream lesen mit Zeit-basiertem Buffering
    let fullResponse = "";
    let displayBuffer = "";
    let lastUpdateTime = Date.now();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const sendBufferedUpdate = () => {
      if (displayBuffer && onChunk && typeof onChunk === "function") {
        onChunk(displayBuffer, fullResponse);
        displayBuffer = "";
        lastUpdateTime = Date.now();
      }
    };

    // Cleanup function to cancel reader when aborted
    if (signal) {
      signal.addEventListener("abort", () => {
        reader.cancel();
      });
    }

    while (true) {
      // Check if aborted before reading
      if (signal?.aborted) {
        reader.cancel();
        throw new DOMException("Request aborted", "AbortError");
      }

      const { done, value } = await reader.read();

      if (done) {
        sendBufferedUpdate();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const messageChunks = buffer.split("\n\n");
      buffer = messageChunks.pop() || "";

      for (const message of messageChunks) {
        if (!message.trim()) continue;

        const lines = message.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine || trimmedLine.startsWith(":")) {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            const jsonStr = trimmedLine.slice(6);

            if (jsonStr === "[DONE]") {
              continue;
            }

            try {
              const data = JSON.parse(jsonStr);
              const content = data.content || "";

              if (content) {
                fullResponse += content;
                displayBuffer += content;

                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= updateInterval) {
                  sendBufferedUpdate();
                }
              }
            } catch (parseError) {
              console.warn("Chunk parse error:", jsonStr);
            }
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.startsWith("data: ")) {
          const jsonStr = trimmedLine.slice(6);
          if (jsonStr !== "[DONE]") {
            try {
              const data = JSON.parse(jsonStr);
              const content = data.content || "";
              if (content) {
                fullResponse += content;
                displayBuffer += content;
              }
            } catch (parseError) {
              console.warn("Final chunk parse error:", jsonStr);
            }
          }
        }
      }

      sendBufferedUpdate();
    }

    // Validierung der Antwort
    if (!fullResponse.trim()) {
      throw new Error("Leere Antwort vom Server erhalten");
    }

    return fullResponse;
  } catch (error) {
    // Re-throw abort errors as-is
    if (error.name === "AbortError") {
      throw error;
    }
    console.error("❌ Streaming-Fehler:", error.message);
    throw error;
  }
};
