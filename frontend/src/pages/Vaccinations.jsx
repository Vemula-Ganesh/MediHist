import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, 
  HeartHandshake, 
  Trash2, 
  AlertCircle,
  Calendar,
  ShieldCheck,
  Building,
  CheckCircle,
  X
} from 'lucide-react';

const Vaccinations = () => {
  const { user, selectedProfileId } = useAuth();
  const queryClient = useQueryClient();
  const queryUserId = selectedProfileId || user?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [doseNumber, setDoseNumber] = useState(1);
  const [dateAdministered, setDateAdministered] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch Vaccinations
  const { data: vaccinations = [], isLoading } = useQuery({
    queryKey: ['vaccinations', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/profile/vaccinations?userId=${queryUserId}`);
      return res.data;
    }
  });

  // 2. Add Vaccination Mutation
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/profile/vaccinations', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', queryUserId] });
      setModalOpen(false);
      resetForm();
    }
  });

  // 3. Delete Vaccination Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/profile/vaccinations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', queryUserId] });
    }
  });

  const resetForm = () => {
    setVaccineName('');
    setDoseNumber(1);
    setDateAdministered('');
    setFacilityName('');
    setReminderDate('');
    setNotes('');
    setError('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!vaccineName || !dateAdministered) {
      setError('Please provide vaccine name and date administered');
      return;
    }

    addMutation.mutate({
      vaccineName,
      doseNumber,
      dateAdministered,
      facilityName,
      reminderDate: reminderDate || undefined,
      notes,
      userId: queryUserId
    });
  };

  return (
    <div class="space-y-6">
      
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Immunization Ledger</h2>
          <p class="text-slate-500 text-sm mt-1">Record vaccine cards and schedule booster dates</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          class="bg-primary hover:bg-primary-dark text-white font-semibold px-4.5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm"
        >
          <Plus class="h-4.5 w-4.5" />
          <span>Record Vaccination</span>
        </button>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center">
          <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : vaccinations.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <HeartHandshake class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No vaccination records</h3>
          <p class="text-slate-400 text-sm mt-1">Click the button above to log your completed vaccines</p>
        </div>
      ) : (
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaccinations.map((vac) => (
            <div
              key={vac.id}
              class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-standard flex flex-col justify-between"
            >
              <div class="space-y-4">
                <div class="flex justify-between items-start">
                  <div class="h-10 w-10 bg-cyan-100 text-cyan-600 flex items-center justify-center rounded-xl font-bold shrink-0">
                    V
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this immunization record?')) {
                        deleteMutation.mutate(vac.id);
                      }
                    }}
                    class="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-standard animate-fade-in"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h4 class="font-bold text-base text-slate-800">{vac.vaccineName}</h4>
                  <span class="text-xs text-slate-500 block mt-0.5">Dose Number: {vac.doseNumber}</span>
                </div>

                <div class="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-4 w-4 text-slate-400" />
                    <span>Administered: {new Date(vac.dateAdministered).toLocaleDateString()}</span>
                  </div>
                  {vac.facilityName && (
                    <div class="flex items-center gap-1.5">
                      <Building class="h-4 w-4 text-slate-400" />
                      <span>Site: {vac.facilityName}</span>
                    </div>
                  )}
                  {vac.reminderDate && (
                    <div class="flex items-center gap-1.5 text-primary">
                      <ShieldCheck class="h-4 w-4 text-primary-light" />
                      <span>Booster Due: {new Date(vac.reminderDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {vac.notes && (
                  <p class="text-xs text-slate-500 italic mt-2 line-clamp-2">“{vac.notes}”</p>
                )}
              </div>

              <div class="border-t border-slate-50 pt-3 mt-4 text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle class="h-3.5 w-3.5 text-emerald-500" /> Verified in profile timeline
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD VACCINATION CONFIGURATION DIALOG */}
      {modalOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Record Immunization</h3>
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
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Vaccine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Covid-19 Booster / MMR / Hepatitis B"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dose Count</label>
                  <input
                    type="number"
                    min={1}
                    value={doseNumber}
                    onChange={(e) => setDoseNumber(parseInt(e.target.value) || 1)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Administration Date</label>
                  <input
                    type="date"
                    required
                    value={dateAdministered}
                    onChange={(e) => setDateAdministered(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Facility / Clinic Site</label>
                <input
                  type="text"
                  placeholder="e.g. City Wellness Lab"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Next Booster Due Date (Optional)</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Immunization Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Minor localized soreness, no fever..."
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
                  Log Immunization
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Vaccinations;
