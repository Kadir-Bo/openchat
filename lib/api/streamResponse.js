/**
 * Streamt eine Antwort vom Backend und gibt nur den generierten Text zurück
 * @param {string} userMessage - Die Nachricht des Users
 * @param {string} selectedModel - Das ausgewählte Modell (optional)
 * @param {function} onChunk - Callback für jeden empfangenen Chunk (optional)
 * @returns {Promise<string>} - Die vollständige Antwort
 */
export const streamResponse = async (
  userMessage,
  selectedModel = "openai/gpt-oss-120b",
  onChunk = null,
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

    // Stream lesen
    let fullResponse = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const content = data.content || "";

          if (content) {
            fullResponse += content;

            // Optional: Callback für jeden Chunk (für Live-Updates in UI)
            if (onChunk && typeof onChunk === "function") {
              onChunk(content, fullResponse);
            }
          }
        } catch (parseError) {
          // Ignoriere Parse-Fehler für ungültige JSON-Zeilen
          console.warn("Chunk konnte nicht geparst werden:", line);
        }
      }
    }

    // Validierung der Antwort
    if (!fullResponse.trim()) {
      throw new Error("Leere Antwort vom Server erhalten");
    }

    return fullResponse;
  } catch (error) {
    console.error("Streaming-Fehler:", error.message);
    throw error;
  }
};
