import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the image URL from the request body
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }
    
    console.log("[API] Generating 3D model from image:", imageUrl.substring(0, 100) + "...");

    // Check if the Replicate API token is configured
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
      console.error("[API] REPLICATE_API_TOKEN is not configured");
      return NextResponse.json(
        { error: "Replicate API is not properly configured" },
        { status: 500 }
      );
    }

    // Handle different image URL formats
    let processedImageUrl = imageUrl;
    
    // If it's a data URL (base64), use it directly - Replicate accepts data URLs
    if (imageUrl.startsWith('data:image/')) {
      processedImageUrl = imageUrl;
      console.log("[API] Using base64 data URL for image");
    } 
    // If it's a blob URL, we can't use it with Replicate
    else if (imageUrl.startsWith('blob:')) {
      console.error("[API] Blob URLs are not supported by Replicate API");
      return NextResponse.json(
        { error: "Blob URLs are not supported. Please upload the image file directly." },
        { status: 400 }
      );
    }
    // If it's a regular URL, encode it properly
    else {
      processedImageUrl = encodeURI(imageUrl);
      console.log("[API] Using regular URL for image");
    }

    console.log("[API] Processed image URL type:", processedImageUrl.substring(0, 20));

    // Create a prediction with Replicate API
    // Using ndreca/hunyuan3d-2 model for 3D generation with textures
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Using the specific version of the ndreca/hunyuan3d-2 model
        version: "4ac0c7d1ef7e7dd58bf92364262597272dea79bfdb158b26027f54eb667f28b8",
        input: {
          image: processedImageUrl,
          // Default parameters for the model - can be customized based on needs
          num_inference_steps: 50,
          guidance_scale: 7.5,
          negative_prompt: "ugly, disfigured, low quality, blurry, nsfw",
          export_triangle_mesh: true,
          texture_size: 1024,
          output_type: "textured_mesh" // Ensuring we get a textured mesh
        },
      }),
    });

    // Log the status code for debugging
    console.log("[API] Replicate API response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("[API] Replicate API error:", error);
      
      // Include more detailed error information
      return NextResponse.json(
        { 
          error: error.detail || "Error generating 3D model",
          status: response.status,
          details: error 
        },
        { status: response.status }
      );
    }

    // Return the prediction data
    const prediction = await response.json();
    console.log("[API] Replicate prediction created, ID:", prediction.id);
    
    return NextResponse.json(prediction);
  } catch (error) {
    console.error("[API] Error generating 3D model:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate 3D model", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 