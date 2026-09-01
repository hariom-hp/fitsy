import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X, Sparkles, CheckCircle2, ShieldCheck, Download, ShoppingBag, ArrowRight, UserCheck, Eye, Layers } from 'lucide-react';
import { warpImageQuad } from '../utils/triangleWarp';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { estimateBodyPositionSAM2, generateTryOnNeural, processTryOnModalCloud } from '../services/tryOnService';

const L = { lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24 };
const GARMENT_SRC = { top: 0.08, bottom: 0.92, halfWidth: 0.34 };

const SAMPLE_MODELS = [
  { id: 'm1', name: 'Studio Model A (Female)', gender: 'Female', height: "5'9\"", size: 'M', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80' },
  { id: 'm2', name: 'Studio Model B (Male)', gender: 'Male', height: "6'1\"", size: 'L', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80' },
  { id: 'm3', name: 'Studio Model C (Full Body)', gender: 'Female', height: "5'10\"", size: 'S', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('Image source is missing.'));
    const img = new Image();
    if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin in case CORS header is missing on asset
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => reject(new Error('Failed to load image asset.'));
      fallback.src = src;
    };
    img.src = src;
  });
}

// Downscaled JPEG data-URL for the backend payload (pose is normalized, so a
// smaller image is faster and still accurate; full-res photo stays for canvas).
function toDataUrlScaled(img, max = 1024) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s);
  const h = Math.round(img.naturalHeight * s);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.9);
}

// Remove a plain product-shot background by flood-filling inward from the
// image borders: only pixels *connected to the edge* and close to the corner
// color are cleared. This keeps the garment intact even when its color is
// similar to the background (a global color key would delete the shirt too).
// Prepare garment image canvas, preserving transparency for PNGs and
// removing plain studio backgrounds for photos.
function cutoutBackground(img) {
  const W = img.naturalWidth || img.width || 800;
  const H = img.naturalHeight || img.height || 800;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, W, H);

  try {
    const d = x.getImageData(0, 0, W, H);
    const p = d.data;

    // Check if the image is already a transparent PNG
    let transparentCount = 0;
    for (let i = 3; i < p.length; i += 40) {
      if (p[i] < 30) transparentCount++;
    }

    // If already transparent, do not modify
    if (transparentCount > 5) {
      return c;
    }

    // Reference background color = average of the 4 corners
    const corners = [0, (W - 1) * 4, (H - 1) * W * 4, (W * H - 1) * 4];
    let br = 0, bg = 0, bb = 0;
    for (const i of corners) {
      br += p[i];
      bg += p[i + 1];
      bb += p[i + 2];
    }
    br /= 4;
    bg /= 4;
    bb /= 4;

    const TOL2 = 50 * 50;
    const near = (i) => {
      const dr = p[i] - br,
        dg = p[i + 1] - bg,
        db = p[i + 2] - bb;
      return dr * dr + dg * dg + db * db < TOL2;
    };

    const visited = new Uint8Array(W * H);
    const stack = [];
    const seed = (px) => {
      if (!visited[px] && near(px * 4)) {
        visited[px] = 1;
        stack.push(px);
      }
    };
    for (let xi = 0; xi < W; xi++) {
      seed(xi);
      seed((H - 1) * W + xi);
    }
    for (let yi = 0; yi < H; yi++) {
      seed(yi * W);
      seed(yi * W + W - 1);
    }

    while (stack.length) {
      const px = stack.pop();
      p[px * 4 + 3] = 0;
      const py = (px / W) | 0,
        pxCol = px % W;
      if (pxCol > 0) seed(px - 1);
      if (pxCol < W - 1) seed(px + 1);
      if (py > 0) seed(px - W);
      if (py < H - 1) seed(px + W);
    }

    x.putImageData(d, 0, 0);
  } catch (err) {
    console.warn('[GarmentTryOn] Background cutout fallback:', err);
  }
  return c;
}

