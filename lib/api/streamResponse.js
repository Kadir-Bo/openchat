/**
 * Optimierte Stream-Response mit zeit-basiertem Buffering
 * @param {number} updateInterval - 50ms = flüssig, 100ms = performant, 30ms = sehr flüssig
 */
export const streamResponse = async (
  userMessage,
  selectedModel = "openai/gpt-oss-120b",
  onChunk = null,
  reasoning = false,
  updateInterval = 50, // 20 FPS - sweet spot für Text-Streaming
) => {
  try {
    // Validierung
    if (!userMessage?.trim()) {
      throw new Error("Nachricht darf nicht leer sein");
    }

    // API Request
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        model: selectedModel,
        reasoning_effort: reasoning ? "high" : "medium",
      }),
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

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Sende letzten Buffer
        sendBufferedUpdate();
        break;
      }

      // Decode chunk und füge zu buffer hinzu
      buffer += decoder.decode(value, { stream: true });

      // Split by double newlines (SSE format)
      const messages = buffer.split("\n\n");

      // Keep last incomplete message in buffer
      buffer = messages.pop() || "";

      for (const message of messages) {
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

                // Sende Update wenn genug Zeit vergangen ist
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
    console.error("❌ Streaming-Fehler:", error.message);
    throw error;
  }
};
