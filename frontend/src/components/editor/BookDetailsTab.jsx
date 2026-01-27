import React from "react";
import Button from "../ui/Button";
import { UploadCloud } from "lucide-react";
import { BASE_URL } from "../../utils/apiPaths";
import InputField from "../ui/InputField";

const BookDetailsTab = ({
  book,
  onBookChange,
  onCoverUpload,
  isUploading,
  fileInputRef,
}) => {
  // safe cover image URL handling
  const rawCover = book?.coverImage || "";
  const coverImageUrl =
    rawCover && rawCover.startsWith?.("http")
      ? rawCover
      : rawCover
      ? `${BASE_URL}/backend${rawCover}`.replace(/\\/g, "/")
      : "";

  const handleClickUpload = () => {
    fileInputRef?.current?.click();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold">Book Details</h3>

      <InputField
        label="Title"
        name="title"
        value={book.title || ""}
        onChange={onBookChange}
        className="mt-3"
      />

      <InputField
        label="Author"
        name="author"
        value={book.author || ""}
        onChange={onBookChange}
        className="mt-3"
      />

      <div className="mt-3">
        <InputField
          label="Subtitle"
          name="subtitle"
          value={book.subtitle || ""}
          onChange={onBookChange}
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">Cover Image</h3>

        <div className="mt-3">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt="Cover"
              className="max-w-xs rounded"
            />
          ) : (
            <div className="w-40 h-56 bg-slate-100 flex items-center justify-center rounded">
              <span>No cover</span>
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="mb-2">
            Upload a new cover image. Recommended size: 600×800px.
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