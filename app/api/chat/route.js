import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  try {
    const {
      message,
      model = "openai/gpt-oss-120b",
      reasoning_effort = "medium",
    } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // NVIDIA NIM API Endpoint
    const NVIDIA_API_URL =
      "https://integrate.api.nvidia.com/v1/chat/completions";
    const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "NVIDIA API key not configured" },
        { status: 500 },
      );
    }

    // Call NVIDIA NIM API with abort signal
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: true,
        reasoning_effort: reasoning_effort,
      }),
      signal: req.signal, // Pass the request's abort signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("NVIDIA API Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "API request failed" },
        { status: response.status },
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        let reader = null;

        // Helper to safely enqueue data
        const safeEnqueue = (data) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch (e) {
              if (e.message?.includes("Controller is already closed")) {
                isClosed = true;
              } else {
                throw e;
              }
            }
          }
        };

        // Helper to safely close
        const safeClose = () => {
          if (!isClosed) {
            try {
              controller.close();
              isClosed = true;
            } catch (e) {
              // Already closed
              isClosed = true;
            }
          }
        };

        // Listen for client disconnect
        req.signal?.addEventListener("abort", () => {
          isClosed = true;
          if (reader) {
            reader.cancel().catch(() => {});
          }
          safeClose();
        });

        try {
          reader = response.body.getReader();

          while (true) {
            // Check if closed before reading
            if (isClosed) {
              break;
            }

            const { done, value } = await reader.read();

            if (done) {
              safeEnqueue(encoder.encode("data: [DONE]\n\n"));
              safeClose();
              break;
            }

            // Check again after async operation
            if (isClosed) {
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (isClosed) break;

              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";

                  if (content) {
                    const formatted = `data: ${JSON.stringify({ content })}\n\n`;
                    safeEnqueue(encoder.encode(formatted));
                  }
                } catch (parseError) {
                  console.warn("Parse error:", parseError);
                }
              }
            }
          }
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Stream aborted by client");
          } else {
            console.error("Stream error:", error);
            if (!isClosed) {
              safeEnqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: error.message })}\n\n`,
                ),
              );
            }
          }
        } finally {
          safeClose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
