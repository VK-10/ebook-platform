import React from "react";
import Button from "../ui/Button";
import { UploadCloud } from "lucide-react";
import { BASE_URL } from "../../utils/apiPaths";

const BookDetailsTab = ({
  book = {},
  onBookChange = () => {},
  onCoverUpload = () => {},
  isUploading = false,
  fileInputRef = null,
}) => {
  // safe cover image URL handling
  const rawCover = book?.coverImage || "";
  const coverImageUrl =
    rawCover && rawCover.startsWith && rawCover.startsWith("http")
      ? rawCover
      : rawCover
      ? `${BASE_URL}/backend${rawCover}`.replace(/\\/g, "/")
      : "";

  const handleClickUpload = () => {
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Cover Image</h3>
      <div className="mt-3">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="Cover" className="max-w-xs rounded" />
        ) : (
          <div className="w-40 h-56 bg-slate-100 flex items-center justify-center rounded">
            <span>No cover</span>
          </div>
        )}

        <div className="mt-3">
          <p className="mb-2">
            Upload a new cover image. Recommended size: 600x800px.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onCoverUpload}
            className="hidden"
            accept="image/*"
          />

          <Button variant="secondary" onClick={handleClickUpload}>
            <UploadCloud className="mr-2" />
            {isUploading ? "Uploading..." : "Upload new cover"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsTab;