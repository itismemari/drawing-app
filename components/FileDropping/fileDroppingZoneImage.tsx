"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
export default function FileDropzoneImage({ ...props }) {
  const imageref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storedImage, setStoredImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePreview = (file: File) => {
    setStoredImage(file);
    setPreview(URL.createObjectURL(file));
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    imageref.current?.classList.add("border-indigo-600");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    imageref.current?.classList.remove("border-indigo-600");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    imageref.current?.classList.remove("border-indigo-600");

    const file = e.dataTransfer.files[0];
    if (file) handlePreview(file);
  };

  const handleCancel = () => {
    setStoredImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storedImage) return;

    const formData = new FormData();
    formData.append("storedImage", storedImage);

    const res = await fetch("/api/uploadImage", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const link = data.url;

    props.addCard("image" , link);
    props.setSelectedType(null); // optionally close modal after confirm
    
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
    bg-white shadow-2xl rounded-2xl p-6 w-[400px] flex flex-col gap-6 z-30"
    >
      {/* Close button */}
      <button
        className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center 
      shadow hover:bg-gray-600 transition z-20"
        onClick={() => props.setSelectedType(null)}
      >
        ✕
      </button>

      {/* Dropzone */}
      <div
        className="relative border-2 border-gray-300 border-dashed rounded-xl p-6 
      hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
        id="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={imageref}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handlePreview(e.target.files[0]);
            }
          }}
        />
        {!preview && (
          <div className="text-center">
            <img
              className="mx-auto h-12 w-12 opacity-70"
              src="https://www.svgrepo.com/show/357902/image-upload.svg"
              alt="Upload icon"
            />
            <h3 className="mt-3 text-sm font-medium text-gray-900">
              <span className="text-indigo-600">Drag & drop</span> or browse to
              upload
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <Image
            src={preview}
            alt="Preview"
            width={200}
            height={200}
            className="mt-4 mx-auto max-h-48 rounded-lg"
          />
        )}
      </div>
      <div className="flex flex-row justify-center items-center gap-20">
        <button
          className="bg-black text-white p-3 px-5 shadow-md rounded-md cursor-pointer hover:scale-110 transition duration-400 ease"
          onClick={handleConfirm}
        >
          Confirm
        </button>
        <button
          className="bg-white text-black p-3 px-5 border shadow-md rounded-md cursor-pointer hover:scale-110 transition duration-400 ease"
          onClick={handleCancel}
        >
          Cancle
        </button>
      </div>
    </div>
  );
}
