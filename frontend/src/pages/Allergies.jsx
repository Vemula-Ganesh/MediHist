import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, 
  ShieldAlert, 
  Trash2, 
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  X
} from 'lucide-react';

const Allergies = () => {
  const { user, selectedProfileId } = useAuth();
  const queryClient = useQueryClient();
  const queryUserId = selectedProfileId || user?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [allergyType, setAllergyType] = useState('Drug');
  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch Allergies
  const { data: allergies = [], isLoading } = useQuery({
    queryKey: ['allergies', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/profile/allergies?userId=${queryUserId}`);
      return res.data;
    }
  });

  // 2. Add Allergy Mutation
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/profile/allergies', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', queryUserId] });
      queryClient.invalidateQueries({ queryKey: ['profile', queryUserId] }); // Sync emergency pins
      setModalOpen(false);
      resetForm();
    }
  });

  // 3. Delete Allergy Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/profile/allergies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', queryUserId] });
      queryClient.invalidateQueries({ queryKey: ['profile', queryUserId] });
    }
  });

  const resetForm = () => {
    setAllergyType('Drug');
    setAllergen('');
    setSeverity('LOW');
    setNotes('');
    setError('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!allergen) {
      setError('Please specify the allergen compound');
      return;
    }

    addMutation.mutate({
      allergyType,
      allergen,
      severity,
      notes,
      userId: queryUserId
    });
  };

  // Severity style helper
  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div class="space-y-6">
      
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Allergies & Clinical Sensitivities</h2>
          <p class="text-slate-500 text-sm mt-1">Manage active hypersensitivity triggers pinned to your public emergency profile</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          class="bg-primary hover:bg-primary-dark text-white font-semibold px-4.5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm"
        >
          <Plus class="h-4.5 w-4.5" />
          <span>Add Allergy</span>
        </button>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center">
          <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : allergies.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <ShieldAlert class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No allergies recorded</h3>
          <p class="text-slate-400 text-sm mt-1">If you have known drug or food sensitivities, add them here for emergency protection</p>
        </div>
      ) : (
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allergies.map((all) => (
            <div
              key={all.id}
              class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-standard flex flex-col justify-between"
            >
              <div class="space-y-4">
                <div class="flex justify-between items-start">
                  <span class={`text-[10px] font-bold px-2.5 py-1 border rounded-md uppercase tracking-wider ${getSeverityBadgeClass(all.severity)}`}>
                    {all.severity} Severity
                  </span>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this allergy log?')) {
                        deleteMutation.mutate(all.id);
                      }
                    }}
                    class="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-standard animate-fade-in"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h4 class="font-bold text-base text-slate-800">{all.allergen}</h4>
                  <span class="text-xs text-slate-500 block mt-0.5">Type: {all.allergyType}</span>
                </div>

                {all.notes && (
                  <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <strong>Reaction description:</strong>
                    <p class="mt-1 font-medium">{all.notes}</p>
                  </div>
                )}
              </div>

              {all.severity === 'HIGH' && (
                <div class="border-t border-red-50 pt-3 mt-4 text-[10px] text-red-600 flex items-center gap-1.5">
                  <AlertTriangle class="h-4 w-4 text-red-500" /> Pinned prominently to emergency dashboard
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RECORD ALLERGY DIALOG */}
      {modalOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Record Sensitivity</h3>
              <button onClick={() => setModalOpen(false)} class="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                <X class="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} class="p-6 space-y-4">
              {error && (
                <div class="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-center gap-2">
                  <AlertCircle class="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Allergen Compound</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penicillin / Peanuts / Latex"
                  value={allergen}
                  onChange={(e) => setAllergen(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Allergy Type</label>
                  <select
                    value={allergyType}
                    onChange={(e) => setAllgyType(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  >
                    <option value="Drug">Drug / Medication</option>
                    <option value="Food">Food Product</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Insect">Insect Stings</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  >
                    <option value="LOW">Low Sensitivity</option>
                    <option value="MEDIUM">Medium / Moderate</option>
                    <option value="HIGH">High / Anaphylactic</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Symptoms / Reaction Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Skin rashes, hives, swelling, wheezing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm resize-none"
                />
              </div>

              <div class="pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-standard"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-standard"
                >
                  Log Sensitivity
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Allergies;
