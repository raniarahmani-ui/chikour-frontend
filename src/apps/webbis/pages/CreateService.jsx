import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/CreateService.css';
import UserSidebar from '../../swapie_project/components/Sidebar/Usersidebar.jsx';

const API_BASE_URL = "/api";

const VALID_SKILLS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'PHP', 'MySQL', 'MongoDB',
  'HTML/CSS', 'TypeScript', 'Vue.js', 'Angular', 'Django', 'Laravel', 'Flutter',
  'Swift', 'Kotlin', 'C++', 'C#', '.NET', 'Ruby', 'Go', 'Rust', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'Git', 'Linux', 'SQL', 'NoSQL', 'GraphQL', 'REST API',
  'UI Design', 'UX Design', 'Graphic Design', 'Logo Design', 'Photoshop',
  'Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'After Effects', 'Premiere Pro',
  'Video Editing', '3D Modeling', 'Animation', 'Motion Graphics', 'Branding',
  'Content Writing', 'Copywriting', 'SEO Writing', 'Technical Writing',
  'Blog Writing', 'Ghostwriting', 'Editing', 'Proofreading', 'Translation',
  'Social Media Marketing', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads',
  'Email Marketing', 'Content Marketing', 'Affiliate Marketing', 'Analytics',
  'Data Analysis', 'Excel', 'Power BI', 'Tableau', 'Machine Learning', 'AI',
  'Project Management', 'Agile', 'Scrum', 'Business Analysis', 'Consulting',
  'Customer Service', 'Sales', 'Accounting', 'Finance', 'Legal', 'HR',
  'Teaching', 'Tutoring', 'Coaching', 'Mentoring', 'Public Speaking',
  'Photography', 'Music Production', 'Voice Over', 'Transcription', 'Other'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, 'application/pdf'];
const MAX_FILES = 5;
const MAX_VIDEOS = 1;

