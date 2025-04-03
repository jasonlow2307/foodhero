import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { Upload, X, Image } from "lucide-react";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  folderPath?: string;
}

const ImageUploader = ({
  onImageUploaded,
  folderPath = "food-images",
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { darkMode } = useTheme();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    // Create a unique file name
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `${folderPath}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Track progress
        const progressValue = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progressValue);
      },
      (error) => {
        console.error("Error uploading image:", error);
        setUploading(false);
      },
      async () => {
        // Upload completed
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onImageUploaded(downloadURL);
        setUploading(false);
      }
    );
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={handleButtonClick}
          className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all hover: cursor-pointer 
            ${
              darkMode
                ? "border-gray-700 hover:border-green-600 text-gray-400"
                : "border-gray-300 hover:border-green-400 text-gray-500"
            }`}
          disabled={uploading}
        >
          <Upload size={24} className="mb-2" />
          <span>Upload Food Photo</span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Food preview"
            className="w-full h-32 object-cover rounded-xl"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <div className="text-center text-white">
                <div className="mb-2">Uploading... {progress}%</div>
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/70 text-white hover:bg-red-500/70 transition-colors"
            disabled={uploading}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
