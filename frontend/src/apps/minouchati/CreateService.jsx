import { useState } from 'react';
import './CreateService.css';

export default function CreateService() {
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Graphic Design',
    'Web Development',
    'Writing & Translation',
    'Digital Marketing',
    'Video & Animation',
    'Music & Audio',
    'Programming & Tech',
    'Business',
    'Lifestyle',
    'Other'
  ];

  const MAX_FILE_SIZE = 10 * 1024 * 1024; 
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4'];
  const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, 'application/pdf'];
  const MAX_FILES = 5;
  const MAX_VIDEOS = 1;

  const validateForm = () => {
    const newErrors = {};

    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    } else if (serviceName.trim().length < 3) {
      newErrors.serviceName = 'Service name must be at least 3 characters';
    } else if (serviceName.trim().length > 100) {
      newErrors.serviceName = 'Service name must be less than 100 characters';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    } else if (category === 'Other' && !customCategory.trim()) {
      newErrors.customCategory = 'Please specify your category';
    } else if (category === 'Other' && customCategory.trim().length < 3) {
      newErrors.customCategory = 'Custom category must be at least 3 characters';
    } else if (category === 'Other' && customCategory.trim().length > 50) {
      newErrors.customCategory = 'Custom category must be less than 50 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (files.length === 0) {
      newErrors.files = 'Please upload at least one image or video for your service';
    } else {
      const videoCount = files.filter(f => ALLOWED_VIDEO_TYPES.includes(f.type)).length;
      if (videoCount > MAX_VIDEOS) {
        newErrors.files = `You can upload at most ${MAX_VIDEOS} video`;
      }
      for (const f of files) {
        if (f.size > MAX_FILE_SIZE) {
          newErrors.files = `Each file must be under 10MB. "${f.name}" is too large.`;
          break;
        }
        if (!ALLOWED_FILE_TYPES.includes(f.type)) {
          newErrors.files = `Invalid file type for "${f.name}". Accepted: PNG, JPG, WEBP, MP4, PDF`;
          break;
        }
      }
    }

    if (!price) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 1) {
        newErrors.price = 'Price must be at least 1 coin';
      } else if (priceNum > 10000) {
        newErrors.price = 'Price cannot exceed 10,000 coins';
      } else if (!Number.isInteger(priceNum)) {
        newErrors.price = 'Price must be a whole number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (!selectedFiles.length) return;
    setErrors(prev => ({ ...prev, files: null }));

    const combined = [...files];
    for (const f of selectedFiles) {
      if (combined.length >= MAX_FILES) {
        setErrors(prev => ({ ...prev, files: `Maximum ${MAX_FILES} files allowed` }));
        break;
      }
      if (f.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, files: `"${f.name}" exceeds 10MB limit` }));
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(f.type)) {
        setErrors(prev => ({ ...prev, files: `"${f.name}" has an unsupported file type` }));
        continue;
      }
      const existingVideos = combined.filter(ef => ALLOWED_VIDEO_TYPES.includes(ef.type)).length;
      if (ALLOWED_VIDEO_TYPES.includes(f.type) && existingVideos >= MAX_VIDEOS) {
        setErrors(prev => ({ ...prev, files: `Only ${MAX_VIDEOS} video allowed` }));
        continue;
      }
      combined.push(f);
    }
    setFiles(combined);
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const finalCategory = category === 'Other' ? customCategory : category;
    
    try {
      
      console.log({ serviceName, category: finalCategory, description, price, files });
      alert('Service created successfully!');
      handleCancel(); 
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: 'Failed to create service. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const finalCategory = category === 'Other' ? customCategory : category;
    console.log({ serviceName, category: finalCategory, description, price, files });
    alert('Service saved as draft!');
  };

  const handleCancel = () => {
    setServiceName('');
    setCategory('');
    setCustomCategory('');
    setDescription('');
    setPrice('');
    setFiles([]);
    setErrors({});
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setErrors(prev => ({ ...prev, category: null, customCategory: null }));
    if (e.target.value !== 'Other') {
      setCustomCategory('');
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="create-service-container">
      <div className="create-service-header">
        <h2 className="create-service-subtitle">Create New Service</h2>
        <p className="create-service-description">
          List your service and start earning costs by helping others.
        </p>
      </div>

      <div className="divider"></div>
    
      <form onSubmit={handleSubmit} className="create-service-form">
        {errors.submit && (
          <div className="form-error-banner">{errors.submit}</div>
        )}
        <div className="BG">
          
          <div className="form-section">
            <label className="form-label">
              Service Name *
              <input
                type="text"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  clearFieldError('serviceName');
                }}
                placeholder="e.g., Professional Logo Design"
                className={`form-input ${errors.serviceName ? 'input-error' : ''}`}
                maxLength={100}
              />
              {errors.serviceName && <span className="error-text">{errors.serviceName}</span>}
              <span className="char-count">{serviceName.length}/100</span>
            </label>
          </div>

          <div className="form-section">
            <label className="form-label">
              Category *
              <select
                value={category}
                onChange={handleCategoryChange}
                className={`form-select ${errors.category ? 'input-error' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="error-text">{errors.category}</span>}
            </label>

            {category === 'Other' && (
              <div className="form-section" style={{marginTop: '15px'}}>
                <label className="form-label">
                  Please specify your service category *
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      clearFieldError('customCategory');
                    }}
                    placeholder="e.g., Personal Training, Event Planning, Consulting..."
                    className={`form-input ${errors.customCategory ? 'input-error' : ''}`}
                    maxLength={50}
                  />
                  {errors.customCategory && <span className="error-text">{errors.customCategory}</span>}
                </label>
              </div>
            )}
          </div>

          <div className="form-section">
            <label className="form-label">
              Description *
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError('description');
                }}
                placeholder="Describe your service in detail. What will you deliver? What's included? (Min 50 characters)"
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows="6"
                maxLength={2000}
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
              <span className="char-count">{description.length}/2000 (min 50)</span>
            </label>
          </div>

          <div className="form-section">
            <label className="form-label">
              Service Media (Images &amp; Videos) *
              <p className="upload-description">
                Upload images and/or a video to showcase your service. You can select multiple files at once (up to {MAX_FILES} files, max {MAX_VIDEOS} video).
              </p>
              
              <div className={`file-upload-area ${errors.files ? 'upload-error' : ''}`}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="file-input"
                  id="file-upload"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4"
                  multiple
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <div className="upload-content">
                    <svg width="64" height="52" viewBox="0 0 64 52" fill="none">
                      <path d="M0 26C0 11.6406 11.6406 0 26 0L38 0C52.3594 0 64 11.6406 64 26C64 40.3594 52.3594 52 38 52H26C11.6406 52 0 40.3594 0 26Z" fill="#F3F4F6"/>
                      <path d="M25.3334 31.333C24.0201 31.3345 22.7524 30.8513 21.7733 29.9761C20.7941 29.1009 20.1723 27.8952 20.0269 26.5899C19.8816 25.2847 20.2229 23.9717 20.9856 22.9025C21.7483 21.8334 22.8786 21.0832 24.1601 20.7957C23.7893 19.0665 24.1207 17.2608 25.0812 15.7759C26.0418 14.291 27.5529 13.2485 29.2821 12.8777C31.0113 12.5069 32.817 12.8383 34.3019 13.7988C35.7868 14.7594 36.8293 16.2705 37.2001 17.9997H37.3334C38.9867 17.998 40.5816 18.6108 41.8085 19.7189C43.0355 20.827 43.8069 22.3515 43.973 23.9964C44.1392 25.6413 43.6882 27.2892 42.7077 28.6203C41.7271 29.9514 40.287 30.8707 38.6668 31.1997M36.0001 27.333L32.0001 23.333M32.0001 23.333L28.0001 27.333M32.0001 23.333V39.333" stroke="#99A1AF" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>Click to upload or drag and drop</p>
                    <span>PNG, JPG, WEBP, MP4, or PDF — up to {MAX_FILES} files, {MAX_VIDEOS} video max (10MB each)</span>
                  </div>
                </label>
                
                {files.length > 0 && (
                  <div className="files-preview-grid">
                    {files.map((f, idx) => (
                      <div key={idx} className="file-preview">
                        <span>
                          {ALLOWED_VIDEO_TYPES.includes(f.type) ? '🎬' : '🖼️'} {f.name}
                          <span style={{color: '#95938e', fontSize: '11px', marginLeft: '4px'}}>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="remove-file-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {files.length > 0 && (
                <span className="char-count">{files.length}/{MAX_FILES} files selected</span>
              )}
              {errors.files && <span className="error-text">{errors.files}</span>}
            </label>
          </div>

          <div className="form-section">
            <label className="form-label">
              Price in Costs *
              <div className="price-input-container">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    clearFieldError('price');
                  }}
                  placeholder="..."
                  className={`form-input price-input ${errors.price ? 'input-error' : ''}`}
                  min="1"
                  max="10000"
                  step="1"
                />
              </div>
              {errors.price && <span className="error-text">{errors.price}</span>}
              <p className="price-suggestion">
                Suggested price range: 50-500 coins based on your category
              </p>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="save-draft-btn" onClick={handleSaveDraft}>
            Save as Draft
          </button>
          <div className="cancel-publish-container">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="publish-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Service'}
            </button>
          </div>
        </div>
      </form>

      <div className="tips-section">
        <h3 className="tips-title">Tips for a Great Service Listing</h3>
        <ul className="tips-list">
          <li>Use a clear description that highlights what you offer.</li>
          <li>Upload multiple images and a video to showcase your work effectively.</li>
          <li>Write a detailed description explaining deliverables and benefits.</li>
          <li>Set a competitive price based on the complexity of your service.</li>
        </ul>
      </div>
    </div>
  );
}