import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Replicate API token is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        // Use a standard SDXL model that's publicly available
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
          prompt: prompt,
          negative_prompt: "low quality, bad anatomy, blurry, pixelated, disfigured",
          width: 768,
          height: 768,
          num_outputs: 1,
          num_inference_steps: 25,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Replicate API error:", error);
      return NextResponse.json(
        { error: error.detail || "Error generating image" },
        { status: response.status }
      );
    }

    const prediction = await response.json();
    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
