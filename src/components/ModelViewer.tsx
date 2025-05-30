"use client";

import { useEffect, useRef, useState } from 'react';

type ModelViewerProps = {
  glbUrl: string;
  alt?: string;
  poster?: string;
  height?: string; // Optional height parameter
};

// Add custom type for model-viewer element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src: string;
        alt: string;
        poster?: string;
        'camera-controls'?: string;
        'auto-rotate'?: string;
        'touch-action'?: string;
        'shadow-intensity'?: string;
        'environment-image'?: string;
      }, HTMLElement>;
    }
  }
}

export default function ModelViewer({ glbUrl, alt = "3D Model", poster, height = "400px" }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading 3D model...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Verify and clean the URL
  const cleanUrl = (url: string) => {
    // Check if the URL is empty or undefined
    if (!url) {
      console.error("Model URL is empty or undefined");
      setErrorDetails("No model URL provided");
      return "";
    }
    
    // Check if the URL contains a path to a model file (mesh, glb, etc.)
    if (typeof url === 'string') {
      console.log("Processing URL for model-viewer:", url);
      
      // Handle edge case: URL might be a Replicate prediction ID instead of an actual model URL
      if (url.match(/^[a-z0-9]{20,}$/)) {
        console.error("URL appears to be a Replicate ID rather than an actual model URL:", url);
        setErrorDetails(`Invalid model URL format: ${url} (appears to be an ID)`);
        return url; // Return as is, will likely fail but helps diagnose the issue
      }
      
      // Basic URL validation
      try {
        new URL(url); // Will throw if URL is invalid
      } catch (e) {
        console.error("Invalid URL format:", url, e);
        setErrorDetails(`Invalid URL format: ${url}`);
        return url; // Return as is to show the error in the UI
      }
      
      // Sometimes the URL comes with /mesh.glb at the end for specific models
      if (url.includes('/mesh.glb') || url.endsWith('.glb') || url.includes('.glb?')) {
        console.log("URL appears to be a GLB file already:", url);
        return url;
      }
      
      // Handle URLs that end with /mesh
      if (url.endsWith('/mesh')) {
        console.log("URL ends with /mesh, appending .glb extension");
        return `${url}.glb`;
      }
      
      // Check if this is a Replicate URL that contains modelUrl=https://..../mesh
      if (url.includes('replicate.delivery') && url.includes('/mesh')) {
        // The URL might be something like https://replicate.delivery/.../.../mesh
        console.log("Detected Replicate URL with /mesh path");
        if (!url.endsWith('.glb')) {
          console.log("Adding .glb extension to /mesh URL");
          return `${url}.glb`;
        }
      }
      
      // Some Replicate models return URLs that need the /mesh.glb appended
      if (url.includes('replicate.delivery') && !url.includes('.glb')) {
        console.log("Replicate URL without .glb extension, using as is:", url);
        return url;
      }
    }
    
    return url;
  };

  // Log props when they change
  useEffect(() => {
    const id = Math.random().toString(36).substring(2, 9); // Generate a unique ID for this instance
    console.log(`ModelViewer (${id}) received props:`, { glbUrl, alt, poster, height });
    setIsLoaded(false);
    setHasError(false);
    setErrorDetails(null);
    setLoadingMessage("Loading 3D model...");
    
    return () => {
      console.log(`ModelViewer (${id}) unmounting`);
    };
  }, [glbUrl, alt, poster, height]);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    
    if (typeof window !== 'undefined') {
      // Check if the script is already loaded
      if (!document.querySelector('script[src*="model-viewer"]')) {
        console.log('Loading model-viewer script...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@google/model-viewer@3.0.1/dist/model-viewer.min.js';
        script.type = 'module';
        document.head.appendChild(script);
        scriptElement = script;

        script.onload = () => {
          console.log('model-viewer script loaded successfully');
          // Re-render model-viewer element after script loads
          if (containerRef.current && glbUrl) {
            createModelViewer();
          }
        };
        
        script.onerror = (error) => {
          console.error('Error loading model-viewer script:', error);
          setHasError(true);
          setLoadingMessage("Error loading 3D viewer component");
        };
      } else {
        console.log('model-viewer script already loaded');
        // If script is already loaded, create the model viewer immediately
        if (containerRef.current && glbUrl) {
          setTimeout(createModelViewer, 50); // Small delay to ensure DOM is ready
        }
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't remove the script on unmount since it might be used by other instances
      // Instead, just clean up the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Create model viewer element
  const createModelViewer = () => {
    if (!containerRef.current) {
      console.error("Container ref is null");
      setErrorDetails("Container initialization failed");
      return;
    }
    
    if (!glbUrl) {
      console.error("No GLB URL provided");
      setHasError(true);
      setErrorDetails("No 3D model URL provided");
      setLoadingMessage("Missing model URL");
      return;
    }
    
    try {
      const processedUrl = cleanUrl(glbUrl);
      console.log('Creating model-viewer element with processed URL:', processedUrl);
      
      if (!processedUrl) {
        setHasError(true);
        setLoadingMessage("Invalid model URL");
        return;
      }
      
      // Create the model-viewer element
      const modelViewer = document.createElement('model-viewer') as HTMLElement & {
        src: string;
        alt: string;
      };
      
      modelViewer.src = processedUrl;
      modelViewer.alt = alt;
      modelViewer.setAttribute('camera-controls', '');
      modelViewer.setAttribute('auto-rotate', '');
      modelViewer.setAttribute('touch-action', 'pan-y');
      modelViewer.setAttribute('shadow-intensity', '1');
      modelViewer.setAttribute('environment-image', 'neutral');
      modelViewer.style.width = '100%';
      modelViewer.style.height = height;
      modelViewer.style.backgroundColor = '#222';
      modelViewer.style.borderRadius = '8px';
      
      if (poster) {
        modelViewer.setAttribute('poster', poster);
      }

      console.log('model-viewer element created with attributes:', {
        src: modelViewer.src,
        alt: modelViewer.alt,
        poster: poster ? 'yes' : 'no',
        height: height
      });

      // Clear and append the model viewer
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(modelViewer);
      
      console.log('model-viewer element appended to container');

      // Add event listeners to catch loading events/errors
      modelViewer.addEventListener('load', () => {
        console.log('model-viewer loaded 3D model successfully');
        setIsLoaded(true);
        setLoadingMessage("");
      });
      
      modelViewer.addEventListener('error', (event) => {
        console.error('model-viewer error loading 3D model:', event);
        setHasError(true);
        setErrorDetails(`Failed to load 3D model: ${processedUrl}`);
        setLoadingMessage("Error loading 3D model");
        
        // Try to fetch the URL to see if it's accessible
        fetch(processedUrl, { method: 'HEAD', mode: 'no-cors' })
          .then(response => {
            console.log("Resource exists, response:", response);
          })
          .catch(err => {
            console.error("Resource not accessible:", err);
            setErrorDetails(`Model URL not accessible: ${err.message}`);
          });
      });
    } catch (error) {
      console.error('Error creating model-viewer element:', error);
      setHasError(true);
      setErrorDetails(`${error instanceof Error ? error.message : String(error)}`);
      setLoadingMessage("Error creating 3D viewer");
    }
  };

  // Recreate model viewer when props change
  useEffect(() => {
    if (containerRef.current && glbUrl && typeof window !== 'undefined') {
      if (document.querySelector('script[src*="model-viewer"]')) {
        createModelViewer();
      }
    }
  }, [glbUrl, alt, poster, height]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className={`model-viewer-container w-full bg-gray-800 rounded-lg overflow-hidden`} 
        style={{ height }}
      ></div>
      
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-300">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 rounded-lg">
          <div className="text-center p-4 max-w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-400 mb-1">{loadingMessage}</p>
            {errorDetails && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-left max-w-full overflow-x-auto">
                <p className="text-xs text-gray-300 break-all">{errorDetails}</p>
                <p className="text-xs text-gray-400 mt-1">Model URL: <span className="text-gray-300 break-all">{glbUrl || "None"}</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 