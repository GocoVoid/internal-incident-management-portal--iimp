import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS_MAP, DEPARTMENT_NAMES, PRIORITIES } from '../../data/mockData';
import { uploadFiles } from '../../services/incidentService';

const INITIAL = { title: '', department: '', category: '', priority: '', description: '' };

const Field = ({ label, error, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
    {children}
    {hint && !error && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border bg-white outline-none transition-all ${
    err ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`;

const EmployeeCreateTicket = () => {
  const { user }         = useAuthContext();
  const navigate         = useNavigate();
  const { createTicket } = useTickets(user?.id, 'EMPLOYEE');

  const [form,     setForm]     = useState(INITIAL);
  const [errors,   setErrors]   = useState({});
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');
  const [success,  setSuccess]  = useState('');

  const subCategories = form.department && form.department !== 'Others'
    ? (DEPARTMENTS_MAP[form.department] ?? [])
    : [];

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 3) e.title       = 'Title must be at least 3 characters.';
    if (form.title.length > 150)                      e.title       = 'Title must be under 150 characters.';
    if (!form.department)                             e.department  = 'Please select a department.';
    if (!form.category)                               e.category    = 'Please select a category.';
    if (!form.priority)                               e.priority    = 'Please select a priority.';
    if (form.description.trim().length < 20)          e.description = 'Description must be at least 20 characters.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setForm(p => ({ ...p, department: value, category: value === 'Others' ? 'Others' : '' }));
      setErrors(p => ({ ...p, department: '', category: '' }));
      setApiError('');
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const handleFiles = (e) => {
    const allowed = ['application/pdf','image/jpeg','image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const valid = Array.from(e.target.files)
      .filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
    setFiles(p => [...p, ...valid].slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const ticket = await createTicket({
        title:       form.title,
        description: form.description,
        priority:    form.priority,
        category:    form.category,
      });

      // for (const file of files) {
      //   try { await uploadAttachment(ticket.id, file); } catch { /* skip */ }
      // }
      try {
        const formData = new FormData();
    
        files.forEach((file) => {
          formData.append("file", file);
        });

        const response = await uploadFiles(ticket.id, formData);
        const data = await response.json();
        console.log("Uploaded:", data);
    
      } catch (err) {
        console.error(err);
      }

      setSuccess(ticket.id);
    } catch (err) {
      setApiError(err?.message ?? 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    const ticketsRoute = user?.role === 'ADMIN'    ? '/dashboard/admin/tickets'
                       : user?.role === 'MANAGER'  ? '/dashboard/manager/tickets'
                       : '/dashboard/employee/tickets';
    return (
      <DashboardLayout title="Create Ticket">
        <div className="max-w-lg mx-auto mt-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Submitted!</h2>
          <p className="text-sm text-gray-500 mb-1">Your incident has been logged successfully.</p>
          <p className="font-mono text-sm font-bold mb-6" style={{ color: '#3c3c8c' }}>{success}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate(ticketsRoute)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: '#3c3c8c' }}>
              View Tickets
            </button>
            <button onClick={() => { setSuccess(''); setForm(INITIAL); setFiles([]); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Create Another
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Create form
  return (
    <DashboardLayout title="Create Ticket">
      <div className="max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">New Incident Ticket</h2>
          <p className="text-sm text-gray-500 mt-0.5">Describe your issue clearly so the right team can assist you.</p>
        </div>

        {apiError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate
          className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-6 space-y-5">

          <Field label="Title *" error={errors.title} hint={`${form.title.length}/150 characters`}>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="Brief summary of the issue (3–150 characters)"
              className={inputCls(errors.title)} maxLength={150} />
          </Field>

          <Field label="Department *" error={errors.department}>
            <select name="department" value={form.department} onChange={handleChange}
              className={inputCls(errors.department)}>
              <option value="">Select department</option>
              {DEPARTMENT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="Others">Others</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category *" error={errors.category}>
              <select name="category" value={form.category} onChange={handleChange}
                className={inputCls(errors.category)}
                disabled={!form.department || form.department === 'Others'}>
                <option value="">
                  {!form.department ? 'Select department first'
                    : form.department === 'Others' ? 'Others (auto-assigned)'
                    : 'Select category'}
                </option>
                {subCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Priority *" error={errors.priority}>
              <select name="priority" value={form.priority} onChange={handleChange}
                className={inputCls(errors.priority)}>
                <option value="">Select priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          {form.department === 'Others' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Others</strong> tickets are routed to Admin for re-categorization.
                SLA starts after the Admin assigns a department.
              </p>
            </div>
          )}

          <Field label="Description *" error={errors.description}
            hint={`${form.description.trim().length} characters (minimum 20)`}>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={5} placeholder="Describe the issue in detail — what happened, when, and what you've already tried."
              className={`${inputCls(errors.description)} resize-none`} />
          </Field>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Attachments <span className="text-gray-400 font-normal">(optional · PDF, JPG, PNG, DOCX, XLSX · max 10 MB · up to 5)</span>
            </label>
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-5 cursor-pointer transition-colors ${
              files.length >= 5 ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6363b8" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="text-xs text-indigo-600">
                {files.length >= 5 ? 'Maximum 5 files reached' : 'Click to attach files'}
              </span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                onChange={handleFiles} disabled={files.length >= 5} className="hidden" />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-700 truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/dashboard/employee')}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors shadow-pratiti-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
              {loading && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                </svg>
              )}
              {loading ? 'Submitting…' : 'Submit Ticket'}
              {console.log("I am here in create ticket")}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeCreateTicket;
