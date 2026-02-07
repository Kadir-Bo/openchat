export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get API key - try multiple ways in case env loading is weird
    const apiKey = process.env.NVIDIA_API_KEY || process.env["NVIDIA_API_KEY"];

    if (!apiKey) {
      console.error(
        "API Key missing. Environment vars:",
        Object.keys(process.env).filter((k) => k.includes("NVIDIA")),
      );
      return new Response(
        JSON.stringify({
          error: "API key not configured. Add NVIDIA_API_KEY to .env.local",
          envKeys: Object.keys(process.env).filter((k) => k.includes("KEY")),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Make direct fetch call to NVIDIA instead of using OpenAI SDK
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: message }],
          temperature: 1,
          top_p: 1,
          max_tokens: 4096,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API Error:", response.status, errorText);

      return new Response(
        JSON.stringify({
          error: `NVIDIA API Error: ${response.status}`,
          details: errorText.substring(0, 200),
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices?.[0]?.delta?.content || "";

                  if (content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        JSON.stringify({ content }) + "\n",
                      ),
                    );
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