function torsoQuad(lm, w, h, fit) {
  const p = (i) => {
    const pt = lm[i];
    if (!pt) return { x: w / 2, y: h / 2 };
    let x = pt.x;
    let y = pt.y;
    if (x <= 1.0) x = x * w;
    else if (x > w) x = (x / 1024) * w;
    if (y <= 1.0) y = y * h;
    else if (y > h) y = (y / 1024) * h;
    return { x, y };
  };
  const ls = p(L.lShoulder);
  const rs = p(L.rShoulder);
  const lh = p(L.lHip);
  const rh = p(L.rHip);

  const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };

  const axis = { x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y };
  const len = Math.hypot(axis.x, axis.y) || 1;
  const up = { x: axis.x / len, y: axis.y / len };
  const side = { x: -up.y, y: up.x };

  const shoulderW = Math.hypot(rs.x - ls.x, rs.y - ls.y);
  // Scale width to cover full shoulder width + armholes
  const halfW = Math.max(w * 0.22, (shoulderW / 2) * 1.35 * fit.widen);

  // Position collar around neck base (above shoulder line) + user Y offset
  const yShiftPx = (fit.offsetY || 0) * (len / 100);
  const top = {
    x: shoulderMid.x - up.x * (len * 0.32 + yShiftPx),
    y: shoulderMid.y - up.y * (len * 0.32 + yShiftPx),
  };
  const bottom = {
    x: shoulderMid.x + up.x * (len * 1.15 * fit.lengthen - yShiftPx),
    y: shoulderMid.y + up.y * (len * 1.15 * fit.lengthen - yShiftPx),
  };

  const TL = { x: top.x - side.x * halfW, y: top.y - side.y * halfW };
  const TR = { x: top.x + side.x * halfW, y: top.y + side.y * halfW };
  const BR = { x: bottom.x + side.x * halfW, y: bottom.y + side.y * halfW };
  const BL = { x: bottom.x - side.x * halfW, y: bottom.y - side.y * halfW };
  return [
    [TL.x, TL.y],
    [TR.x, TR.y],
    [BR.x, BR.y],
    [BL.x, BL.y],
  ];
}

