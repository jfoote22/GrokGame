"use client";

import { useState } from 'react';

interface ModelDebugInfoProps {
  modelUrl: string;
  modelId?: string;
  error?: string;
}

export default function ModelDebugInfo({ modelUrl, modelId, error }: ModelDebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testModelUrl = async () => {
    if (!modelUrl) {
      setTestResult("No model URL to test");
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Try to fetch the URL as a HEAD request
      const response = await fetch(modelUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // This helps test URLs from different origins
      });
      
      setTestResult(`Resource appears to be available. Status: ${response.status}`);
    } catch (error) {
      setTestResult(`Error accessing URL: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-blue-400">3D Model Diagnostics</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div className="p-2 bg-gray-900 rounded">
            <p className="text-xs text-gray-400 mb-1">Model URL:</p>
            <p className="text-xs text-gray-200 break-all">{modelUrl || "No URL available"}</p>
          </div>

          {modelId && (
            <div className="p-2 bg-gray-900 rounded">
              <p className="text-xs text-gray-400 mb-1">Replicate Model ID:</p>
              <p className="text-xs text-gray-200">{modelId}</p>
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-900/30 rounded">
              <p className="text-xs text-gray-400 mb-1">Error:</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={testModelUrl}
              disabled={isLoading || !modelUrl}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test URL Access'}
            </button>
            <a
              href={modelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 ${!modelUrl ? 'opacity-50 pointer-events-none' : ''}`}
            >
              Open in New Tab
            </a>
          </div>

          {testResult && (
            <div className="p-2 bg-gray-900 rounded">
              <p className="text-xs text-gray-400 mb-1">Test Result:</p>
              <p className="text-xs text-gray-200">{testResult}</p>
            </div>
          )}

          <div className="p-2 bg-gray-900 rounded">
            <p className="text-xs text-gray-400 mb-1">Troubleshooting Steps:</p>
            <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1 ml-2">
              <li>Verify the model URL is a valid GLB file that ends with .glb</li>
              <li>Check if the URL is accessible by opening it in a new tab</li>
              <li>Ensure the Replicate API token is set correctly in the .env.local file</li>
              <li>Try generating a new 3D model with a clearer image</li>
              <li>Check browser console for CORS errors or other network issues</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 