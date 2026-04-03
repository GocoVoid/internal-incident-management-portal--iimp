import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import { getComments, saveResolutionNote } from '../../services/incidentService';

const SUPPORT_TRANSITIONS = {
  'In Progress': ['Resolved'],
  'Open':        ['In Progress'],
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Update Status Panel
export const UpdateStatusPanel = ({ ticket, onUpdateStatus }) => {
  const [note,    
    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!ticket) return null;

  const allowed = SUPPORT_TRANSITIONS[ticket.status] ?? [];

  const handleUpdate = async (newStatus) => {
    setLoading(true);
    setSuccess('');
    await new Promise((r) => setTimeout(r, 500));
    saveResolutionNote(ticket.id, note);
    setSuccess(`Status updated to "${newStatus}"`);
    setNote('');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>

      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
        <p className="text-xs font-mono text-indigo-600">{ticket.id}</p>
        <p className="text-sm font-medium text-gray-800">{ticket.title}</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Resolution note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Describe what was done to resolve this issue…"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
        />
      </div>

      {allowed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowed.map((s) => (
            <button
              key={s}
              onClick={() => handleUpdate(s)}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60
                ${s === 'Resolved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                }`}
            >
              {loading ? 'Updating…' : `Mark as ${s}`}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">No status transitions available</p>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-xs text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
};

// Comment & Attachment Panel

export const CommentAttachmentPanel = ({ ticket, onAddComment, authorName }) => {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!ticket?.id) return;
      
      setFetching(true);
      try {
        const data = await getComments(ticket.id);
        setComments(data || []);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchComments();
  }, [ticket?.id]);

  if (!ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && files.length === 0) return;
    
    setLoading(true);
    
    await onAddComment(ticket.id, comment.trim(), authorName, files);
    
    const updatedComments = await getComments(ticket.id);
    setComments(updatedComments);
    
    setComment('');
    setFiles([]);
    setLoading(false);
  };

  const handleFiles = (e) => {
    const remaining = 5 - (ticket.attachments?.length ?? 0) - files.length;
    const picked = Array.from(e.target.files).slice(0, remaining);
    setFiles((p) => [...p, ...picked].slice(0, 5));
    e.target.value = ''; 
  };

  const removeFile = (idx) => setFiles((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Comments & Attachments</h3>

      <div className="space-y-3 max-h-52 overflow-y-auto">
        {fetching ? (
          <p className="text-xs text-gray-400 text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-700 shrink-0 mt-0.5">
                {c.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-800">{c.user.name} {c.user.role ?? ''}</span>
                  <span className="text-[10px] text-gray-400">
                    {c.createdAt ? formatDate(c.createdAt) : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{c.commentText}</p>
                
                {ticket.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {ticket.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-indigo-500 hover:underline">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        {a.fileName ?? `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
        />


        <button
          type="submit"
          disabled={(!comment.trim() && files.length === 0) || loading}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};