export default function CreateService() {
  const navigate = useNavigate();
  const location = useLocation();
  const editService = location.state?.editService;
  const isEditMode = !!editService;
  const [serviceTitle, setServiceTitle] = useState(editService?.title || '');
  const [category, setCategory] = useState(editService?.category_name || '');
  const [categoryId, setCategoryId] = useState(editService?.category_id?.toString() || '');
  const [description, setDescription] = useState(editService?.description || '');
  const [price, setPrice] = useState(editService?.price?.toString() || '');
  const [skillsOffered, setSkillsOffered] = useState(() => {
    if (!editService?.tags) return [];
    try {
      const parsed = typeof editService.tags === 'string' ? JSON.parse(editService.tags) : editService.tags;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
    }

    loadCategories();
    loadDrafts();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/public`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Design' },
        { id: 3, name: 'Writing' },
        { id: 4, name: 'Marketing' },
        { id: 5, name: 'Education' },
        { id: 6, name: 'Business' },
        { id: 7, name: 'Lifestyle' },
        { id: 8, name: 'Other' }
      ]);
    }
  };

  const loadDrafts = () => {
    const savedDrafts = localStorage.getItem('serviceDrafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  };

  const validateForm = (isDraft = false) => {
    const newErrors = {};

    if (isDraft) {
      if (!serviceTitle.trim() && !description.trim()) {
        newErrors.draft = 'Please enter at least a title or description to save as draft';
        setErrors(newErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    if (!serviceTitle.trim()) {
      newErrors.serviceTitle = 'Title is required';
    } else if (serviceTitle.trim().length < 10) {
      newErrors.serviceTitle = 'Title must be at least 10 characters';
    } else if (serviceTitle.trim().length > 150) {
      newErrors.serviceTitle = 'Title must be less than 150 characters';
    }

    if (!categoryId) {
      newErrors.category = 'Please select a category';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (description.trim().length > 3000) {
      newErrors.description = 'Description must be less than 3000 characters';
    }

    if (!price) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 1) {
        newErrors.price = 'Price must be at least 1 coin';
      } else if (!Number.isInteger(priceNum)) {
        newErrors.price = 'Price must be a whole number (no decimals)';
      } else if (priceNum > 100000) {
        newErrors.price = 'Price cannot exceed 100,000 coins';
      }
    }

    if (skillsOffered.length === 0) {
      newErrors.skills = 'Please add at least one skill you offer';
    } else {
      const invalidSkills = skillsOffered.filter(skill => !VALID_SKILLS.includes(skill));
      if (invalidSkills.length > 0) {
        newErrors.skills = `Invalid skills: ${invalidSkills.join(', ')}. Please select from the suggestions.`;
      }
    }

    if (files.length > 0) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSkillInput = (value) => {
    setCurrentSkill(value);
    if (value.trim().length >= 1) {
      const filtered = VALID_SKILLS.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !skillsOffered.includes(skill)
      ).slice(0, 8);
      setSkillSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    if (skill && VALID_SKILLS.includes(skill) && !skillsOffered.includes(skill)) {
      if (skillsOffered.length >= 10) {
        setErrors(prev => ({ ...prev, skills: 'Maximum 10 skills allowed' }));
        return;
      }
      setSkillsOffered([...skillsOffered, skill]);
      setCurrentSkill('');
      setShowSuggestions(false);
      setSkillSuggestions([]);
      clearFieldError('skills');
    } else if (skill && !VALID_SKILLS.includes(skill)) {
      setErrors(prev => ({ ...prev, skills: 'Please select a valid skill from the suggestions' }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsOffered(skillsOffered.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (skillSuggestions.length > 0) {
        addSkill(skillSuggestions[0]);
      }
    }
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

  const resetForm = () => {
    setServiceTitle('');
    setCategory('');
    setCategoryId('');
    setDescription('');
    setPrice('');
    setSkillsOffered([]);
    setCurrentSkill('');
    setFiles([]);
    setErrors({});
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoggedIn(false);
      setErrors({ submit: 'You need to be logged in to create a service.' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('category_id', parseInt(categoryId));
    formData.append('title', serviceTitle.trim());
    formData.append('description', description.trim());
    formData.append('price', parseInt(price));
    formData.append('tags', JSON.stringify(skillsOffered));
    formData.append('status', 'active');
    if (files.length > 0) {
      files.forEach(f => formData.append('media[]', f));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/services/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Service created successfully!');
        removeDraftByTitle(serviceTitle);
        resetForm();
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/webbis/profile');
        }, 2000);
      } else {
        setErrors({ submit: result.message || 'Failed to create service. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating service:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (!validateForm(true)) {
      return;
    }

    const draft = {
      id: Date.now(),
      serviceTitle,
      category,
      categoryId,
      description,
      price,
      skillsOffered,
      savedAt: new Date().toISOString()
    };

    const updatedDrafts = [...drafts.filter(d => d.serviceTitle !== serviceTitle), draft];
    localStorage.setItem('serviceDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setShowDrafts(true);
    setSuccessMessage(`Draft saved! You have ${updatedDrafts.length} draft${updatedDrafts.length > 1 ? 's' : ''}. Find them in "View Drafts" above.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const loadDraft = (draft) => {
    setServiceTitle(draft.serviceTitle || '');
    setCategory(draft.category || '');
    setCategoryId(draft.categoryId || '');
    setDescription(draft.description || '');
    setPrice(draft.price || '');
    setSkillsOffered(draft.skillsOffered || []);
    setShowDrafts(false);
    setSuccessMessage('Draft loaded!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const deleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('serviceDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const removeDraftByTitle = (title) => {
    const updatedDrafts = drafts.filter(d => d.serviceTitle !== title);
    localStorage.setItem('serviceDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const selectedCat = categories.find(c => c.id.toString() === selectedId);
    setCategory(selectedCat ? selectedCat.name : '');
    clearFieldError('category');
  };

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="profile" />}

      <main className={`manage-reports-content ${!sidebarVisible ? 'sidebar-hidden' : ''} ${isMobile ? 'mobile' : ''}`}>
        <nav className="reports-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            <h1>Create New Service</h1>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="content">
              <div className="wb-create-service-container">
                <div className="wb-create-service-header">
                  <h2 className="wb-create-service-title">Create New Service</h2>
                  <p className="wb-create-service-description">
                    List your service and start earning by helping others with your skills.
                  </p>
                  {drafts.length > 0 && (
                    <button
                      type="button"
                      className="wb-cs-view-drafts-btn"
                      onClick={() => setShowDrafts(!showDrafts)}
                    >
                      View Drafts ({drafts.length})
                    </button>
                  )}
                </div>

                {showDrafts && drafts.length > 0 && (
                  <div className="wb-cs-drafts-panel">
                    <h3>Saved Drafts</h3>
                    <div className="wb-cs-drafts-list">
                      {drafts.map(draft => (
                        <div key={draft.id} className="wb-cs-draft-item">
                          <div className="wb-cs-draft-info">
                            <strong>{draft.serviceTitle || 'Untitled Draft'}</strong>
                            <span className="wb-cs-draft-date">
                              {draft.category && <span>{draft.category}</span>}
                              {draft.price && <span> · {parseInt(draft.price).toLocaleString()} coins</span>}
                              {draft.skillsOffered?.length > 0 && <span> · {draft.skillsOffered.length} skill{draft.skillsOffered.length > 1 ? 's' : ''}</span>}
                              <br/>Saved: {new Date(draft.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="wb-cs-draft-actions">
                            <button onClick={() => loadDraft(draft)} className="wb-cs-load-draft-btn">Load</button>
                            <button onClick={() => deleteDraft(draft.id)} className="wb-cs-delete-draft-btn">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="wb-cs-success-message">{successMessage}</div>
                )}

                <div className="wb-cs-divider"></div>

                <form onSubmit={handleSubmit} className="wb-create-service-form">
                  {!isLoggedIn && (
                    <div className="wb-cs-form-error-banner" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <span>You must be logged in to create a service.</span>
                      <button
                        type="button"
                        onClick={() => navigate('/swapie-app/sign-in')}
                        style={{background: '#d35400', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'labrada', fontSize: '13px', fontWeight: '600'}}
                      >
                        Go to Login
                      </button>
                    </div>
                  )}
                  {errors.submit && isLoggedIn && (
                    <div className="wb-cs-form-error-banner">{errors.submit}</div>
                  )}
                  {errors.draft && (
                    <div className="wb-cs-form-error-banner">{errors.draft}</div>
                  )}

                  <div className="wb-service-form-card">
                    
                    <div className="wb-cs-form-section">
                      <label className="wb-cs-form-label">
                        Service Title *
                        <input
                          type="text"
                          value={serviceTitle}
                          onChange={(e) => {
                            setServiceTitle(e.target.value);
                            clearFieldError('serviceTitle');
                          }}
                          placeholder="e.g., Professional Logo Design Service"
                          className={`wb-cs-form-input ${errors.serviceTitle ? 'wb-cs-input-error' : ''}`}
                          maxLength={150}
                        />
                        {errors.serviceTitle && <span className="wb-cs-error-text">{errors.serviceTitle}</span>}
                        <span className="wb-cs-char-count">{serviceTitle.length}/150 (min 10)</span>
                      </label>
                    </div>

                    <div className="wb-cs-form-section">
                      <label className="wb-cs-form-label">
                        Category *
                        <select
                          value={categoryId}
                          onChange={handleCategoryChange}
                          className={`wb-cs-form-select ${errors.category ? 'wb-cs-input-error' : ''}`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        {errors.category && <span className="wb-cs-error-text">{errors.category}</span>}
                      </label>
                    </div>

                    <div className="wb-cs-form-section">
                      <label className="wb-cs-form-label">
                        Service Description *
                        <textarea
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            clearFieldError('description');
                          }}
                          placeholder="Describe your service in detail. What will you deliver? What's included? (Min 50 characters)"
                          className={`wb-cs-form-textarea ${errors.description ? 'wb-cs-input-error' : ''}`}
                          rows="5"
                          maxLength={3000}
                        />
                        {errors.description && <span className="wb-cs-error-text">{errors.description}</span>}
                        <span className="wb-cs-char-count">{description.length}/3000 (min 50)</span>
                      </label>
                    </div>

                    <div className="wb-cs-form-row">
                      <div className="wb-cs-form-section">
                        <label className="wb-cs-form-label">
                          Price (in Coins) *
                          <div className="wb-cs-price-input-container">
                            <span className="wb-cs-currency-symbol">&#x1FA99;</span>
                            <input
                              type="number"
                              value={price}
                              onChange={(e) => {
                                const val = e.target.value;
                                
                                if (val === '' || /^\d+$/.test(val)) {
                                  setPrice(val);
                                  clearFieldError('price');
                                }
                              }}
                              onKeyDown={(e) => {
                                
                                if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === '+') {
                                  e.preventDefault();
                                }
                              }}
                              placeholder="e.g. 100"
                              className={`wb-cs-form-input wb-cs-price-input ${errors.price ? 'wb-cs-input-error' : ''}`}
                              min="1"
                              max="100000"
                              step="1"
                            />
                          </div>
                          {errors.price && <span className="wb-cs-error-text">{errors.price}</span>}
                          {price && !errors.price && (
                            <span className="wb-cs-char-count" style={{color: parseInt(price) >= 1 && parseInt(price) <= 100000 ? '#27ae60' : '#e74c3c'}}>
                              {parseInt(price).toLocaleString()} coins{parseInt(price) >= 50 && parseInt(price) <= 500 ? ' — Good price range!' : parseInt(price) > 500 ? ' — Premium pricing' : ''}
                            </span>
                          )}
                          <p className="wb-cs-price-suggestion">Suggested price range: 50–500 coins based on your category</p>
                        </label>
                      </div>
                    </div>

                    <div className="wb-cs-form-section">
                      <label className="wb-cs-form-label">
                        Service Media (Images &amp; Videos)
                        <p className="wb-cs-upload-description">
                          Upload images and/or a video to showcase your service. You can select multiple files at once (up to {MAX_FILES} files, max {MAX_VIDEOS} video).
                        </p>

                        <div className={`wb-cs-file-upload-area ${errors.files ? 'wb-cs-upload-error' : ''}`}>
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="wb-cs-file-input"
                            id="wb-cs-file-upload"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4"
                            multiple
                          />
                          <label htmlFor="wb-cs-file-upload" className="wb-cs-file-upload-label">
                            <div className="wb-cs-upload-content">
                              <svg width="64" height="52" viewBox="0 0 64 52" fill="none">
                                <path d="M0 26C0 11.6406 11.6406 0 26 0L38 0C52.3594 0 64 11.6406 64 26C64 40.3594 52.3594 52 38 52H26C11.6406 52 0 40.3594 0 26Z" fill="#F3F4F6"/>
                                <path d="M25.3334 31.333C24.0201 31.3345 22.7524 30.8513 21.7733 29.9761C20.7941 29.1009 20.1723 27.8952 20.0269 26.5899C19.8816 25.2847 20.2229 23.9717 20.9856 22.9025C21.7483 21.8334 22.8786 21.0832 24.1601 20.7957C23.7893 19.0665 24.1207 17.2608 25.0812 15.7759C26.0418 14.291 27.5529 13.2485 29.2821 12.8777C31.0113 12.5069 32.817 12.8383 34.3019 13.7988C35.7868 14.7594 36.8293 16.2705 37.2001 17.9997H37.3334C38.9867 17.998 40.5816 18.6108 41.8085 19.7189C43.0355 20.827 43.8069 22.3515 43.973 23.9964C44.1392 25.6413 43.6882 27.2892 42.7077 28.6203C41.7271 29.9514 40.287 30.8707 38.6668 31.1997M36.0001 27.333L32.0001 23.333M32.0001 23.333L28.0001 27.333M32.0001 23.333V39.333" stroke="#99A1AF" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <p>Click to upload or drag and drop</p>
                              <span>PNG, JPG, WEBP, MP4, or PDF — up to {MAX_FILES} files, {MAX_VIDEOS} video max (10MB each)</span>
                            </div>
                          </label>

                          {files.length > 0 && (
                            <div className="wb-cs-files-preview-grid">
                              {files.map((f, idx) => (
                                <div key={idx} className="wb-cs-file-preview">
                                  <span className="wb-cs-file-preview-name">
                                    {ALLOWED_VIDEO_TYPES.includes(f.type) ? '🎬' : '🖼️'} {f.name}
                                    <span className="wb-cs-file-size">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                                  </span>
                                  <button type="button" onClick={() => removeFile(idx)} className="wb-cs-remove-file-btn">✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {files.length > 0 && (
                          <span className="wb-cs-char-count">{files.length}/{MAX_FILES} files selected</span>
                        )}
                        {errors.files && <span className="wb-cs-error-text">{errors.files}</span>}
                      </label>
                    </div>

                    <div className="wb-cs-form-section">
                      <label className="wb-cs-form-label">
                        Skills You Offer *
                        <div className="wb-cs-skills-input-wrapper">
                          <div className="wb-cs-skills-input-container">
                            <input
                              type="text"
                              value={currentSkill}
                              onChange={(e) => handleSkillInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              onFocus={() => currentSkill && handleSkillInput(currentSkill)}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              placeholder="Type to search skills (e.g., React, Python, Design)"
                              className={`wb-cs-form-input wb-cs-skills-input ${errors.skills ? 'wb-cs-input-error' : ''}`}
                              autoComplete="off"
                            />
                          </div>

                          {showSuggestions && skillSuggestions.length > 0 && (
                            <div className="wb-cs-skills-suggestions">
                              {skillSuggestions.map((skill, index) => (
                                <div
                                  key={index}
                                  className="wb-cs-skill-suggestion-item"
                                  onClick={() => addSkill(skill)}
                                >
                                  {skill}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {errors.skills && <span className="wb-cs-error-text">{errors.skills}</span>}
                        <span className="wb-cs-char-count">{skillsOffered.length}/10 skills (min 1 required)</span>

                        {skillsOffered.length > 0 && (
                          <div className="wb-cs-skills-tags">
                            {skillsOffered.map((skill, index) => (
                              <span key={index} className="wb-cs-skill-tag">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="wb-cs-remove-skill-btn">&times;</button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="wb-cs-popular-skills">
                          <span className="wb-cs-popular-label">Popular:</span>
                          {['JavaScript', 'Python', 'React', 'UI Design', 'Content Writing', 'SEO'].map(skill => (
                            !skillsOffered.includes(skill) && (
                              <button key={skill} type="button" className="wb-cs-quick-add-skill" onClick={() => addSkill(skill)}>
                                + {skill}
                              </button>
                            )
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="wb-cs-form-actions">
                    <button type="button" className="wb-cs-cancel-btn" onClick={() => navigate(-1)}>
                      Cancel
                    </button>
                    <button type="button" className="wb-cs-save-draft-btn" onClick={handleSaveDraft}>
                      Save as Draft
                    </button>
                    <div className="wb-cs-publish-container">
                      <button type="submit" className="wb-cs-publish-btn" disabled={isSubmitting || !isLoggedIn}>
                        {!isLoggedIn ? 'Login Required' : isSubmitting ? 'Publishing...' : isEditMode ? 'Update Service' : 'Publish Service'}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="wb-cs-tips-section">
                  <h3 className="wb-cs-tips-title">Tips for a Great Service Listing</h3>
                  <ul className="wb-cs-tips-list">
                    <li>Use a clear, descriptive title that highlights what you offer</li>
                    <li>Upload multiple images and a video to showcase your work effectively</li>
                    <li>Write a detailed description explaining deliverables and benefits</li>
                    <li>Set a competitive price based on the complexity of your service</li>
                    <li>Select relevant skills to help buyers find your service</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
