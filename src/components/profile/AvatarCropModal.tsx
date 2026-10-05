import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  Loader2,
  Move,
} from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => Promise<void>;
  isSaving?: boolean;
}

const OUTPUT_SIZE = 512; // Standar industri untuk avatar web/app (512x512)

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isSaving = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Muat berkas gambar saat imageSrc berubah
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImage(null);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Gambar preview interaktif pada Canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Hitung skala dasar agar gambar menutupi kanvas (cover fit)
    const isRotated90or270 = rotation % 180 !== 0;
    const imgWidth = isRotated90or270 ? image.naturalHeight : image.naturalWidth;
    const imgHeight = isRotated90or270 ? image.naturalWidth : image.naturalHeight;

    const baseScale = Math.max(size / imgWidth, size / imgHeight);
    const currentScale = baseScale * zoom;

    const drawW = image.naturalWidth * currentScale;
    const drawH = image.naturalHeight * currentScale;

    // Geser posisi relatif rotasi
    ctx.drawImage(
      image,
      -drawW / 2 + (isRotated90or270 ? position.y : position.x),
      -drawH / 2 + (isRotated90or270 ? position.x : position.y),
      drawW,
      drawH
    );

    ctx.restore();
  }, [image, zoom, rotation, position]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Handle Drag / Pan Mouse & Touch
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSaving) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isSaving) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSaving || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isSaving || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Ekspor hasil potongan berkualitas tinggi 512x512 WebP
  const handleApplyCrop = async () => {
    if (!image || isSaving) return;

    // Kanvas resolusi tinggi 512x512 standar industri
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = OUTPUT_SIZE;
    exportCanvas.height = OUTPUT_SIZE;

    const ctx = exportCanvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const isRotated = rotation % 180 !== 0;
    const imgW = isRotated ? image.naturalHeight : image.naturalWidth;
    const imgH = isRotated ? image.naturalWidth : image.naturalHeight;

    const baseScale = Math.max(OUTPUT_SIZE / imgW, OUTPUT_SIZE / imgH);
    const currentScale = baseScale * zoom;

    const drawW = image.naturalWidth * currentScale;
    const drawH = image.naturalHeight * currentScale;

    // Konversi rasio preview canvas (e.g. 320px) ke export canvas (512px)
    const previewSize = canvasRef.current?.width || 320;
    const ratio = OUTPUT_SIZE / previewSize;

    const adjustedX = position.x * ratio;
    const adjustedY = position.y * ratio;

    ctx.drawImage(
      image,
      -drawW / 2 + (isRotated ? adjustedY : adjustedX),
      -drawH / 2 + (isRotated ? adjustedX : adjustedY),
      drawW,
      drawH
    );
    ctx.restore();

    exportCanvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `avatar-${Date.now()}.webp`, {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        await onCropComplete(croppedFile);
      },
      'image/webp',
      0.9
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Sesuaikan Foto Profil
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Geser dan perbesar untuk menyesuaikan posisi foto Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Canvas Crop Area */}
        <div className="my-4 flex flex-col items-center justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl bg-brand-900 overflow-hidden select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Kanvas Gambar */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full object-cover"
            />

            {/* Circular Mask & Crosshair Guidelines */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Outer dark overlay with circular transparent hole */}
              <div
                className="w-full h-full"
                style={{
                  boxShadow: '0 0 0 9999px rgba(48, 56, 65, 0.65)',
                  borderRadius: '50%',
                  width: '82%',
                  height: '82%',
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                }}
              />
            </div>

            {/* Hint drag */}
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] text-white/90 flex items-center gap-1.5 font-medium shadow-xs">
              <Move className="w-3 h-3" />
              <span>Geser untuk memindahkan</span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-3 px-1">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 1))}
              disabled={zoom <= 1 || isSaving}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={isSaving}
              className="flex-1 accent-brand cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
              disabled={zoom >= 3 || isSaving}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                title="Putar 90 derajat"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Putar</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                title="Reset posisi dan zoom"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">Resolusi: 512×512 px</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 min-h-[38px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand hover:bg-brand-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan Foto...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan & Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
