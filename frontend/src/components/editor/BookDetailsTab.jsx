import React from 'react'
import Button from "../ui/Button";
import { UploadCloud } from "lucide-react";
import { BASE_URL } from "../../utils/apiPaths";


const BookDetailsTab = ({
    book,
    onBookChange,
    onCoverUpload,
    isUploading,
    fileInputRef,
}) => {
  const coverImageUrl = book.coverImage.startsWith('http')
  ? book.coverImage
  : `${BASE_URL}/backend${book.coverImage}`.replace(/\\/g, '/');


  return <div className=''>
    <div className=''>
      <h3 className=''>Book Details</h3>
      <div className=''>
        <Inputfield label="Title" name="title" value={book.title} onChange={onBookChange} />
        <Inputfield label="Author" name="author" value={book.author} onChange={onBookChange} />

        <div className=''>
          <Inputfield label="Subtitle" name="subtitle" value={book.subtitle || ''} onChange={onBookChange} />
        </div>
        
      </div>
    </div>

    <div className=''>
      <h3 className=''>Cover Image</h3>
      <div className=''>
        <img src={coverImageUrl} alt="Cover" className=''/>
        <div>
          <p className=''>Upload a new cover image. Recommended size: 600x800px.</p>
          <input type ="file" ref = {fileInputRef} onChange={onCoverUpload} classname="" accept="image/*"/>
          <Button variant="secondary" onClick={() => fileInputRef}
        </div>
      </div>
    </div>
  </div>
  
}

export default BookDetailsTab