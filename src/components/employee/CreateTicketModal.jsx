import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { DEPARTMENTS_MAP, DEPARTMENT_NAMES, PRIORITIES } from '../../data/mockData';
import { createIncident, getPriority } from '../../services/incidentService';
import { uploadFiles } from '../../services/incidentService';

const INITIAL = { title: '', department: '', category: '', priority: '', description: '' };

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border bg-white outline-none transition-all ${
    err
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  }`;

const PRIORITY_COLORS = {
  Low: 'text-green-600', Medium: 'text-amber-600',
  High: 'text-orange-600', Critical: 'text-red-600',
};

const CreateTicketModal = ({ isOpen, onClose, onSubmit }) => {
  const [form,    setForm]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [files,   setFiles]   = useState([]);

  const subCategories = form.department && form.department !== 'Others'
    ? (DEPARTMENTS_MAP[form.department] ?? [])
    : [];

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 3) e.title       = 'Title must be at least 3 characters.';
    if (form.title.length > 150)                      e.title       = 'Title must be under 150 characters.';
    if (!form.department)                             e.department  = 'Please select a department.';
    if (!form.category)                               e.category    = 'Please select a category.';
    if (form.description.trim().length < 40)          e.description = 'Description must be at least 40 characters.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setForm(p => ({ ...p, department: value, category: value === 'Others' ? 'Others' : '' }));
      setErrors(p => ({ ...p, department: '', category: '' }));
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleFiles = (e) => {
    const allowed = ['application/pdf','image/jpeg','image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const valid = Array.from(e.target.files)
      .filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
    setFiles(p => [...p, ...valid].slice(0, 5));
  };

  const removeFile = (idx) => setFiles(p => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      let text = `Analyse the incident description attached and strictly respond only in single word about the priority of the incident (Low, Medium, High, Critical) => Description : ${form.description}`;
  
      const data = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "nvidia/nemotron-3-super-120b-a12b:free",
          "messages": [{ "role": "user", "content": text }]
        })
      });
  
      const response = await data.json();                          // ✅ await the json()
      const fetchedPriority = response.choices[0].message.content.trim(); // ✅ no .then()
      console.log(fetchedPriority);
  
      const finalForm = { ...form, priority: fetchedPriority };
      console.log(finalForm);
      const creationResponse = await createIncident({ ...finalForm}); 
      console.log(creationResponse);
      try {
        const formData = new FormData();
    
        files.forEach((file) => {
          formData.append("file", file);
        });

        const response = await uploadFiles(creationResponse.incidentKey, formData);
        const data = await response;
        console.log("Uploaded:", data);
    
      } catch (err) {
        console.error(err);
      }
      
      setForm({ title: '', department: '', category: '', priority: '', description: '' });
      setFiles([]);
      setErrors({});
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setForm(INITIAL); setFiles([]); setErrors({}); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Incident Ticket" size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        <Field label="Title *" error={errors.title}>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="Brief summary of the issue (3–150 characters)"
            className={inputCls(errors.title)} maxLength={150} />
          <p className="mt-1 text-[10px] text-gray-400 text-right">{form.title.length}/150</p>
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

        </div>

        {form.department === 'Others' && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-amber-700 leading-relaxed">
              Tickets under <strong>Others</strong> are routed to Admin for re-categorization
              before assignment. SLA starts after re-categorization.
            </p>
          </div>
        )}

        <Field label="Description *" error={errors.description}>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} placeholder="Describe the issue in detail (minimum 40 characters)"
            className={`${inputCls(errors.description)} resize-none`} />
          <p className="mt-1 text-[10px] text-gray-400">{form.description.trim().length} / 40 min</p>
        </Field>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Attachments <span className="text-gray-400">(optional · PDF, JPG, PNG, DOCX, XLSX · max 10 MB · up to 5)</span>
          </label>
          <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors ${
            files.length >= 5 ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-indigo-500">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
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
                  <button type="button" onClick={() => removeFile(i)}
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
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 transition-colors shadow-pratiti-sm disabled:opacity-60 flex items-center gap-2">
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
            )}
            {loading ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTicketModal;
