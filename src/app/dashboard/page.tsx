"use client";

import { useState, useEffect } from "react";
import { Coupon } from "@/lib/models/coupon";
import MapSelector from "@/components/MapSelector";
import { addDocument, getDocuments, updateDocument, verifyFirestorePermissions, deleteDocument } from "@/lib/firebase/firebaseUtils";
import { initializeSampleData } from "@/lib/firebase/sampleData";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import Header from "@/components/Header";
import ModelViewer from "@/components/ModelViewer";
import FirebaseSetupGuide from "@/components/FirebaseSetupGuide";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Firebase connection status
  const [firebaseStatus, setFirebaseStatus] = useState({
    checking: false,
    connected: false,
    canWrite: false,
    error: '',
    ruleIssue: null as string | null
  });

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Form state for coupon
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState('common');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRarity, setEditRarity] = useState('common');
  const [editDiscount, setEditDiscount] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editLocation, setEditLocation] = useState({ lat: 37.7749, lng: -122.4194 });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Edit modal image regeneration state
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editModelUrl, setEditModelUrl] = useState('');
  const [isEditGeneratingImage, setIsEditGeneratingImage] = useState(false);
  const [isEditGenerating3D, setIsEditGenerating3D] = useState(false);
  const [editGenerationError, setEditGenerationError] = useState('');
  const [editImageId, setEditImageId] = useState('');
  const [editModelId, setEditModelId] = useState('');
  const [editPollingInterval, setEditPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [editGenerationStatus, setEditGenerationStatus] = useState('');
  const [editPollCount, setEditPollCount] = useState(0);
  const [editPollStartTime, setEditPollStartTime] = useState<number | null>(null);

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State for 3D generator
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [error, setError] = useState("");
  const [imageId, setImageId] = useState("");
  const [modelId, setModelId] = useState("");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [generationStatus, setGenerationStatus] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);

  // State for collapsible coupons
  const [expandedCoupons, setExpandedCoupons] = useState<Record<string, boolean>>({});

  // State for file uploads
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedModel, setUploadedModel] = useState<File | null>(null);
  const [uploadedModelUrl, setUploadedModelUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Toggle coupon expansion
  const toggleCouponExpansion = (couponId: string) => {
    setExpandedCoupons(prev => ({
      ...prev,
      [couponId]: !prev[couponId]
    }));
  };

  // Center map on coupon location
  const centerMapOnCoupon = (coupon: Coupon) => {
    setLocation(coupon.location);
  };

  // Fetch coupons on load
  useEffect(() => {
    // Only load data if user is authenticated
    if (!loading && user) {
      const loadData = async () => {
        try {
          setDataLoading(true);
          setFirebaseStatus(prev => ({ ...prev, checking: true, error: '' }));
          
          // First verify permissions
          console.log("[Dashboard] Verifying Firebase permissions...");
          const permissionCheck = await verifyFirestorePermissions();
          console.log("[Dashboard] Permission check result:", permissionCheck);
          
          setFirebaseStatus({
            checking: false,
            connected: permissionCheck.canRead,
            canWrite: permissionCheck.canWrite,
            error: permissionCheck.error || '',
            ruleIssue: permissionCheck.ruleIssue
          });
          
          if (!permissionCheck.success) {
            console.error("[Dashboard] Firebase permission issues detected:", permissionCheck.error);
            setFormError(`Firebase permission issue: ${permissionCheck.error}. Please ensure you have the correct permissions.`);
          }
          
          // Fetch only the current user's coupons
          const fetchedCoupons = await getDocuments('coupons', user.uid);
          
          // Sort coupons by creation date, newest first
          const sortedCoupons = (fetchedCoupons as Coupon[]).sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Initialize all coupons as collapsed
          const initialExpanded: Record<string, boolean> = {};
          sortedCoupons.forEach((coupon) => {
            if (coupon.id) {
              initialExpanded[coupon.id] = false; // Set to false to start collapsed
            }
          });
          setExpandedCoupons(initialExpanded);
          
          setCoupons(sortedCoupons);
        } catch (error) {
          console.error('[Dashboard] Error loading data:', error);
          setFormError('Error loading coupons. Please refresh and try again.');
          setFirebaseStatus(prev => ({ 
            ...prev, 
            checking: false,
            connected: false,
            canWrite: false,
            error: String(error) 
          }));
        } finally {
          setDataLoading(false);
        }
      };

      loadData();
    }
  }, [loading, user]);

  // Poll for prediction status
  const pollPrediction = async (id: string, type: "image" | "model") => {
    try {
      // Check timeout limits
      const maxPollTime = type === "image" ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min for images, 15 min for models
      const maxPollCount = type === "image" ? 300 : 180; // 300 polls for images (5 min), 180 for models (15 min)
      
      if (pollStartTime && Date.now() - pollStartTime > maxPollTime) {
        console.log(`${type} generation timed out after ${maxPollTime / 1000} seconds`);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setError(`${type} generation timed out. Please try again with a simpler prompt.`);
        if (type === "image") setIsGeneratingImage(false);
        else setIsGenerating3D(false);
        setGenerationStatus("");
        setPollCount(0);
        setPollStartTime(null);
        return;
      }
      
      if (pollCount > maxPollCount) {
        console.log(`${type} generation exceeded maximum poll count: ${maxPollCount}`);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setError(`${type} generation is taking too long. Please try again.`);
        if (type === "image") setIsGeneratingImage(false);
        else setIsGenerating3D(false);
        setGenerationStatus("");
        setPollCount(0);
        setPollStartTime(null);
        return;
      }
      
      setPollCount(prev => prev + 1);
      
      const response = await fetch(`/api/replicate/prediction?id=${id}`);
      
      if (!response.ok) {
        throw new Error("Error checking prediction status");
      }
      
      const prediction = await response.json();
      console.log(`${type} status (poll #${pollCount + 1}):`, prediction.status);
      
      const elapsedTime = pollStartTime ? Math.round((Date.now() - pollStartTime) / 1000) : 0;
      setGenerationStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} status: ${prediction.status} (${elapsedTime}s)`);
      
      if (prediction.status === "succeeded") {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setPollCount(0);
        setPollStartTime(null);
        
        if (type === "image") {
          setImageUrl(prediction.output[0]);
          setIsGeneratingImage(false);
        } else {
          // Enhanced model output logging
          console.log("3D model prediction response:", prediction);
          console.log("Raw output data:", JSON.stringify(prediction.output));
          
          // Local variable to store the URL we find
          let foundModelUrl = "";
          let outputDebugInfo = {};
          
          try {
            // Function to recursively search for URLs in the output object
            const findUrl = (obj: any, path = ''): string | null => {
              // Base case: null or undefined
              if (obj === null || obj === undefined) return null;
              
              // If object is a string, check if it's a URL to a 3D model
              if (typeof obj === 'string') {
                // Log all strings for debugging
                console.log(`Found string at ${path}:`, obj);
                outputDebugInfo = { ...outputDebugInfo, [path]: obj };
                
                // Check if it's potentially a model URL
                if (obj.includes('.glb') || obj.includes('.obj') || obj.includes('/mesh')) {
                  console.log(`Found potential model URL at ${path}:`, obj);
                  return obj;
                }
                return null;
              }
              
              // If it's an array, search each element
              if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                  const url = findUrl(obj[i], `${path}[${i}]`);
                  if (url) return url;
                }
                return null;
              }
              
              // If it's an object, search each property
              if (typeof obj === 'object') {
                for (const key in obj) {
                  const url = findUrl(obj[key], path ? `${path}.${key}` : key);
                  if (url) return url;
                }
                return null;
              }
              
              return null;
            };
            
            // Try to find a model URL in any part of the output
            const urlFromSearch = findUrl(prediction.output);
            if (urlFromSearch) {
              console.log("Found model URL through recursive search:", urlFromSearch);
              foundModelUrl = urlFromSearch;
            }
          } catch (searchError) {
            console.error("Error searching for URL in output:", searchError);
          }
          
          // If we still haven't found a URL, try the more specific checks
          if (!foundModelUrl) {
            // Hunyuan3D-2 model typically returns an object with 'glb' property for textured mesh
            if (prediction.output && prediction.output.glb) {
              console.log("Found glb property:", prediction.output.glb);
              foundModelUrl = prediction.output.glb;
            }
            // Handle textured_mesh format which could be in various properties
            else if (prediction.output && prediction.output.textured_mesh) {
              console.log("Found textured_mesh property:", prediction.output.textured_mesh);
              foundModelUrl = prediction.output.textured_mesh;
            } 
            // Hunyuan3D-2MV model returns { mesh: url } for GLB files
            else if (prediction.output && prediction.output.mesh) {
              console.log("Found mesh property:", prediction.output.mesh);
              foundModelUrl = prediction.output.mesh;
            } 
            // Some might use different property names, check all properties
            else if (prediction.output && typeof prediction.output === 'object') {
              console.log("Checking all properties in output object");
              const possibleUrls = Object.entries(prediction.output);
              for (const [key, value] of possibleUrls) {
                console.log(`Property ${key}:`, value);
                if (typeof value === 'string' && 
                    (value.endsWith('.glb') || value.includes('.glb?') || 
                     value.endsWith('.obj') || value.includes('.obj?'))) {
                  console.log(`Using property ${key} as model URL:`, value);
                  foundModelUrl = value;
                  break;
                }
              }
            }
            // Or it might be an array with the URL directly
            else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
              console.log("Output is an array with", prediction.output.length, "items");
              for (let i = 0; i < prediction.output.length; i++) {
                console.log(`Array item ${i}:`, prediction.output[i]);
              }
              
              const outputUrl = prediction.output.find((url: string) => 
                url.includes('.glb') || url.includes('.obj') || url.includes('.mesh')
              ) || prediction.output[0];
              console.log("Selected URL from array:", outputUrl);
              foundModelUrl = outputUrl;
            }
            // Last resort: if output is just a string, use it directly
            else if (typeof prediction.output === 'string') {
              console.log("Output is a string:", prediction.output);
              foundModelUrl = prediction.output;
            }
          }
          
          // Now set the model URL in state if we found one
          if (foundModelUrl) {
            console.log("Setting modelUrl state to:", foundModelUrl);
            
            // Validate the URL before setting it
            try {
              new URL(foundModelUrl);
              setModelUrl(foundModelUrl);
            } catch (urlError) {
              console.error("Invalid model URL format:", foundModelUrl, urlError);
              setError(`Invalid 3D model URL format: ${foundModelUrl}`);
            }
          } else {
            console.error("Could not determine model URL from output:", prediction.output);
            setError("Could not extract 3D model URL from the response");
            // Log all string values found in the output for debugging
            console.log("Debug info - all string values found:", outputDebugInfo);
          }
          
          setIsGenerating3D(false);
        }
        setGenerationStatus("");
      } else if (prediction.status === "failed") {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setPollCount(0);
        setPollStartTime(null);
        
        setError(`${type} generation failed: ${prediction.error || "Unknown error"}`);
        if (type === "image") setIsGeneratingImage(false);
        else setIsGenerating3D(false);
        setGenerationStatus("");
      }
    } catch (error) {
      console.error(`Error polling ${type} prediction:`, error);
      setError(`Error checking ${type} generation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (type === "image") setIsGeneratingImage(false);
      else setIsGenerating3D(false);
      
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      setPollCount(0);
      setPollStartTime(null);
      setGenerationStatus("");
    }
  };

  // Generate image
  const generateImage = async () => {
    if (!imagePrompt) {
      setError("Please enter a prompt for the image");
      return;
    }

    setIsGeneratingImage(true);
    setError("");
    setImageUrl("");
    setModelUrl("");
    setGenerationStatus("Starting image generation...");

    try {
      const response = await fetch("/api/replicate/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error generating image");
      }

      const data = await response.json();
      setImageId(data.id);

      // Start polling for the prediction status
      if (pollingInterval) clearInterval(pollingInterval);
      
      setPollCount(0);
      setPollStartTime(Date.now());
      
      const interval = setInterval(() => {
        pollPrediction(data.id, "image");
      }, 1000);
      
      setPollingInterval(interval);
    } catch (error) {
      console.error("Error generating image:", error);
      setError((error as Error).message || "Error generating image");
      setIsGeneratingImage(false);
      setGenerationStatus("");
    }
  };

  // Generate 3D model
  const generate3DModel = async () => {
    if (!imageUrl) {
      setError("Please generate an image first");
      return;
    }

    setIsGenerating3D(true);
    setError("");
    setModelUrl("");
    setGenerationStatus("Starting 3D model generation...");

    try {
      let processedImageUrl = imageUrl;
      
      // If it's a blob URL (uploaded image), convert to base64
      if (imageUrl.startsWith('blob:') && uploadedImage) {
        console.log("Converting uploaded image to base64 for 3D generation");
        setGenerationStatus("Converting uploaded image to 3D model...");
        
        // Convert the uploaded image file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Failed to convert image to base64"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read image file"));
        });
        
        reader.readAsDataURL(uploadedImage);
        processedImageUrl = await base64Promise;
      }

      const response = await fetch("/api/replicate/generate-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: processedImageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error generating 3D model");
      }

      const data = await response.json();
      setModelId(data.id);

      // Start polling for the prediction status
      if (pollingInterval) clearInterval(pollingInterval);
      
      setPollCount(0);
      setPollStartTime(Date.now());
      
      const interval = setInterval(() => {
        pollPrediction(data.id, "model");
      }, 5000); // 5 seconds between polls for 3D model status
      
      setPollingInterval(interval);
    } catch (error) {
      console.error("Error generating 3D model:", error);
      setError((error as Error).message || "Error generating 3D model");
      setIsGenerating3D(false);
      setGenerationStatus("");
    }
  };

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Cancel generation function
  const cancelGeneration = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    setPollCount(0);
    setPollStartTime(null);
    setIsGeneratingImage(false);
    setIsGenerating3D(false);
    setGenerationStatus("");
    setError("Generation cancelled by user");
    
    console.log("Generation cancelled by user");
  };

  // Handle image file upload
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    setUploadError("");
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file size must be less than 10MB');
      }
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setUploadedImage(file);
      setUploadedImageUrl(objectUrl);
      
      // Set this as the current image for 3D generation
      setImageUrl(objectUrl);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle 3D model file upload
  const handleModelUpload = async (file: File) => {
    setIsUploadingModel(true);
    setUploadError("");
    
    try {
      // Validate file type (GLB/GLTF)
      const validTypes = ['.glb', '.gltf'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        throw new Error('Please select a valid 3D model file (.glb or .gltf)');
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('3D model file size must be less than 50MB');
      }
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setUploadedModel(file);
      setUploadedModelUrl(objectUrl);
      
      // Set this as the current model
      setModelUrl(objectUrl);
      
    } catch (error) {
      console.error('Error uploading 3D model:', error);
      setUploadError(error instanceof Error ? error.message : 'Error uploading 3D model');
    } finally {
      setIsUploadingModel(false);
    }
  };

  // Generate 3D model from uploaded image
  const generateModelFromUploadedImage = async () => {
    if (!uploadedImageUrl) {
      setError("Please upload an image first");
      return;
    }
    
    try {
      setIsGenerating3D(true);
      setError("");
      setGenerationStatus("Converting uploaded image to 3D model...");
      
      // Convert the uploaded image file to base64 for API
      if (!uploadedImage) {
        throw new Error("No uploaded image file found");
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          // Send to the 3D generation API with the base64 image data
          const response = await fetch('/api/replicate/generate-3d', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: base64Data // Send the base64 data URL directly
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }

          if (data.id) {
            setModelId(data.id);
            setPollCount(0);
            setPollStartTime(Date.now());
            
            const interval = setInterval(() => {
              pollPrediction(data.id, "model");
            }, 5000);
            
            setPollingInterval(interval);
          }
        } catch (error) {
          console.error('Error generating 3D model from uploaded image:', error);
          setError(error instanceof Error ? error.message : 'Error generating 3D model');
          setIsGenerating3D(false);
          setGenerationStatus("");
        }
      };
      
      reader.readAsDataURL(uploadedImage);
      
    } catch (error) {
      console.error('Error generating 3D model from uploaded image:', error);
      setError(error instanceof Error ? error.message : 'Error generating 3D model');
      setIsGenerating3D(false);
      setGenerationStatus("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Dashboard] Starting coupon creation...");

    // Reset state
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      if (!user || !user.uid) {
        console.error("[Dashboard] Error: No authenticated user or missing UID");
        setFormError('You must be logged in to create a coupon');
        setIsSubmitting(false);
        return;
      }
      console.log("[Dashboard] User authenticated:", user.uid);

      // Validate form fields
      if (!name || !description || !discount || !startDate || !endDate) {
        console.error("[Dashboard] Validation error: Missing required fields");
        setFormError('Please fill out all required fields');
        setIsSubmitting(false);
        return;
      }
      console.log("[Dashboard] Form validation successful");

      // Validate that we have at least an image OR a 3D model
      if (!imageUrl && !uploadedImageUrl && !uploadedModelUrl) {
        console.error("[Dashboard] Validation error: Missing image or 3D model");
        setFormError('Please generate/upload an image or upload a 3D model for your coupon');
        setIsSubmitting(false);
        return;
      }
      console.log("[Dashboard] Content validation successful");

      // Use uploaded content if available, otherwise use generated content
      const finalImageUrl = uploadedImageUrl || imageUrl;
      const finalModelUrl = uploadedModelUrl || modelUrl;

      // Create coupon object
      const coupon: Partial<Coupon> = {
        name,
        description,
        rarity,
        discount,
        startDate: new Date(startDate + (startTime ? ' ' + startTime : '')),
        endDate: new Date(endDate + (endTime ? ' ' + endTime : '')),
        location,
        imageUrl: finalImageUrl || undefined, // Make image optional if we have a 3D model
        modelUrl: finalModelUrl || undefined,
        userId: user.uid, // Ensure userId is explicitly set
        createdAt: new Date()
      };
      console.log("[Dashboard] Coupon object created:", coupon);

      // Check Firebase permission status
      if (!firebaseStatus.canWrite) {
        console.error("[Dashboard] Error: Firebase write permission denied");
        setFormError('Firebase write permission denied. Please check your Firebase settings.');
        setIsSubmitting(false);
        // Retry firebase connection to refresh permissions
        await retryFirebaseConnection();
        return;
      }
      console.log("[Dashboard] Firebase permissions checked: OK");

      // Save to Firebase
      console.log("[Dashboard] Attempting to save coupon to Firestore...");
      const docRef = await addDocument('coupons', coupon);
      
      if (!docRef) {
        throw new Error('Failed to add document - no document reference returned');
      }
      console.log("[Dashboard] Coupon saved successfully with ID:", docRef.id);

      // Add the new coupon to the list
      const newCoupon = {
        id: docRef.id,
        ...coupon
      } as Coupon;
      
      setCoupons(prev => [newCoupon, ...prev]);
      setSuccessMessage('Coupon created successfully!');
      
      // Reset form fields
      setName('');
      setDescription('');
      setRarity('common');
      setDiscount('');
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
      setImagePrompt('');
      setImageUrl('');
      setModelUrl('');
      
      // Reset uploaded files
      setUploadedImage(null);
      setUploadedImageUrl('');
      setUploadedModel(null);
      setUploadedModelUrl('');
      setUploadError('');
      
    } catch (error) {
      console.error("[Dashboard] Error creating coupon:", error);
      
      // Provide more detailed error messages
      let errorMessage = 'Error creating coupon';
      
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('permission-denied') || error.message.includes('Permission denied')) {
          errorMessage = 'Firebase permission denied. Please check your Firestore security rules.';
          // Attempt to refresh permissions
          await retryFirebaseConnection();
        } else if (error.message.includes('not-found')) {
          errorMessage = 'Firebase collection not found. Please check your database setup.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal with selected coupon data
  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditName(coupon.name);
    setEditDescription(coupon.description);
    setEditRarity(coupon.rarity || 'common');
    setEditDiscount(coupon.discount);
    setEditStartDate(formatDateForInput(coupon.startDate));
    setEditEndDate(formatDateForInput(coupon.endDate));
    setEditStartTime(coupon.startTime);
    setEditEndTime(coupon.endTime);
    setEditLocation(coupon.location);
    setEditError('');
    setEditSuccess('');
    
    // Initialize edit modal generation state
    setEditImagePrompt(coupon.imagePrompt || '');
    setEditImageUrl('');
    setEditModelUrl('');
    setIsEditGeneratingImage(false);
    setIsEditGenerating3D(false);
    setEditGenerationError('');
    setEditGenerationStatus('');
    
    setIsEditModalOpen(true);
  };

  // Helper function to format date for date input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Close edit modal and reset state
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCoupon(null);
    setEditName('');
    setEditDescription('');
    setEditRarity('common');
    setEditDiscount('');
    setEditStartDate('');
    setEditEndDate('');
    setEditStartTime('');
    setEditEndTime('');
    setEditLocation({ lat: 0, lng: 0 });
    setEditError('');
    setEditSuccess('');
    
    // Reset edit modal generation state
    setEditImagePrompt('');
    setEditImageUrl('');
    setEditModelUrl('');
    setIsEditGeneratingImage(false);
    setIsEditGenerating3D(false);
    setEditGenerationError('');
    setEditGenerationStatus('');
    setEditImageId('');
    setEditModelId('');
    setEditPollCount(0);
    setEditPollStartTime(0);
    
    // Clear polling interval
    if (editPollingInterval) {
      clearInterval(editPollingInterval);
      setEditPollingInterval(null);
    }
  };

  // Handle delete coupon
  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!coupon.id) {
      console.error("[Dashboard] Error: Cannot delete coupon without ID");
      setDeleteError("Cannot delete coupon: Missing coupon ID");
      return;
    }

    // Open confirmation dialog
    setShowDeleteConfirm(true);
    setCouponToDelete(coupon);
    setDeleteError('');
  };

  // Confirm and execute coupon deletion
  const confirmDeleteCoupon = async () => {
    if (!couponToDelete?.id) {
      setDeleteError("Cannot delete: Invalid coupon");
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      console.log(`[Dashboard] Deleting coupon with ID: ${couponToDelete.id}`);
      
      // Verify Firebase permissions
      if (!firebaseStatus.canWrite) {
        console.error("[Dashboard] Error: Firebase write permission denied for deletion");
        setDeleteError('Firebase permission denied. Please check your Firebase settings.');
        setIsDeleting(false);
        return;
      }

      // Delete from Firebase
      await deleteDocument('coupons', couponToDelete.id);
      console.log(`[Dashboard] Coupon deleted successfully: ${couponToDelete.id}`);
      
      // Remove from local state
      setCoupons(prevCoupons => prevCoupons.filter(c => c.id !== couponToDelete.id));
      
      // Show success message and reset state
      setSuccessMessage('Coupon deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteConfirm(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("[Dashboard] Error deleting coupon:", error);
      setDeleteError(`Error deleting coupon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel coupon deletion
  const cancelDeleteCoupon = () => {
    setShowDeleteConfirm(false);
    setCouponToDelete(null);
    setDeleteError('');
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setEditError('');
    setEditSuccess('');

    try {
      if (!editingCoupon?.id) {
        throw new Error('Coupon ID is missing');
      }

      // Validate form
      if (!editName || !editDescription || !editDiscount || !editStartDate || !editEndDate) {
        setEditError('Please fill out all required fields');
        setIsEditing(false);
        return;
      }

      // Create updated coupon object
      const updatedCoupon: Partial<Coupon> = {
        name: editName,
        description: editDescription,
        rarity: editRarity,
        discount: editDiscount,
        startDate: new Date(editStartDate),
        endDate: new Date(editEndDate),
        startTime: editStartTime || '00:00',
        endTime: editEndTime || '23:59',
        location: editLocation,
        updatedAt: new Date()
      };

      // Use regenerated image if available, otherwise keep existing
      if (editImageUrl) {
        updatedCoupon.imageUrl = editImageUrl;
        updatedCoupon.imagePrompt = editImagePrompt;
      } else if (editingCoupon.imageUrl) {
        updatedCoupon.imageUrl = editingCoupon.imageUrl;
        updatedCoupon.imagePrompt = editingCoupon.imagePrompt;
      }
      
      // Use regenerated model if available, otherwise keep existing
      if (editModelUrl) {
        updatedCoupon.modelUrl = editModelUrl;
      } else if (editingCoupon.modelUrl) {
        updatedCoupon.modelUrl = editingCoupon.modelUrl;
      }

      // Update in Firestore
      await updateDocument('coupons', editingCoupon.id, updatedCoupon);
      
      // Update in local state
      const updatedCoupons = coupons.map(coupon => 
        coupon.id === editingCoupon.id 
          ? { ...coupon, ...updatedCoupon } as Coupon 
          : coupon
      );
      
      setCoupons(updatedCoupons);
      setEditSuccess('Coupon updated successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (error) {
      console.error('Error updating coupon:', error);
      setEditError('Failed to update coupon. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // Add the retry function
  const retryFirebaseConnection = async () => {
    if (!user) {
      setFirebaseStatus(prev => ({
        ...prev,
        checking: false,
        connected: false,
        canWrite: false,
        error: 'Not authenticated',
        ruleIssue: 'authentication'
      }));
      return;
    }

    setFirebaseStatus(prev => ({ ...prev, checking: true, error: '', ruleIssue: null }));
    
    try {
      console.log("[Dashboard] Retrying Firebase permission check...");
      const permissionCheck = await verifyFirestorePermissions();
      console.log("[Dashboard] Permission check result:", permissionCheck);
      
      setFirebaseStatus({
        checking: false,
        connected: permissionCheck.canRead,
        canWrite: permissionCheck.canWrite,
        error: permissionCheck.error || '',
        ruleIssue: permissionCheck.ruleIssue
      });

      // If we can read, reload the coupons
      if (permissionCheck.canRead) {
        setDataLoading(true);
        try {
          const fetchedCoupons = await getDocuments('coupons', user.uid);
          
          // Sort coupons by creation date, newest first
          const sortedCoupons = (fetchedCoupons as Coupon[]).sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Initialize all coupons as collapsed
          const initialExpanded: Record<string, boolean> = {};
          sortedCoupons.forEach((coupon) => {
            if (coupon.id) {
              initialExpanded[coupon.id] = false;
            }
          });
          setExpandedCoupons(initialExpanded);
          
          setCoupons(sortedCoupons);
          setFormError('');
          setSuccessMessage('Coupons loaded successfully');
        } catch (error) {
          console.error("[Dashboard] Error reloading coupons:", error);
          setFormError('Error loading coupons after retry');
        } finally {
          setDataLoading(false);
        }
      }
    } catch (error) {
      console.error("[Dashboard] Error during retry:", error);
      setFirebaseStatus({
        checking: false,
        connected: false,
        canWrite: false,
        error: String(error),
        ruleIssue: 'unexpected'
      });
      setFormError('Error reconnecting to Firebase');
    }
  };

  // Edit modal polling function
  const pollEditPrediction = async (id: string, type: "image" | "model") => {
    try {
      // Check timeout limits
      const maxPollTime = type === "image" ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min for images, 15 min for models
      const maxPollCount = type === "image" ? 300 : 180; // 300 polls for images (5 min), 180 for models (15 min)
      
      if (editPollStartTime && Date.now() - editPollStartTime > maxPollTime) {
        console.log(`Edit ${type} generation timed out after ${maxPollTime / 1000} seconds`);
        if (editPollingInterval) {
          clearInterval(editPollingInterval);
          setEditPollingInterval(null);
        }
        setEditGenerationError(`${type} generation timed out. Please try again with a simpler prompt.`);
        if (type === "image") setIsEditGeneratingImage(false);
        else setIsEditGenerating3D(false);
        setEditGenerationStatus("");
        setEditPollCount(0);
        setEditPollStartTime(null);
        return;
      }
      
      if (editPollCount > maxPollCount) {
        console.log(`Edit ${type} generation exceeded maximum poll count: ${maxPollCount}`);
        if (editPollingInterval) {
          clearInterval(editPollingInterval);
          setEditPollingInterval(null);
        }
        setEditGenerationError(`${type} generation is taking too long. Please try again.`);
        if (type === "image") setIsEditGeneratingImage(false);
        else setIsEditGenerating3D(false);
        setEditGenerationStatus("");
        setEditPollCount(0);
        setEditPollStartTime(null);
        return;
      }
      
      setEditPollCount(prev => prev + 1);
      
      const response = await fetch(`/api/replicate/prediction?id=${id}`);
      
      if (!response.ok) {
        throw new Error("Error checking prediction status");
      }
      
      const prediction = await response.json();
      console.log(`Edit ${type} status (poll #${editPollCount + 1}):`, prediction.status);
      
      const elapsedTime = editPollStartTime ? Math.round((Date.now() - editPollStartTime) / 1000) : 0;
      setEditGenerationStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} status: ${prediction.status} (${elapsedTime}s)`);
      
      if (prediction.status === "succeeded") {
        if (editPollingInterval) {
          clearInterval(editPollingInterval);
          setEditPollingInterval(null);
        }
        
        setEditPollCount(0);
        setEditPollStartTime(null);
        
        if (type === "image") {
          setEditImageUrl(prediction.output[0]);
          setIsEditGeneratingImage(false);
        } else {
          // Handle 3D model output similar to main generation
          console.log("Edit 3D model prediction response:", prediction);
          
          let foundModelUrl = "";
          
          try {
            // Function to recursively search for URLs in the output object
            const findUrl = (obj: any): string | null => {
              if (obj === null || obj === undefined) return null;
              
              if (typeof obj === 'string') {
                if (obj.includes('.glb') || obj.includes('.obj') || obj.includes('/mesh')) {
                  return obj;
                }
                return null;
              }
              
              if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                  const url = findUrl(obj[i]);
                  if (url) return url;
                }
                return null;
              }
              
              if (typeof obj === 'object') {
                for (const key in obj) {
                  const url = findUrl(obj[key]);
                  if (url) return url;
                }
                return null;
              }
              
              return null;
            };
            
            const urlFromSearch = findUrl(prediction.output);
            if (urlFromSearch) {
              foundModelUrl = urlFromSearch;
            }
          } catch (searchError) {
            console.error("Error searching for URL in edit output:", searchError);
          }
          
          // Fallback checks
          if (!foundModelUrl) {
            if (prediction.output && prediction.output.glb) {
              foundModelUrl = prediction.output.glb;
            } else if (prediction.output && prediction.output.textured_mesh) {
              foundModelUrl = prediction.output.textured_mesh;
            } else if (prediction.output && prediction.output.mesh) {
              foundModelUrl = prediction.output.mesh;
            } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
              foundModelUrl = prediction.output[0];
            } else if (typeof prediction.output === 'string') {
              foundModelUrl = prediction.output;
            }
          }
          
          if (foundModelUrl) {
            try {
              new URL(foundModelUrl);
              setEditModelUrl(foundModelUrl);
            } catch (urlError) {
              console.error("Invalid edit model URL format:", foundModelUrl, urlError);
              setEditGenerationError(`Invalid 3D model URL format: ${foundModelUrl}`);
            }
          } else {
            console.error("Could not determine edit model URL from output:", prediction.output);
            setEditGenerationError("Could not extract 3D model URL from the response");
          }
          
          setIsEditGenerating3D(false);
        }
        setEditGenerationStatus("");
      } else if (prediction.status === "failed") {
        if (editPollingInterval) {
          clearInterval(editPollingInterval);
          setEditPollingInterval(null);
        }
        
        setEditPollCount(0);
        setEditPollStartTime(null);
        
        setEditGenerationError(`${type} generation failed: ${prediction.error || "Unknown error"}`);
        if (type === "image") setIsEditGeneratingImage(false);
        else setIsEditGenerating3D(false);
        setEditGenerationStatus("");
      }
    } catch (error) {
      console.error(`Error polling edit ${type} prediction:`, error);
      setEditGenerationError(`Error checking ${type} generation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (type === "image") setIsEditGeneratingImage(false);
      else setIsEditGenerating3D(false);
      
      if (editPollingInterval) {
        clearInterval(editPollingInterval);
        setEditPollingInterval(null);
      }
      
      setEditPollCount(0);
      setEditPollStartTime(null);
      setEditGenerationStatus("");
    }
  };

  // Generate image in edit modal
  const generateEditImage = async () => {
    if (!editImagePrompt) {
      setEditGenerationError("Please enter a prompt for the image");
      return;
    }

    setIsEditGeneratingImage(true);
    setEditGenerationError("");
    setEditImageUrl("");
    setEditModelUrl("");
    setEditGenerationStatus("Starting image generation...");

    try {
      const response = await fetch("/api/replicate/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: editImagePrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error generating image");
      }

      const data = await response.json();
      setEditImageId(data.id);

      // Start polling for the prediction status
      if (editPollingInterval) clearInterval(editPollingInterval);
      
      setEditPollCount(0);
      setEditPollStartTime(Date.now());
      
      const interval = setInterval(() => {
        pollEditPrediction(data.id, "image");
      }, 1000);
      
      setEditPollingInterval(interval);
    } catch (error) {
      console.error("Error generating edit image:", error);
      setEditGenerationError((error as Error).message || "Error generating image");
      setIsEditGeneratingImage(false);
      setEditGenerationStatus("");
    }
  };

  // Generate 3D model in edit modal
  const generateEdit3DModel = async () => {
    const imageToUse = editImageUrl || editingCoupon?.imageUrl;
    
    if (!imageToUse) {
      setEditGenerationError("Please generate an image first or ensure the coupon has an existing image");
      return;
    }

    setIsEditGenerating3D(true);
    setEditGenerationError("");
    setEditModelUrl("");
    setEditGenerationStatus("Starting 3D model generation...");

    try {
      const response = await fetch("/api/replicate/generate-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: imageToUse }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error generating 3D model");
      }

      const data = await response.json();
      setEditModelId(data.id);

      // Start polling for the prediction status
      if (editPollingInterval) clearInterval(editPollingInterval);
      
      setEditPollCount(0);
      setEditPollStartTime(Date.now());
      
      const interval = setInterval(() => {
        pollEditPrediction(data.id, "model");
      }, 5000); // 5 seconds between polls for 3D model status
      
      setEditPollingInterval(interval);
    } catch (error) {
      console.error("Error generating edit 3D model:", error);
      setEditGenerationError((error as Error).message || "Error generating 3D model");
      setIsEditGenerating3D(false);
      setEditGenerationStatus("");
    }
  };

  // Cancel edit generation
  const cancelEditGeneration = () => {
    if (editPollingInterval) {
      clearInterval(editPollingInterval);
      setEditPollingInterval(null);
    }
    
    setEditPollCount(0);
    setEditPollStartTime(null);
    setIsEditGeneratingImage(false);
    setIsEditGenerating3D(false);
    setEditGenerationStatus("");
    setEditGenerationError("Generation cancelled by user");
    
    console.log("Edit generation cancelled by user");
  };

  // Clean up edit polling interval on unmount
  useEffect(() => {
    return () => {
      if (editPollingInterval) {
        clearInterval(editPollingInterval);
      }
    };
  }, [editPollingInterval]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      
      <main className="flex-1 flex bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          {/* Firebase status alerts */}
          {firebaseStatus.checking ? (
            <div className="bg-blue-900/50 mb-4 p-2 rounded-lg flex items-center text-sm">
              <div className="mr-2 h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
              <span>Checking Firebase connection...</span>
            </div>
          ) : firebaseStatus.error || !firebaseStatus.canWrite ? (
            <div>
              <div className={`${firebaseStatus.error ? 'bg-red-900/50' : 'bg-yellow-900/50'} mb-4 p-2 rounded-lg text-sm`}>
                <div className="flex items-center">
                  {firebaseStatus.error ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>
                    {firebaseStatus.error ? `Firebase connection error: ${firebaseStatus.error}` : 'Firebase write permission issue'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className={`text-xs ${firebaseStatus.error ? 'text-red-300' : 'text-yellow-300'} ml-7`}>
                    {firebaseStatus.error 
                      ? 'Your coupon data may not save correctly. Please refresh the page or check your Firebase settings.'
                      : 'You can view coupons but may not be able to create or edit them. Check your Firebase permissions.'
                    }
                  </p>
                  <button 
                    onClick={retryFirebaseConnection}
                    className={`${firebaseStatus.error ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white text-xs px-3 py-1 rounded ml-4 flex-shrink-0`}
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
              
              {/* Show Firebase setup guide when there are permission issues */}
              <FirebaseSetupGuide 
                initialTab={
                  firebaseStatus.ruleIssue === 'write_rules' || 
                  firebaseStatus.ruleIssue === 'read_rules' || 
                  firebaseStatus.ruleIssue === 'all_rules' || 
                  firebaseStatus.ruleIssue === 'schema_validation'
                    ? 'firestore'
                    : firebaseStatus.ruleIssue === 'authentication'
                      ? 'authentication'
                      : 'firestore'
                } 
              />
            </div>
          ) : (
            <div className="bg-green-900/50 mb-4 p-2 rounded-lg flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Firebase connected successfully</span>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Map and Coupons List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Selector */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl">Coupon Location</h2>
                  <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-sm flex items-center"
                    onClick={() => {
                      // Reset to default location (San Francisco)
                      setLocation({ lat: 37.7749, lng: -122.4194 });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
                <MapSelector 
                  selectedLocation={location}
                  onLocationSelected={setLocation}
                  coupons={coupons}
                />
              </div>

              {/* Coupons List */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl mb-4">My Coupons</h2>
                
                {dataLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="text-center p-6 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-2">No coupons created yet</p>
                    <p className="text-sm text-gray-400">Create your first coupon using the form on the right</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coupons.map((coupon, index) => (
                      <div 
                        key={coupon.id || index} 
                        className="bg-gray-700 rounded-lg overflow-hidden border-l-4 border-blue-500 transition"
                      >
                        {/* Coupon Header - Always visible */}
                        <div 
                          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-650"
                          onClick={() => coupon.id && toggleCouponExpansion(coupon.id)}
                        >
                          <div className="flex items-center">
                            {/* Expand/Collapse Icon - Moved to left */}
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-5 w-5 text-gray-300 transition-transform mr-3 ${
                                coupon.id && expandedCoupons[coupon.id] ? 'transform rotate-180' : ''
                              }`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="mr-3 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                              {coupon.discount}
                            </span>
                            
                            {/* Generated Image Preview */}
                            {coupon.imageUrl ? (
                              <div className="mr-3 w-12 h-12 rounded-lg overflow-hidden bg-gray-600 flex-shrink-0">
                                <Image
                                  src={coupon.imageUrl}
                                  alt={`${coupon.name} preview`}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : coupon.modelUrl ? (
                              <div className="mr-3 w-12 h-12 rounded-lg bg-gray-600 flex-shrink-0 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            ) : null}
                            
                            <h3 className="font-semibold text-xl text-white">{coupon.name}</h3>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Edit Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent toggling expansion when clicking edit
                                openEditModal(coupon);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent toggling expansion when clicking delete
                                handleDeleteCoupon(coupon);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>

                            {/* Center on Map Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent toggling expansion when clicking center
                                centerMapOnCoupon(coupon);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm flex items-center"
                              title="Center map on this coupon's location"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Center on Map
                            </button>
                          </div>
                        </div>
                        
                        {/* Coupon Details - Only visible when expanded */}
                        {coupon.id && expandedCoupons[coupon.id] && (
                          <div className="p-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column: Stacked Description and Location/Timing */}
                              <div className="space-y-4">
                                {/* Top Box: Description */}
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                                  <p className="text-sm text-gray-300 overflow-y-auto max-h-28">
                                    {coupon.description}
                                  </p>
                                </div>
                                
                                {/* Discount */}
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Discount</h4>
                                  <p className="text-sm text-gray-300 font-semibold">
                                    {coupon.discount}
                                  </p>
                                </div>
                                
                                {/* Rarity */}
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Rarity</h4>
                                  <p className="text-sm text-gray-300 capitalize">
                                    {coupon.rarity || 'Common'}
                                  </p>
                                </div>
                                
                                {/* Bottom Box: Location and Timing */}
                                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                                  <h4 className="text-sm font-medium text-gray-400">Location & Timing</h4>
                                  
                                  {/* Status indicator */}
                                  <div>
                                    <span className="text-gray-400 text-xs">Status:</span>
                                    <div className="flex items-center">
                                      {(() => {
                                        const now = new Date();
                                        const startDate = new Date(coupon.startDate);
                                        const endDate = new Date(coupon.endDate);
                                        
                                        // Set time for start and end dates based on coupon times
                                        const [startHour, startMinute] = (coupon.startTime || '00:00').split(':').map(Number);
                                        const [endHour, endMinute] = (coupon.endTime || '23:59').split(':').map(Number);
                                        
                                        startDate.setHours(startHour, startMinute, 0, 0);
                                        endDate.setHours(endHour, endMinute, 59, 999);
                                        
                                        const isActive = now >= startDate && now <= endDate;
                                        
                                        return (
                                          <>
                                            <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                                              {isActive ? 'Active' : 'Inactive'}
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-400 text-xs">Location:</span>
                                    <div className="font-mono text-sm text-gray-300">
                                      {coupon.location.lat.toFixed(6)}, {coupon.location.lng.toFixed(6)}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-400 text-xs">Dates:</span>
                                    <div className="text-sm text-gray-300">
                                      {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-400 text-xs">Hours:</span>
                                    <div className="text-sm text-gray-300">
                                      {coupon.startTime} - {coupon.endTime}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Column: Generated Media */}
                              <div className="bg-gray-800 rounded-lg p-3 h-full">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Generated Media</h4>
                                
                                {/* Check if there's an image or model available */}
                                {(coupon.imageUrl || coupon.modelUrl) ? (
                                  <div className="space-y-2">
                                    {/* Show 3D model if available, otherwise show image */}
                                    {coupon.modelUrl ? (
                                      <div className="mb-6">
                                        <ModelViewer glbUrl={coupon.modelUrl} alt="3D model preview" height="400px" />
                                      </div>
                                    ) : coupon.imageUrl ? (
                                      <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">Generated Image</h3>
                                        <div className="relative w-full h-[300px] bg-gray-900 rounded-lg overflow-hidden">
                                          <Image
                                            src={coupon.imageUrl}
                                            alt={`${coupon.name} generated image`}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            className="rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">3D Model</h3>
                                        <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 h-[300px] flex items-center justify-center">
                                          <div>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <p>No 3D model generated yet.</p>
                                            <p className="text-sm mt-1">Generate an image first, then create a 3D model from it.</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-center">
                                    <p className="text-sm text-gray-500">No media available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Coupon Form */}
            <div className="space-y-6">
              {/* Coupon Form */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl mb-4">Create New Coupon</h2>
                
                {successMessage && (
                  <div className="mb-4 p-2 bg-green-800 text-green-100 rounded text-sm">
                    {successMessage}
                  </div>
                )}
                
                {formError && (
                  <div className="mb-4 p-2 bg-red-800 text-red-100 rounded text-sm">
                    {formError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Location</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">Latitude</span>
                        <div className="font-mono">{location.lat.toFixed(6)}</div>
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">Longitude</span>
                        <div className="font-mono">{location.lng.toFixed(6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Coupon Name*
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      Description*
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rarity" className="block text-sm font-medium text-gray-300 mb-1">
                      Rarity*
                    </label>
                    <select
                      id="rarity"
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="ultra rare">Ultra Rare</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">
                      Discount*
                    </label>
                    <input
                      id="discount"
                      type="text"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="e.g. 10% OFF, Buy One Get One Free"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                        Start Date*
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                        End Date*
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">
                        Start Time
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">
                        End Time
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Coupon'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 3D Generator Section */}
              <div id="model-viewer-section" className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl mb-4">Create Custom 3D Model</h2>
                
                <div className="space-y-6">
                  {/* Step 1: Generate Image */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Step 1: Generate Image</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-300 mb-1">
                          Image Prompt*
                        </label>
                        <textarea
                          id="imagePrompt"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          rows={2}
                          placeholder="Describe what you want in the image (e.g. a red sports car)"
                          className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={generateImage}
                        disabled={isGeneratingImage || !imagePrompt}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isGeneratingImage ? 'Generating Image...' : 'Generate Image'}
                      </button>
                    </div>
                  </div>

                  {/* Display Generated Image after Step 1 */}
                  {imageUrl && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Generated Image</h3>
                      <div className="relative w-full h-[180px]">
                        <Image
                          src={imageUrl}
                          alt="Generated image"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Create 3D Model */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Step 2: Create 3D Model</h3>
                    <p className="text-gray-300 mb-3 text-sm">
                      Once your image is generated, convert it to a 3D model.
                    </p>
                    <button
                      onClick={generate3DModel}
                      disabled={isGenerating3D || !imageUrl}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isGenerating3D ? 'Creating 3D Model...' : 'Create 3D Model'}
                    </button>
                  </div>

                  {/* Generation status and errors */}
                  {error && (
                    <div className="bg-red-900/50 border border-red-800 p-3 rounded-lg text-sm">
                      <p className="text-red-200">{error}</p>
                    </div>
                  )}

                  {generationStatus && (
                    <div className="bg-blue-900/50 border border-blue-800 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-3 h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                        <p className="text-blue-200 text-sm">{generationStatus}</p>
                      </div>
                    </div>
                  )}

                  {/* Display Generated 3D Model */}
                  {modelUrl && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Generated 3D Model</h3>
                      <ModelViewer 
                        glbUrl={modelUrl}
                        alt="Generated 3D model"
                        poster={imageUrl}
                      />
                      <a
                        href={modelUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm"
                      >
                        Download GLB File
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-gray-800 rounded-lg p-4 mt-6">
                <h2 className="text-xl mb-4">Upload Your Own Files</h2>
                
                <div className="space-y-6">
                  {/* Upload Image Section */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Upload Image</h3>
                    <p className="text-gray-300 mb-3 text-sm">
                      Upload your own image to use directly or convert to a 3D model.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-600 hover:bg-gray-500 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-300">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 10MB)</p>
                          </div>
                          <input 
                            id="image-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>
                      
                      {/* Display uploaded image */}
                      {uploadedImageUrl && (
                        <div className="bg-gray-600 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Uploaded Image</h4>
                          <div className="relative w-full h-[180px]">
                            <Image
                              src={uploadedImageUrl}
                              alt="Uploaded image"
                              fill
                              style={{ objectFit: 'contain' }}
                              className="rounded-lg"
                            />
                          </div>
                          <button
                            onClick={generateModelFromUploadedImage}
                            disabled={isGenerating3D}
                            className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isGenerating3D ? 'Converting to 3D...' : 'Convert to 3D Model'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload 3D Model Section */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Upload 3D Model</h3>
                    <p className="text-gray-300 mb-3 text-sm">
                      Upload your own 3D model file (.glb or .gltf format).
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="model-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-600 hover:bg-gray-500 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-300">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">GLB, GLTF (MAX. 50MB)</p>
                          </div>
                          <input 
                            id="model-upload" 
                            type="file" 
                            className="hidden" 
                            accept=".glb,.gltf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleModelUpload(file);
                              }
                            }}
                            disabled={isUploadingModel}
                          />
                        </label>
                      </div>
                      
                      {/* Display uploaded 3D model */}
                      {uploadedModelUrl && (
                        <div className="bg-gray-600 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Uploaded 3D Model</h4>
                          <ModelViewer 
                            glbUrl={uploadedModelUrl}
                            alt="Uploaded 3D model"
                            poster={uploadedImageUrl || imageUrl}
                          />
                          <a
                            href={uploadedModelUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm"
                          >
                            Download GLB File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload errors */}
                  {uploadError && (
                    <div className="bg-red-900/50 border border-red-800 p-3 rounded-lg text-sm">
                      <p className="text-red-200">{uploadError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Edit Coupon Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit Coupon</h2>
                    <button 
                      onClick={closeEditModal}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {editSuccess && (
                    <div className="mb-4 p-2 bg-green-800 text-green-100 rounded text-sm">
                      {editSuccess}
                    </div>
                  )}
                  
                  {editError && (
                    <div className="mb-4 p-2 bg-red-800 text-red-100 rounded text-sm">
                      {editError}
                    </div>
                  )}
                  
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">
                          Coupon Name*
                        </label>
                        <input
                          id="edit-name"
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-discount" className="block text-sm font-medium text-gray-300 mb-1">
                          Discount*
                        </label>
                        <input
                          id="edit-discount"
                          type="text"
                          value={editDiscount}
                          onChange={(e) => setEditDiscount(e.target.value)}
                          placeholder="e.g. 10% OFF, Buy One Get One Free"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-300 mb-1">
                        Description*
                      </label>
                      <textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-rarity" className="block text-sm font-medium text-gray-300 mb-1">
                        Rarity*
                      </label>
                      <select
                        id="edit-rarity"
                        value={editRarity}
                        onChange={(e) => setEditRarity(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="ultra rare">Ultra Rare</option>
                      </select>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg mb-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Location</h3>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label htmlFor="edit-lat" className="block text-xs text-gray-400 mb-1">Latitude</label>
                          <input
                            id="edit-lat"
                            type="number"
                            step="0.000001"
                            value={editLocation.lat}
                            onChange={(e) => setEditLocation({...editLocation, lat: Number(e.target.value)})}
                            className="w-full bg-gray-600 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-lng" className="block text-xs text-gray-400 mb-1">Longitude</label>
                          <input
                            id="edit-lng"
                            type="number"
                            step="0.000001"
                            value={editLocation.lng}
                            onChange={(e) => setEditLocation({...editLocation, lng: Number(e.target.value)})}
                            className="w-full bg-gray-600 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Map Selector */}
                      <MapSelector 
                        selectedLocation={editLocation}
                        onLocationSelected={setEditLocation}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-startDate" className="block text-sm font-medium text-gray-300 mb-1">
                          Start Date*
                        </label>
                        <input
                          id="edit-startDate"
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-endDate" className="block text-sm font-medium text-gray-300 mb-1">
                          End Date*
                        </label>
                        <input
                          id="edit-endDate"
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-300 mb-1">
                          Start Time
                        </label>
                        <input
                          id="edit-startTime"
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-300 mb-1">
                          End Time
                        </label>
                        <input
                          id="edit-endTime"
                          type="time"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Display existing image and 3D model if available */}
                    {editingCoupon?.imageUrl && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Image</h3>
                        <div className="relative h-40 bg-gray-800 rounded-md overflow-hidden">
                          <Image 
                            src={editingCoupon.imageUrl}
                            alt={editingCoupon.name}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                        </div>
                      </div>
                    )}
                    
                    {editingCoupon?.modelUrl && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <ModelViewer 
                          glbUrl={editingCoupon.modelUrl} 
                          alt="3D Model"
                          poster={editingCoupon.imageUrl}
                        />
                      </div>
                    )}

                    {/* Image Regeneration Section */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">AI Image Generation</h3>
                      
                      <div className="mb-3">
                        <label htmlFor="edit-image-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                          Image Prompt
                        </label>
                        <textarea
                          id="edit-image-prompt"
                          value={editImagePrompt}
                          onChange={(e) => setEditImagePrompt(e.target.value)}
                          placeholder="Describe the image you want to generate..."
                          rows={3}
                          className="w-full bg-gray-600 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={generateEditImage}
                          disabled={isEditGeneratingImage || !editImagePrompt.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isEditGeneratingImage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {editingCoupon?.imageUrl ? 'Regenerate Image' : 'Generate Image'}
                            </>
                          )}
                        </button>
                        
                        {isEditGeneratingImage && (
                          <button
                            type="button"
                            onClick={cancelEditGeneration}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      {editGenerationStatus && (
                        <div className="mb-3 p-2 bg-blue-800 text-blue-100 rounded text-sm">
                          {editGenerationStatus}
                        </div>
                      )}
                      
                      {editGenerationError && (
                        <div className="mb-3 p-2 bg-red-800 text-red-100 rounded text-sm">
                          {editGenerationError}
                        </div>
                      )}
                      
                      {/* Display generated image */}
                      {editImageUrl && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Generated Image</h4>
                          <div className="relative h-40 bg-gray-800 rounded-md overflow-hidden">
                            <Image 
                              src={editImageUrl}
                              alt="Generated image"
                              fill
                              style={{ objectFit: 'contain' }}
                              className="rounded-md"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 3D Model Generation Section */}
                    {(editingCoupon?.imageUrl || editImageUrl) && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">3D Model Generation</h3>
                        
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={generateEdit3DModel}
                            disabled={isEditGenerating3D || (!editingCoupon?.imageUrl && !editImageUrl)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isEditGenerating3D ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating 3D Model...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                {editingCoupon?.modelUrl ? 'Regenerate 3D Model' : 'Generate 3D Model'}
                              </>
                            )}
                          </button>
                          
                          {isEditGenerating3D && (
                            <button
                              type="button"
                              onClick={cancelEditGeneration}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                        
                        {/* Display generated 3D model */}
                        {editModelUrl && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Generated 3D Model</h4>
                            <div className="bg-gray-800 p-3 rounded-md">
                              <a 
                                href={editModelUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                View Generated 3D Model
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isEditing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEditing ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-5 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Delete Coupon</h2>
                
                {deleteError && (
                  <div className="mb-4 p-2 bg-red-800 text-red-100 rounded text-sm">
                    {deleteError}
                  </div>
                )}
                
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete the coupon <span className="font-medium text-white">&quot;{couponToDelete?.name}&quot;</span>? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelDeleteCoupon}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCoupon}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>Delete</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 