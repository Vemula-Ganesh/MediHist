import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Download, 
  Brain, 
  Calendar, 
  AlertCircle,
  FolderOpen,
  CheckCircle,
  Sparkles,
  X
} from 'lucide-react';

const RecordsList = () => {
  const { user, selectedProfileId } = useAuth();
  const queryClient = useQueryClient();
  const queryUserId = selectedProfileId || user?.id;

  // Search States
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  
  // Modals & Panels Active state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form Upload state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('lab-report');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/records/categories');
      return res.data;
    }
  });

  // 2. Fetch Records
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['records', queryUserId, categoryFilter, searchTerm],
    queryFn: async () => {
      const res = await api.get(`/records`, {
        params: {
          userId: queryUserId,
          categorySlug: categoryFilter || undefined,
          search: searchTerm || undefined
        }
      });
      return res.data;
    }
  });

  // 3. AI Smart Search Mutation
  const aiSearchMutation = useMutation({
    mutationFn: async (queryText) => {
      const res = await api.post('/records/smart-search', {
        query: queryText,
        userId: queryUserId
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Temporarily override the query cached records
      queryClient.setQueryData(['records', queryUserId, categoryFilter, searchTerm], data.records);
    }
  });

  // 4. File Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', queryUserId] });
      queryClient.invalidateQueries({ queryKey: ['ai-insights', queryUserId] });
      setUploadOpen(false);
      resetForm();
    },
    onError: (err) => {
      setUploadError(err.response?.data?.error || 'File upload failed');
    }
  });

  // 5. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', queryUserId] });
      setSelectedRecord(null);
    }
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategorySlug('lab-report');
    setNotes('');
    setUploadError('');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!file || !title) {
      setUploadError('Please specify record title and choose a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categorySlug', categorySlug);
    formData.append('notes', notes);
    formData.append('userId', queryUserId);

    uploadMutation.mutate(formData);
  };

  const handleAiSearch = (e) => {
    e.preventDefault();
    if (!aiSearchQuery) return;
    aiSearchMutation.mutate(aiSearchQuery);
  };

  const triggerDownload = async (recordId, recordUrl) => {
    try {
      // Hit backend audit trail for file download
      await api.get(`/records/${recordId}/download`);
      
      // Open file in new tab for downloading
      window.open(recordUrl.startsWith('/uploads') ? recordUrl : recordUrl, '_blank');
    } catch (err) {
      console.error('Download registration failed:', err.message);
    }
  };

  return (
    <div class="space-y-6">
      
      {/* Header and Toggle actions */}
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Medical Records Timeline</h2>
          <p class="text-slate-500 text-sm mt-1">Access clinical files, prescriptions, and summaries</p>
        </div>
        
        {/* Only patient/caregiver can upload new records */}
        {['PATIENT', 'CAREGIVER', 'HOSPITAL'].includes(user?.role) && (
          <button
            onClick={() => setUploadOpen(true)}
            class="bg-primary hover:bg-primary-dark text-white font-semibold px-4.5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm"
          >
            <Plus class="h-4.5 w-4.5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Searches Row */}
      <div class="grid md:grid-cols-3 gap-4">
        
        {/* standard search */}
        <div class="relative md:col-span-1">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search class="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search records by title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setAiSearchQuery(''); // Clear AI search on manual input
            }}
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-medihist focus:border-primary outline-none transition-standard text-sm shadow-sm"
          />
        </div>

        {/* AI Smart Search */}
        <form onSubmit={handleAiSearch} class="relative md:col-span-2 flex gap-2">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-primary-light">
              <Sparkles class="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder="AI Smart Search: 'Show cholesterol tests from 2024' or 'Show all prescriptions'..."
              value={aiSearchQuery}
              onChange={(e) => setAiSearchQuery(e.target.value)}
              class="w-full pl-9.5 pr-4 py-2.5 bg-primary/5 border border-primary/10 rounded-medihist focus:border-primary focus:bg-white outline-none transition-standard text-sm text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={aiSearchMutation.isPending}
            class="bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary hover:text-white px-4 rounded-medihist text-xs transition-standard shrink-0"
          >
            {aiSearchMutation.isPending ? 'Searching...' : 'AI Search'}
          </button>
        </form>

      </div>

      {/* Category filters */}
      <div class="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
        <button
          onClick={() => {
            setCategoryFilter('');
            refetch();
          }}
          class={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-standard ${categoryFilter === '' ? 'bg-secondary border-secondary text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All Timeline
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategoryFilter(cat.slug);
              setAiSearchQuery(''); // Clear smart search filters
            }}
            class={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-standard ${categoryFilter === cat.slug ? 'bg-secondary border-secondary text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Records Grid */}
      {isLoading ? (
        <div class="py-20 flex justify-center">
          <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <FolderOpen class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No medical records found</h3>
          <p class="text-slate-400 text-sm mt-1">Try refining your search terms or upload a new record file</p>
        </div>
      ) : (
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => (
            <div
              key={rec.id}
              onClick={() => setSelectedRecord(rec)}
              class="bg-white rounded-2xl border border-slate-100 hover:border-primary/20 shadow-sm hover:shadow-md cursor-pointer transition-standard flex flex-col justify-between overflow-hidden"
            >
              <div class="p-5 space-y-4">
                <div class="flex justify-between items-start">
                  <span class="text-xs bg-slate-100 font-semibold px-2.5 py-1 rounded-md text-slate-600 truncate">
                    {rec.category?.name}
                  </span>
                  {rec.isVerified && (
                    <span class="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md">
                      <CheckCircle class="h-3 w-3" /> VERIFIED
                    </span>
                  )}
                </div>

                <div>
                  <h4 class="font-bold text-sm text-slate-800 line-clamp-1">{rec.title}</h4>
                  <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar class="h-3.5 w-3.5" />
                    <span>{new Date(rec.uploadDate).toLocaleDateString()}</span>
                  </p>
                </div>

                <p class="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {rec.summary || rec.description || 'No summary available.'}
                </p>
              </div>

              {/* Action indicators footer */}
              <div class="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
                <span>Format: {rec.recordType}</span>
                <span class="text-primary font-semibold hover:underline">View analysis &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. UPLOAD MEDICAL RECORD MODAL */}
      {uploadOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Upload Medical Document</h3>
              <button onClick={() => setUploadOpen(false)} class="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                <X class="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {uploadError && (
                <div class="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-center gap-2">
                  <AlertCircle class="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC Blood Panel Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Brief Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Annual physical checking parameters"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Facility ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MetroLab"
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Choose File (PDF, JPG, PNG)</label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-standard relative">
                  <div class="space-y-1 text-center">
                    <FileText class="mx-auto h-10 w-10 text-slate-400" />
                    <div class="flex text-xs text-slate-600 mt-2">
                      <label class="relative cursor-pointer bg-white rounded-md font-semibold text-primary hover:text-primary-dark">
                        <span>Upload a file</span>
                        <input type="file" required accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} class="sr-only" />
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                    {file && <p class="text-xs text-primary font-bold mt-2 truncate max-w-xs">{file.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Doctor commentary or notes regarding values..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm resize-none"
                />
              </div>

              <div class="pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-standard"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-standard"
                >
                  {uploadMutation.isPending ? 'Processing Summary...' : 'Upload & Analyze'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. RECORD DETAIL VIEW & AI ANALYSIS DRAWER MODAL */}
      {selectedRecord && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 class="font-bold text-slate-800 truncate max-w-md">{selectedRecord.title}</h3>
                <span class="text-xs text-slate-500 mt-0.5 block">{selectedRecord.category?.name} • {new Date(selectedRecord.uploadDate).toLocaleDateString()}</span>
              </div>
              <button onClick={() => setSelectedRecord(null)} class="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Description & metadata */}
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="bg-slate-50 p-3.5 rounded-xl">
                  <span class="text-slate-400 block mb-0.5">Uploaded By</span>
                  <strong class="text-slate-700">{selectedRecord.doctorId ? 'Verified Doctor' : 'Patient'}</strong>
                </div>
                <div class="bg-slate-50 p-3.5 rounded-xl">
                  <span class="text-slate-400 block mb-0.5">Facility</span>
                  <strong class="text-slate-700">{selectedRecord.facilityId || 'Self Recorded'}</strong>
                </div>
              </div>

              {selectedRecord.description && (
                <div>
                  <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                  <p class="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">{selectedRecord.description}</p>
                </div>
              )}

              {/* AI summarizer container */}
              <div class="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-4">
                <div class="flex items-center gap-2 border-b border-primary/10 pb-3">
                  <Brain class="h-5 w-5 text-primary" />
                  <h4 class="font-bold text-sm text-slate-800">MediHist AI Clinical Summary</h4>
                </div>

                <div class="space-y-4 text-xs">
                  <div>
                    <h5 class="font-bold text-primary mb-1">Plain English Summary</h5>
                    <p class="text-slate-600 leading-relaxed font-medium">{selectedRecord.summary || 'AI summarizer analysis pending.'}</p>
                  </div>

                  <div>
                    <h5 class="font-bold text-primary mb-1">Key Findings</h5>
                    <div class="text-slate-600 leading-relaxed whitespace-pre-line font-medium bg-white/60 p-2.5 rounded-xl border border-primary/5">
                      {selectedRecord.keyFindings || '• Normal parameters.'}
                    </div>
                  </div>

                  <div>
                    <h5 class="font-bold text-primary mb-1">Recommended Follow-Ups</h5>
                    <div class="text-slate-600 leading-relaxed whitespace-pre-line font-medium bg-white/60 p-2.5 rounded-xl border border-primary/5">
                      {selectedRecord.followUpRecommendations || '• Standard clinical review in 6 months.'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Personal Notes</h4>
                  <p class="text-xs text-slate-600 leading-relaxed">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div class="border-t border-slate-100 pt-4 flex justify-between items-center">
                {selectedRecord.userId === user?.id ? (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to soft delete this file from your timeline?')) {
                        deleteMutation.mutate(selectedRecord.id);
                      }
                    }}
                    class="text-red-500 hover:text-red-700 flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  >
                    <Trash2 class="h-4.5 w-4.5" />
                    <span>Delete File</span>
                  </button>
                ) : <div />}

                <button
                  onClick={() => triggerDownload(selectedRecord.id, selectedRecord.recordUrl)}
                  class="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-standard flex items-center gap-2"
                >
                  <Download class="h-4 w-4" />
                  <span>Download Document</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecordsList;
