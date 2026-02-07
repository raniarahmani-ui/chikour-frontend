import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/CreateDemand.css';
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

export default function CreateDemand() {
  const navigate = useNavigate();
  const location = useLocation();
  const editDemand = location.state?.editDemand;
  const isEditMode = !!editDemand;
  const [demandTitle, setDemandTitle] = useState(editDemand?.title || '');
  const [category, setCategory] = useState(editDemand?.category_name || '');
  const [categoryId, setCategoryId] = useState(editDemand?.category_id?.toString() || '');
  const [description, setDescription] = useState(editDemand?.description || '');
  const [budget, setBudget] = useState(editDemand?.budget?.toString() || '');
  const [urgency, setUrgency] = useState(editDemand?.urgency || 'normal');
  const [timeline, setTimeline] = useState(editDemand?.deadline || editDemand?.timeline || '');
  const [skillsRequired, setSkillsRequired] = useState(() => {
    if (!editDemand?.tags) return [];
    try {
      const parsed = typeof editDemand.tags === 'string' ? JSON.parse(editDemand.tags) : editDemand.tags;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const urgencyOptions = [
    { value: 'low', label: 'Low (Within 30 days)', color: '#10b981' },
    { value: 'normal', label: 'Normal (Within 2 weeks)', color: '#3b82f6' },
    { value: 'high', label: 'High (Within 1 week)', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgent (Within 3 days)', color: '#ef4444' }
  ];

  useEffect(() => {
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
    const savedDrafts = localStorage.getItem('demandDraftsWebbis');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  };

  const validateForm = (isDraft = false) => {
    const newErrors = {};

    if (isDraft) {
      if (!demandTitle.trim() && !description.trim()) {
        newErrors.draft = 'Please enter at least a title or description to save as draft';
        setErrors(newErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    if (!demandTitle.trim()) {
      newErrors.demandTitle = 'Title is required';
    } else if (demandTitle.trim().length < 10) {
      newErrors.demandTitle = 'Title must be at least 10 characters';
    } else if (demandTitle.trim().length > 150) {
      newErrors.demandTitle = 'Title must be less than 150 characters';
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

    if (!budget) {
      newErrors.budget = 'Budget is required';
    } else {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 1) {
        newErrors.budget = 'Budget must be at least 1 coin';
      } else if (budgetNum > 100000) {
        newErrors.budget = 'Budget cannot exceed 100,000 coins';
      }
    }

    if (timeline && timeline.trim().length > 50) {
      newErrors.timeline = 'Timeline must be less than 50 characters';
    }

    if (!urgency) {
      newErrors.urgency = 'Please select an urgency level';
    }

    if (skillsRequired.length === 0) {
      newErrors.skills = 'Please add at least one required skill';
    } else {
      const invalidSkills = skillsRequired.filter(skill => !VALID_SKILLS.includes(skill));
      if (invalidSkills.length > 0) {
        newErrors.skills = `Invalid skills: ${invalidSkills.join(', ')}. Please select from the suggestions.`;
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
        !skillsRequired.includes(skill)
      ).slice(0, 8);
      setSkillSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    if (skill && VALID_SKILLS.includes(skill) && !skillsRequired.includes(skill)) {
      if (skillsRequired.length >= 10) {
        setErrors(prev => ({ ...prev, skills: 'Maximum 10 skills allowed' }));
        return;
      }
      setSkillsRequired([...skillsRequired, skill]);
      setCurrentSkill('');
      setShowSuggestions(false);
      setSkillSuggestions([]);
      clearFieldError('skills');
    } else if (skill && !VALID_SKILLS.includes(skill)) {
      setErrors(prev => ({ ...prev, skills: 'Please select a valid skill from the suggestions' }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsRequired(skillsRequired.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (skillSuggestions.length > 0) {
        addSkill(skillSuggestions[0]);
      }
    }
  };

  const resetForm = () => {
    setDemandTitle('');
    setCategory('');
    setCategoryId('');
    setDescription('');
    setBudget('');
    setUrgency('normal');
    setTimeline('');
    setSkillsRequired([]);
    setCurrentSkill('');
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!user.id || !token) {
      setErrors({ submit: 'Please login to create a demand' });
      setIsSubmitting(false);
      return;
    }

    const demandData = {
      user_id: user.id,
      category_id: parseInt(categoryId),
      title: demandTitle.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      urgency: urgency,
      deadline: timeline || null,
      tags: skillsRequired,
      status: 'open'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/demands/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(demandData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Demand posted successfully!');
        removeDraftByTitle(demandTitle);
        resetForm();
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/webbis/profile');
        }, 2000);
      } else {
        setErrors({ submit: result.message || 'Failed to post demand. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating demand:', error);
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
      demandTitle,
      category,
      categoryId,
      description,
      budget,
      urgency,
      timeline,
      skillsRequired,
      savedAt: new Date().toISOString()
    };

    const updatedDrafts = [...drafts.filter(d => d.demandTitle !== demandTitle), draft];
    localStorage.setItem('demandDraftsWebbis', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setSuccessMessage('Draft saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const loadDraft = (draft) => {
    setDemandTitle(draft.demandTitle || '');
    setCategory(draft.category || '');
    setCategoryId(draft.categoryId || '');
    setDescription(draft.description || '');
    setBudget(draft.budget || '');
    setUrgency(draft.urgency || 'normal');
    setTimeline(draft.timeline || '');
    setSkillsRequired(draft.skillsRequired || []);
    setShowDrafts(false);
    setSuccessMessage('Draft loaded!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const deleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('demandDraftsWebbis', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const removeDraftByTitle = (title) => {
    const updatedDrafts = drafts.filter(d => d.demandTitle !== title);
    localStorage.setItem('demandDraftsWebbis', JSON.stringify(updatedDrafts));
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
            <h1>Create New Demand</h1>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="content">
              <div className="wb-create-demand-container">
                <div className="wb-create-demand-header">
                  <h2 className="wb-create-demand-title">Create New Demand</h2>
                  <p className="wb-create-demand-description">
                    Post what you need and let service providers come to you with offers.
                  </p>
                  {drafts.length > 0 && (
                    <button
                      type="button"
                      className="wb-cd-view-drafts-btn"
                      onClick={() => setShowDrafts(!showDrafts)}
                    >
                      View Drafts ({drafts.length})
                    </button>
                  )}
                </div>

                {showDrafts && drafts.length > 0 && (
                  <div className="wb-cd-drafts-panel">
                    <h3>Saved Drafts</h3>
                    <div className="wb-cd-drafts-list">
                      {drafts.map(draft => (
                        <div key={draft.id} className="wb-cd-draft-item">
                          <div className="wb-cd-draft-info">
                            <strong>{draft.demandTitle || 'Untitled Draft'}</strong>
                            <span className="wb-cd-draft-date">
                              Saved: {new Date(draft.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="wb-cd-draft-actions">
                            <button onClick={() => loadDraft(draft)} className="wb-cd-load-draft-btn">Load</button>
                            <button onClick={() => deleteDraft(draft.id)} className="wb-cd-delete-draft-btn">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="wb-cd-success-message">{successMessage}</div>
                )}

                <div className="wb-cd-divider"></div>

                <form onSubmit={handleSubmit} className="wb-create-demand-form">
                  {errors.submit && (
                    <div className="wb-cd-form-error-banner">{errors.submit}</div>
                  )}
                  {errors.draft && (
                    <div className="wb-cd-form-error-banner">{errors.draft}</div>
                  )}

                  <div className="wb-demand-form-card">
                    
                    <div className="wb-cd-form-section">
                      <label className="wb-cd-form-label">
                        What do you need? *
                        <input
                          type="text"
                          value={demandTitle}
                          onChange={(e) => {
                            setDemandTitle(e.target.value);
                            clearFieldError('demandTitle');
                          }}
                          placeholder="e.g., Need a professional logo for my startup"
                          className={`wb-cd-form-input ${errors.demandTitle ? 'wb-cd-input-error' : ''}`}
                          maxLength={150}
                        />
                        {errors.demandTitle && <span className="wb-cd-error-text">{errors.demandTitle}</span>}
                        <span className="wb-cd-char-count">{demandTitle.length}/150 (min 10)</span>
                      </label>
                    </div>

                    <div className="wb-cd-form-section">
                      <label className="wb-cd-form-label">
                        Category *
                        <select
                          value={categoryId}
                          onChange={handleCategoryChange}
                          className={`wb-cd-form-select ${errors.category ? 'wb-cd-input-error' : ''}`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        {errors.category && <span className="wb-cd-error-text">{errors.category}</span>}
                      </label>
                    </div>

                    <div className="wb-cd-form-section">
                      <label className="wb-cd-form-label">
                        Detailed Description *
                        <textarea
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            clearFieldError('description');
                          }}
                          placeholder="Describe exactly what you need. Include specific requirements, goals, and any important details... (Min 50 characters)"
                          className={`wb-cd-form-textarea ${errors.description ? 'wb-cd-input-error' : ''}`}
                          rows="5"
                          maxLength={3000}
                        />
                        {errors.description && <span className="wb-cd-error-text">{errors.description}</span>}
                        <span className="wb-cd-char-count">{description.length}/3000 (min 50)</span>
                      </label>
                    </div>

                    <div className="wb-cd-form-row">
                      <div className="wb-cd-form-section">
                        <label className="wb-cd-form-label">
                          Budget (in Coins) *
                          <div className="wb-cd-price-input-container">
                            <span className="wb-cd-currency-symbol">&#x1FA99;</span>
                            <input
                              type="number"
                              value={budget}
                              onChange={(e) => {
                                setBudget(e.target.value);
                                clearFieldError('budget');
                              }}
                              placeholder="Enter your budget"
                              className={`wb-cd-form-input wb-cd-price-input ${errors.budget ? 'wb-cd-input-error' : ''}`}
                              min="1"
                              max="100000"
                            />
                          </div>
                          {errors.budget && <span className="wb-cd-error-text">{errors.budget}</span>}
                        </label>
                      </div>

                      <div className="wb-cd-form-section">
                        <label className="wb-cd-form-label">
                          Expected Timeline
                          <input
                            type="text"
                            value={timeline}
                            onChange={(e) => {
                              setTimeline(e.target.value);
                              clearFieldError('timeline');
                            }}
                            placeholder="e.g., 2 weeks, 1 month"
                            className={`wb-cd-form-input ${errors.timeline ? 'wb-cd-input-error' : ''}`}
                            maxLength={50}
                          />
                          {errors.timeline && <span className="wb-cd-error-text">{errors.timeline}</span>}
                        </label>
                      </div>
                    </div>

                    <div className="wb-cd-form-section">
                      <label className="wb-cd-form-label">
                        Urgency Level *
                        <div className="wb-cd-urgency-options">
                          {urgencyOptions.map((option) => (
                            <label key={option.value} className="wb-cd-urgency-option">
                              <input
                                type="radio"
                                value={option.value}
                                checked={urgency === option.value}
                                onChange={(e) => {
                                  setUrgency(e.target.value);
                                  clearFieldError('urgency');
                                }}
                                className="wb-cd-urgency-radio"
                              />
                              <span
                                className="wb-cd-urgency-label"
                                style={{
                                  borderColor: urgency === option.value ? option.color : '#e5e7eb',
                                  backgroundColor: urgency === option.value ? `${option.color}15` : 'transparent'
                                }}
                              >
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.urgency && <span className="wb-cd-error-text">{errors.urgency}</span>}
                      </label>
                    </div>

                    <div className="wb-cd-form-section">
                      <label className="wb-cd-form-label">
                        Required Skills or Expertise *
                        <div className="wb-cd-skills-input-wrapper">
                          <div className="wb-cd-skills-input-container">
                            <input
                              type="text"
                              value={currentSkill}
                              onChange={(e) => handleSkillInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              onFocus={() => currentSkill && handleSkillInput(currentSkill)}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              placeholder="Type to search skills (e.g., React, Python, Design)"
                              className={`wb-cd-form-input wb-cd-skills-input ${errors.skills ? 'wb-cd-input-error' : ''}`}
                              autoComplete="off"
                            />
                          </div>

                          {showSuggestions && skillSuggestions.length > 0 && (
                            <div className="wb-cd-skills-suggestions">
                              {skillSuggestions.map((skill, index) => (
                                <div
                                  key={index}
                                  className="wb-cd-skill-suggestion-item"
                                  onClick={() => addSkill(skill)}
                                >
                                  {skill}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {errors.skills && <span className="wb-cd-error-text">{errors.skills}</span>}
                        <span className="wb-cd-char-count">{skillsRequired.length}/10 skills (min 1 required)</span>

                        {skillsRequired.length > 0 && (
                          <div className="wb-cd-skills-tags">
                            {skillsRequired.map((skill, index) => (
                              <span key={index} className="wb-cd-skill-tag">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="wb-cd-remove-skill-btn">&times;</button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="wb-cd-popular-skills">
                          <span className="wb-cd-popular-label">Popular:</span>
                          {['JavaScript', 'Python', 'React', 'UI Design', 'Content Writing', 'SEO'].map(skill => (
                            !skillsRequired.includes(skill) && (
                              <button key={skill} type="button" className="wb-cd-quick-add-skill" onClick={() => addSkill(skill)}>
                                + {skill}
                              </button>
                            )
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="wb-cd-form-actions">
                    <button type="button" className="wb-cd-cancel-btn" onClick={() => navigate(-1)}>
                      Cancel
                    </button>
                    <button type="button" className="wb-cd-save-draft-btn" onClick={handleSaveDraft}>
                      Save as Draft
                    </button>
                    <div className="wb-cd-publish-container">
                      <button type="submit" className="wb-cd-publish-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Posting...' : 'Post Demand'}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="wb-cd-tips-section">
                  <h3 className="wb-cd-tips-title">Tips for a Great Demand Post</h3>
                  <ul className="wb-cd-tips-list">
                    <li>Be specific about what you need and your expectations</li>
                    <li>Include your budget range to attract relevant providers</li>
                    <li>Select skills that match your requirements from the dropdown</li>
                    <li>Set a realistic timeline for project completion</li>
                    <li>Provide enough context about your project or business</li>
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
