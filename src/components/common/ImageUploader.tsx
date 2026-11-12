import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { readAndCompressImageFile } from '../../lib/imageUploadService';

interface ImageUploaderProps {
  label: string;
  helperText?: string;
  value: string;
  onChange: (newDataUrl: string) => void;
  variant?: 'avatar' | 'banner';
  fallbackInitials?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  helperText,
  value,
  onChange,
  variant = 'avatar',
  fallbackInitials = 'DC',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setIsProcessing(true);
    try {
      const options =
        variant === 'banner'
          ? { maxWidth: 960, maxHeight: 360, quality: 0.85 }
          : { maxWidth: 256, maxHeight: 256, quality: 0.88 };
      const dataUrl = await readAndCompressImageFile(file, options);
      onChange(dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Could not upload image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await handleFile(droppedFile);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#A19DAD] block">{label}</label>
        {helperText && (
          <span className="text-[10px] font-mono text-[#706C7B]">{helperText}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled || isProcessing}
        className="hidden"
      />

      {variant === 'avatar' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-3 rounded-lg bg-[#101014] border transition-colors flex items-center justify-between gap-3 ${
            isDragging
              ? 'border-[#8957F5] bg-[#17171F]'
              : 'border-[#282631] hover:border-[#8957F5]/40'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="relative w-12 h-12 rounded-xl bg-[#17171F] border border-[#282631] flex items-center justify-center overflow-hidden shrink-0 group focus:outline-none focus:border-[#8957F5]"
              title="Click to upload image"
            >
              {value ? (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#8957F5]">
                  {fallbackInitials.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-white" />
                )}
              </div>
            </button>

            <div className="min-w-0">
              <div className="text-xs font-medium text-[#F5F3FA] truncate">
                {value ? 'Custom Image Uploaded' : 'Upload from your device'}
              </div>
              <p className="text-[11px] text-[#706C7B]">
                PNG, JPG, WEBP, or GIF (drag & drop or browse)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#F5F3FA] text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 text-[#8957F5] animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#8957F5]" />
              )}
              <span>{value ? 'Change' : 'Upload Image'}</span>
            </button>

            {value && !disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Remove Image"
                className="h-7 px-2 rounded-md bg-[#17171F] hover:bg-[#ED4245]/15 border border-[#282631] hover:border-[#ED4245]/40 text-[#A19DAD] hover:text-[#ED4245] text-[11px] flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-lg bg-[#101014] border overflow-hidden transition-colors ${
            isDragging
              ? 'border-[#8957F5] bg-[#17171F]'
              : 'border-[#282631] hover:border-[#8957F5]/40'
          }`}
        >
          <div
            onClick={() => {
              if (!disabled && !isProcessing) fileInputRef.current?.click();
            }}
            className="h-24 w-full relative bg-[#17171F] flex items-center justify-center cursor-pointer group overflow-hidden"
          >
            {value ? (
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-[#706C7B] group-hover:text-[#F5F3FA] transition-colors">
                <ImageIcon className="w-5 h-5 text-[#8957F5]" />
                <span className="text-[11px] font-medium">
                  Click or drag & drop to upload banner image
                </span>
                <span className="text-[10px] font-mono text-[#706C7B]">
                  Recommended 960×320 · PNG, JPG, WEBP, GIF
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {isProcessing ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-[#101014]/90 border border-[#282631] text-[11px] font-medium text-[#F5F3FA] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#8957F5]" />
                  <span>{value ? 'Change Banner Image' : 'Select Banner Image'}</span>
                </span>
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-[#282631] flex items-center justify-between gap-2 bg-[#101014]">
            <span className="text-[11px] text-[#706C7B] truncate">
              {value ? 'Custom banner uploaded' : 'No custom banner uploaded'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={disabled || isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#F5F3FA] text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Upload className="w-3 h-3 text-[#8957F5]" />
                <span>{value ? 'Replace' : 'Upload Banner'}</span>
              </button>
              {value && !disabled && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  title="Remove Banner"
                  className="h-7 px-2 rounded-md bg-[#17171F] hover:bg-[#ED4245]/15 border border-[#282631] hover:border-[#ED4245]/40 text-[#A19DAD] hover:text-[#ED4245] text-[11px] flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-[#ED4245] font-medium">{error}</p>
      )}
    </div>
  );
};