export default function GarmentTryOn({ product, onClose }) {
  const { addToCart } = useStore();
  const { isAuthenticated } = useAuth();

  const canvasRef = useRef(null);
  const photoRef = useRef(null);
  const landmarksRef = useRef(null);
  const garmentRef = useRef(null);
  const samMaskImgRef = useRef(null);
  const resultImgRef = useRef(null); // neural VTON output image

  const [step, setStep] = useState(1); // 1: Upload/Select -> 2: Generating -> 3: Result
  const [status, setStatus] = useState('idle'); // idle | detecting | ready | error
  const [progress, setProgress] = useState(0);
  const [genMessage, setGenMessage] = useState('Analyzing body posture on Python backend...');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [sam2Result, setSam2Result] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);

  // Render the FLUX GPU result onto canvas
  useEffect(() => {
    if (status !== 'ready' || step !== 3) return;
    const canvas = canvasRef.current;
    if (!canvas || !resultImgRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = resultImgRef.current;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0);
  }, [status, step]);

  async function processImage(photoSrc) {
    setStep(2);
    setStatus('detecting');
    setProgress(10);
    setGenMessage('Loading your photo...');
    setErrorMessage('');
    setSam2Result(null);
    setGenerationTime(null);

    try {
      const photo = await loadImage(photoSrc);
      photoRef.current = photo;
      const garmentImg = await loadImage(product.image);

      // Step 1: Pose estimation (for metrics panel)
      setProgress(20);
      setGenMessage('Analyzing body pose on backend...');
      try {
        const samData = await estimateBodyPositionSAM2(toDataUrlScaled(photo));
        setSam2Result(samData);
      } catch (backendErr) {
        console.warn('Pose estimation error (non-fatal):', backendErr);
      }

      // Step 2: Photorealistic AI Try-On on GPU
      setProgress(40);
      setGenMessage('Rendering photorealistic virtual look on Cloud GPU...');

      const category = product?.vtoType === 'lower-body' ? 'lower_body' : 'upper_body';
      const t0 = Date.now();

      const neuralImage = await generateTryOnNeural({
        human: toDataUrlScaled(photo),
        garment: toDataUrlScaled(garmentImg),
        category,
        garment_desc: product?.name || '',
      });

      setGenerationTime(((Date.now() - t0) / 1000).toFixed(1));

      if (!neuralImage) {
        throw new Error('AI try-on engine returned empty result.');
      }

      setProgress(90);
      setGenMessage('Finalizing HD render...');

      resultImgRef.current = await loadImage(neuralImage);
      setProgress(100);

      setTimeout(() => {
        setStatus('ready');
        setStep(3);
      }, 300);
    } catch (err) {
      console.error('AI Try-On error:', err);
      setStatus('error');
      setStep(1);
      setErrorMessage(
        err.message?.includes('timed out')
          ? 'AI GPU container is initializing. Please try again in 1 minute.'
          : err.message || 'Failed to generate try-on. Please try again.'
      );
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSelectSampleModel(modelImg) {
    processImage(modelImg);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `FITSY-Virtual-TryOn-${product.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function handleAddToCartLook() {
    if (!isAuthenticated) {
      alert('Please sign in to save outfit to cart.');
      return;
    }
    await addToCart({ product, size: selectedSize });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface border border-outline-variant/60 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                FITSY AI Virtual Try-On
              </h2>
              <p className="text-xs text-on-surface-variant">
                High-Precision AI Virtual Try-On Engine
              </p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className={step >= 1 ? 'text-primary' : ''}>1. Photo</span>
            <span>&rarr;</span>
            <span className={step >= 2 ? 'text-primary' : ''}>2. Render</span>
            <span>&rarr;</span>
            <span className={step === 3 ? 'text-primary' : ''}>3. Result</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Upload Photo or Select Sample Model */}
          {step === 1 && (
            <div className="space-y-8">
              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 text-xs font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Selected Product Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Selected Garment</span>
                  <h4 className="font-bold text-sm text-on-surface">{product.name}</h4>
                  <p className="text-xs text-on-surface-variant">${product.price} • {product.category}</p>
                </div>
              </div>

              {/* Photo Upload Zone */}
              <div className="border-2 border-dashed border-primary/40 rounded-3xl p-8 text-center bg-surface-container-lowest hover:border-primary transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-on-surface">Drag &amp; Drop or Click to Upload Your Photo</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  For optimal results, upload a clear, front-facing portrait or full-body picture.
                </p>
              </div>

              {/* Sample Studio Models Selector */}
              <div>
                <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" /> Don't have a photo? Select a Studio Model
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {SAMPLE_MODELS.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleSelectSampleModel(model.img)}
                      className="group cursor-pointer rounded-2xl border border-outline-variant/40 bg-surface overflow-hidden hover:border-primary hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[3/4] bg-surface-container overflow-hidden relative">
                        <img src={model.img} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                          <p className="font-bold text-xs">{model.name}</p>
                          <p className="text-[10px] text-white/80">{model.gender} • Height {model.height}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Generating AI Look Loader */}
          {step === 2 && (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-on-surface">Generating Your Virtual Look...</h3>
                <p className="text-xs text-on-surface-variant mt-1">{genMessage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/30">
                <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>

              <p className="text-xs text-primary font-bold">{progress}% Complete</p>
            </div>
          )}

          {/* Step 3: Virtual Try-On Result */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Canvas Render View */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-black max-h-[500px] flex items-center justify-center group w-full">
                  <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain" />

                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    FITSY Neural AI Try-On
                  </div>

                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AI Generated
                  </div>

                  {generationTime && (
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                      ⚡ {generationTime}s AI Render
                    </div>
                  )}
                </div>
              </div>

              {/* AI Inference Details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> AI Try-On Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Engine</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 text-right">
                        FITSY Neural VTON Engine
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Hardware</span>
                      <span className="font-bold text-emerald-600">High-Performance Cloud GPU</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Inference Time</span>
                      <span className="font-bold text-emerald-600">
                        {generationTime ? `${generationTime}s` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Resolution</span>
                      <span className="font-bold text-primary">1024 × 1024 HD</span>
                    </div>
                    {sam2Result?.fitMetrics?.poseVisibility != null && (
                      <div className="flex justify-between py-1">
                        <span className="text-on-surface-variant">Pose Visibility</span>
                        <span className="font-bold text-primary">
                          {(sam2Result.fitMetrics.poseVisibility * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regenerate Button */}
                <button
                  onClick={() => { if (photoRef.current) processImage(photoRef.current.src); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-primary text-white font-bold text-xs shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate Look (New Seed)
                </button>

                <div className="space-y-2">
                  <button
                    onClick={handleAddToCartLook}
                    className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add Outfit to Bag (${product.price})
                  </button>

                  {addedSuccess && (
                    <p className="text-xs text-emerald-600 font-bold text-center">
                      ✓ Outfit added to your bag!
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownload}
                      className="py-2.5 rounded-full bg-surface border border-outline-variant text-on-surface font-bold text-xs hover:border-primary flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Look
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="py-2.5 rounded-full bg-surface border border-outline-variant text-on-surface font-bold text-xs hover:border-primary flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Change Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
