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

    // Call NVIDIA NIM API
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
        stream: true, // Enable streaming
        reasoning_effort: reasoning_effort,
      }),
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
        try {
          const reader = response.body.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send done signal
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              // NVIDIA API sends SSE format: "data: {...}"
              if (line.startsWith("data: ")) {
                const data = line.slice(6); // Remove "data: " prefix

                // Skip [DONE] from NVIDIA
                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";

                  if (content) {
                    // Send as our format
                    const formatted = `data: ${JSON.stringify({ content })}\n\n`;
                    controller.enqueue(encoder.encode(formatted));
                  }
                } catch (parseError) {
                  console.error("Parse error:", parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
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
