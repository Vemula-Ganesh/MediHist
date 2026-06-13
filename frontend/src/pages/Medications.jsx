import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, 
  Activity, 
  Trash2, 
  AlertCircle,
  Bell, 
  BellOff, 
  RefreshCcw,
  CheckCircle,
  FolderPlus,
  Clock,
  Calendar,
  X
} from 'lucide-react';

const Medications = () => {
  const { user, selectedProfileId } = useAuth();
  const queryClient = useQueryClient();
  const queryUserId = selectedProfileId || user?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [duration, setDuration] = useState('7 days');
  const [refills, setRefills] = useState(3);
  const [reminders, setReminders] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch Medications
  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/medications?userId=${queryUserId}`);
      return res.data;
    }
  });

  // 2. Add Medication Mutation
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/medications', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', queryUserId] });
      queryClient.invalidateQueries({ queryKey: ['ai-insights', queryUserId] });
      setModalOpen(false);
      resetForm();
    }
  });

  // 3. Update Medication Mutation (Adherence/Refills/Reminders)
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/medications/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', queryUserId] });
    }
  });

  // 4. Delete Medication Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', queryUserId] });
      queryClient.invalidateQueries({ queryKey: ['ai-insights', queryUserId] });
    }
  });

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('Once daily');
    setDuration('7 days');
    setRefills(3);
    setReminders(true);
    setError('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !dosage) {
      setError('Please fill in medicine name and dosage');
      return;
    }

    addMutation.mutate({
      name,
      dosage,
      frequency,
      duration,
      refillsLeft: refills,
      reminders,
      userId: queryUserId
    });
  };

  const handleLogAdherence = (med) => {
    // Simulate logging adherence (e.g. increase compliance rate up to 100%)
    const currentAdherence = med.adherence || 100;
    const newAdherence = Math.min(100, currentAdherence + 5);
    updateMutation.mutate({
      id: med.id,
      payload: { adherence: newAdherence }
    });
  };

  const handleRefillDecrement = (med) => {
    if (med.refillsLeft <= 0) return;
    updateMutation.mutate({
      id: med.id,
      payload: { refillsLeft: med.refillsLeft - 1 }
    });
  };

  const handleToggleReminder = (med) => {
    updateMutation.mutate({
      id: med.id,
      payload: { reminders: !med.reminders }
    });
  };

  return (
    <div class="space-y-6">
      
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Active Prescriptions & Medications</h2>
          <p class="text-slate-500 text-sm mt-1">Track daily dose compliance, alarms, and refills schedules</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          class="bg-primary hover:bg-primary-dark text-white font-semibold px-4.5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm"
        >
          <Plus class="h-4.5 w-4.5" />
          <span>Add Medication</span>
        </button>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center">
          <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : medications.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <Activity class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No active medications</h3>
          <p class="text-slate-400 text-sm mt-1">Click the button above to set up your first medicine schedule</p>
        </div>
      ) : (
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((med) => (
            <div
              key={med.id}
              class="bg-white rounded-2xl border border-slate-100 hover:border-primary/15 shadow-sm hover:shadow-md p-5 transition-standard flex flex-col justify-between"
            >
              <div class="space-y-4">
                <div class="flex justify-between items-start">
                  <div class="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-bold shrink-0">
                    M
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleReminder(med)}
                      class={`p-1.5 rounded-lg border transition-standard ${med.reminders ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      title={med.reminders ? 'Reminders On' : 'Reminders Off'}
                    >
                      {med.reminders ? <Bell class="h-4 w-4" /> : <BellOff class="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this medication schedule?')) {
                          deleteMutation.mutate(med.id);
                        }
                      }}
                      class="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-standard"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 class="font-bold text-base text-slate-800">{med.name}</h4>
                  <span class="text-xs text-slate-500 block mt-0.5">{med.dosage}</span>
                </div>

                <div class="grid grid-cols-2 gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div class="flex items-center gap-1.5">
                    <Clock class="h-3.5 w-3.5 text-slate-400" />
                    <span>{med.frequency}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-slate-400" />
                    <span>{med.duration}</span>
                  </div>
                </div>

                {/* Adherence progress bar */}
                <div>
                  <div class="flex justify-between items-center text-xs mb-1.5">
                    <span class="text-slate-400 font-medium">Weekly Adherence</span>
                    <strong class="text-emerald-600">{med.adherence || 100}%</strong>
                  </div>
                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${med.adherence || 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick interactive actions */}
              <div class="border-t border-slate-100 pt-4 mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLogAdherence(med)}
                  class="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold transition-standard"
                >
                  <CheckCircle class="h-4 w-4" />
                  <span>Log Taken</span>
                </button>
                <button
                  onClick={() => handleRefillDecrement(med)}
                  disabled={med.refillsLeft <= 0}
                  class="flex items-center justify-center gap-1.5 py-2 px-3 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-xl text-xs font-semibold transition-standard disabled:opacity-50"
                >
                  <RefreshCcw class="h-4 w-4" />
                  <span>Refills ({med.refillsLeft})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD MEDICATION CONFIGURATION DIALOG */}
      {modalOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Add Medication Regimen</h3>
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
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Medicine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin / Lipitor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dosage & Strength</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500mg, 1 tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="As needed (PRN)">As needed</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  >
                    <option value="5 days">5 days</option>
                    <option value="7 days">7 days</option>
                    <option value="10 days">10 days</option>
                    <option value="30 days">30 days</option>
                    <option value="Continuous / Lifelong">Continuous</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Refills Left</label>
                  <input
                    type="number"
                    min={0}
                    value={refills}
                    onChange={(e) => setRefills(parseInt(e.target.value) || 0)}
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>

                <div class="flex flex-col justify-center">
                  <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Alarms & Reminders</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="reminders"
                      checked={reminders}
                      onChange={(e) => setReminders(e.target.checked)}
                      class="h-4.5 w-4.5 text-primary border-slate-300 rounded focus:ring-primary/20"
                    />
                    <label htmlFor="reminders" class="text-xs text-slate-600 font-semibold select-none">Send Email Alerts</label>
                  </div>
                </div>
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
                  Save Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Medications;
