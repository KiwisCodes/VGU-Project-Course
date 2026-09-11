'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { DriveFolder, DriveFile } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Folder, 
  FolderPlus,
  FolderOpen,
  FileText, 
  FilePlus,
  Upload,
  ExternalLink, 
  Download, 
  Search, 
  ArrowLeft, 
  Grid, 
  List as ListIcon, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function MaterialsPage() {
  const { 
    driveFolders, 
    addDriveFolder, 
    updateDriveFolder, 
    deleteDriveFolder, 
    addDriveFile, 
    updateDriveFile, 
    deleteDriveFile 
  } = useProject();
  const { user, loading } = useAuth();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notification, setNotification] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Checking access permissions...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DriveFolder | null>(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    lectureNumber: 1,
    date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'upcoming',
    description: ''
  });

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<DriveFile | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileForm, setFileForm] = useState({
    name: '',
    title: '',
    author: 'VGU CS',
    type: 'pdf' as 'pdf' | 'html' | 'slides' | 'doc',
    size: '1.5 MB',
    sizeBytes: 1572864,
    url: '',
    description: '',
    highlights: ''
  });

  // Delete Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'folder' | 'file';
    folderId: string;
    fileId?: string;
    name: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const activeFolder = driveFolders.find(f => f.id === currentFolderId);

  // Search filtering
  const filteredFolders = driveFolders.filter(folder => {
    if (!searchQuery) return true;
    const matchFolderName = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDesc = folder.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFile = folder.files.some(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchFolderName || matchDesc || matchFile;
  });

  const filteredFiles = activeFolder
    ? activeFolder.files.filter(f => 
        !searchQuery || 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleCopyLink = (url: string, name: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    showToast(`Link copied for ${name}`);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'html':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'slides':
        return <FileText className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getFileTypeBadge = (type: string) => {
    switch (type) {
      case 'pdf': return 'pill-rose';
      case 'html': return 'pill-emerald';
      case 'slides': return 'pill-amber';
      default: return 'pill-blue';
    }
  };

  // Open Folder Modal for Create
  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    const nextNumber = driveFolders.length + 1;
    const formattedDate = new Date().toISOString().split('T')[0];
    const padNum = nextNumber < 10 ? `0${nextNumber}` : `${nextNumber}`;
    setFolderForm({
      name: `Lecture_${padNum}_${formattedDate}`,
      lectureNumber: nextNumber,
      date: formattedDate,
      status: 'upcoming',
      description: `Materials, slide decks, and code for Lecture ${nextNumber}.`
    });
    setIsFolderModalOpen(true);
  };

  // Open Folder Modal for Edit
  const handleOpenEditFolder = (folder: DriveFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      lectureNumber: folder.lectureNumber,
      date: folder.date,
      status: folder.status,
      description: folder.description
    });
    setIsFolderModalOpen(true);
  };

  // Save Folder
  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    if (editingFolder) {
      updateDriveFolder(editingFolder.id, {
        name: folderForm.name.trim(),
        lectureNumber: Number(folderForm.lectureNumber),
        date: folderForm.date,
        status: folderForm.status,
        description: folderForm.description.trim()
      });
      showToast(`Folder "${folderForm.name}" updated`);
    } else {
      addDriveFolder({
        name: folderForm.name.trim(),
        lectureNumber: Number(folderForm.lectureNumber),
        date: folderForm.date,
        status: folderForm.status,
        description: folderForm.description.trim()
      });
      showToast(`Folder "${folderForm.name}" created`);
    }
    setIsFolderModalOpen(false);
    setEditingFolder(null);
  };

  // Open File Modal for Create
  const handleOpenNewFile = () => {
    if (!activeFolder) return;
    setEditingFile(null);
    setSelectedUploadFile(null);
    setFileError(null);
    setFileForm({
      name: `Lecture_${activeFolder.lectureNumber < 10 ? '0' + activeFolder.lectureNumber : activeFolder.lectureNumber}_Notes.pdf`,
      title: `Lecture ${activeFolder.lectureNumber} Overview & Slides`,
      author: 'Dr. Tran Duc Khanh',
      type: 'pdf',
      size: '2.0 MB',
      sizeBytes: 2097152,
      url: `/lectures/${activeFolder.name}/Lecture_${activeFolder.lectureNumber < 10 ? '0' + activeFolder.lectureNumber : activeFolder.lectureNumber}_Notes.pdf`,
      description: `Course notes and slide deck for Lecture ${activeFolder.lectureNumber}.`,
      highlights: 'Official Lecture Deck\nKey Takeaways & Formulas'
    });
    setIsFileModalOpen(true);
  };

  // Open File Modal for Edit
  const handleOpenEditFile = (file: DriveFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingFile(file);
    setSelectedUploadFile(null);
    setFileError(null);
    setFileForm({
      name: file.name,
      title: file.title,
      author: file.author || 'VGU CS',
      type: file.type,
      size: file.size,
      sizeBytes: file.sizeBytes,
      url: file.url,
      description: file.description || '',
      highlights: file.highlights ? file.highlights.join('\n') : ''
    });
    setIsFileModalOpen(true);
  };

  const MAX_FILE_BYTES = 52428800; // 50 MB Free Tier limit

  // Handle Local File Selection (Upload / Path Autodetect)
  const handleFilePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFileError(null);

    // Enforce Supabase Free Tier 50 MB limit
    if (selected.size > MAX_FILE_BYTES) {
      const selectedMb = (selected.size / (1024 * 1024)).toFixed(1);
      setFileError(`File exceeds the 50 MB Free Tier upload limit (selected: ${selectedMb} MB). Please compress or split the file.`);
      e.target.value = '';
      setSelectedUploadFile(null);
      return;
    }

    setSelectedUploadFile(selected);

    let detectedType: 'pdf' | 'html' | 'slides' | 'doc' = 'pdf';
    const lowerName = selected.name.toLowerCase();
    if (lowerName.endsWith('.pdf')) detectedType = 'pdf';
    else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) detectedType = 'html';
    else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) detectedType = 'slides';
    else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerName.endsWith('.md') || lowerName.endsWith('.txt')) detectedType = 'doc';

    const sizeMb = (selected.size / (1024 * 1024)).toFixed(1);
    const sizeStr = selected.size >= 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(selected.size / 1024)} KB`;

    const folderPrefix = activeFolder ? `/lectures/${activeFolder.name}/` : '/lectures/';

    setFileForm(prev => ({
      ...prev,
      name: selected.name,
      title: selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      type: detectedType,
      size: sizeStr,
      sizeBytes: selected.size,
      url: `${folderPrefix}${selected.name}`
    }));
  };

  // Save File
  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder || !fileForm.name.trim()) return;

    let targetUrl = fileForm.url.trim();

    // If a physical file was selected and Supabase is configured, upload to Supabase Storage
    if (selectedUploadFile && isSupabaseConfigured) {
      try {
        setIsUploading(true);
        const folderSlug = activeFolder.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanFileName = `${Date.now()}_${selectedUploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `${folderSlug}/${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('lecture-materials')
          .upload(storagePath, selectedUploadFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) {
          throw uploadErr;
        }

        const { data: publicData } = supabase.storage
          .from('lecture-materials')
          .getPublicUrl(storagePath);

        if (publicData?.publicUrl) {
          targetUrl = publicData.publicUrl;
        }
      } catch (err: any) {
        console.error('Storage upload failed:', err);
        setFileError(`Upload failed: ${err.message || 'Could not upload file to storage.'}`);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const highlightsList = fileForm.highlights
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingFile) {
      updateDriveFile(activeFolder.id, editingFile.id, {
        name: fileForm.name.trim(),
        title: fileForm.title.trim(),
        author: fileForm.author.trim(),
        type: fileForm.type,
        size: fileForm.size.trim(),
        sizeBytes: fileForm.sizeBytes,
        url: targetUrl,
        description: fileForm.description.trim(),
        highlights: highlightsList
      });
      showToast(`File "${fileForm.name}" updated`);
    } else {
      addDriveFile(activeFolder.id, {
        name: fileForm.name.trim(),
        title: fileForm.title.trim(),
        author: fileForm.author.trim(),
        type: fileForm.type,
        size: fileForm.size.trim(),
        sizeBytes: fileForm.sizeBytes,
        url: targetUrl,
        description: fileForm.description.trim(),
        highlights: highlightsList
      });
      showToast(`File "${fileForm.name}" added to ${activeFolder.name}`);
    }
    setIsFileModalOpen(false);
    setEditingFile(null);
    setSelectedUploadFile(null);
    setFileError(null);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'folder') {
      deleteDriveFolder(deleteConfirm.folderId);
      if (currentFolderId === deleteConfirm.folderId) {
        setCurrentFolderId(null);
      }
      showToast(`Folder "${deleteConfirm.name}" deleted`);
    } else if (deleteConfirm.type === 'file' && deleteConfirm.fileId) {
      deleteDriveFile(deleteConfirm.folderId, deleteConfirm.fileId);
      showToast(`File "${deleteConfirm.name}" deleted`);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-badge pill-blue">Course Drive</span>
            <span className="pill-badge pill-emerald">{driveFolders.length} Lecture Folders</span>
            <span className="pill-badge pill-purple">Live Storage</span>
            <span className="pill-badge pill-amber">50MB Max / 1GB Tier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Materials &amp; Slide Drive
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Google Drive-style directory for official course slides, syllabus, and lecture dossiers. PDFs open directly in a new browser tab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notification && (
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-md animate-pulse">
              {notification}
            </div>
          )}

          {!currentFolderId ? (
            <button
              onClick={handleOpenNewFolder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <FilePlus className="w-4 h-4" />
              <span>Add File</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb & Drive Toolbar */}
      <div className="bento-card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-bold flex-wrap">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                !currentFolderId 
                  ? 'shadow-xs text-white' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: !currentFolderId ? 'var(--accent-blue)' : 'transparent',
                color: !currentFolderId ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Drive Root ({driveFolders.length} Folders)</span>
            </button>

            {activeFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>{activeFolder.name}</span>
                </span>
              </>
            )}
          </nav>

          {/* Search, Action & View Switcher */}
          <div className="flex items-center gap-2">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={currentFolderId ? "Search files in folder..." : "Search all folders & files..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 w-48 sm:w-64"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl p-0.5 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ROOT DIRECTORY VIEW: FOLDERS LIST / GRID */}
      {!currentFolderId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Course Lecture Folders ({filteredFolders.length})
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Click any folder to inspect its documents
              </span>
              <button
                onClick={handleOpenNewFolder}
                className="inline-flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                style={{ color: 'var(--accent-blue)' }}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Folder</span>
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredFolders.map(folder => {
                const isActive = folder.status === 'active';

                return (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="bento-card p-4 cursor-pointer hover:border-blue-400 group transition-all flex flex-col justify-between relative"
                  >
                    <div>
                      {/* Top Bar: Icon, Date, Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                          style={{
                            backgroundColor: isActive ? 'var(--accent-blue-soft)' : 'var(--bg-surface-elevated)',
                            color: isActive ? 'var(--accent-blue)' : 'var(--text-faint)'
                          }}
                        >
                          <Folder className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <span className="pill-badge pill-emerald text-[10px]">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {folder.files.length} files
                            </span>
                          ) : (
                            <span className="pill-badge pill-amber text-[10px]">
                              <Clock className="w-2.5 h-2.5" /> Not yet
                            </span>
                          )}

                          {/* Quick Edit Folder */}
                          <button
                            onClick={(e) => handleOpenEditFolder(folder, e)}
                            title="Edit folder"
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-opacity text-slate-400 hover:text-blue-500"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Folder Name & Info */}
                      <h3 className="font-extrabold text-xs font-mono mb-1 truncate" style={{ color: 'var(--text-main)' }}>
                        {folder.name}
                      </h3>
                      <p className="text-[11px] line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                        {folder.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t flex items-center justify-between text-[10px] font-semibold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-faint)' }}>
                      <span>Lecture {folder.lectureNumber}</span>
                      <span className="font-mono">{folder.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* Table View */
            <div className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                      <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Folder Name</th>
                      <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Lecture Session</th>
                      <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Status</th>
                      <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>File Count</th>
                      <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Date</th>
                      <th className="py-3 px-4 font-bold text-right" style={{ color: 'var(--text-faint)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {filteredFolders.map(folder => {
                      const isActive = folder.status === 'active';

                      return (
                        <tr
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 flex items-center gap-2.5 font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                            <Folder className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span>{folder.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="pill-badge pill-blue text-[10px]">
                              Lecture {folder.lectureNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isActive ? (
                              <span className="pill-badge pill-emerald text-[10px]">
                                Active
                              </span>
                            ) : (
                              <span className="pill-badge pill-amber text-[10px]">
                                Not yet
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>
                            {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {folder.date}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditFolder(folder)}
                                title="Edit Folder"
                                className="p-1.5 rounded-lg border hover:opacity-80 transition-all text-xs cursor-pointer text-muted"
                                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'folder', folderId: folder.id, name: folder.name })}
                                title="Delete Folder"
                                className="p-1.5 rounded-lg border hover:opacity-80 transition-all text-xs cursor-pointer text-rose-500"
                                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCurrentFolderId(folder.id)}
                                className="px-2.5 py-1 rounded-lg font-bold border hover:opacity-80 transition-all text-xs cursor-pointer"
                                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--accent-blue)' }}
                              >
                                Open
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOLDER CONTENTS VIEW */}
      {activeFolder && (
        <div className="space-y-4">
          
          {/* Active Folder Header Banner */}
          <div className="bento-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-extrabold" style={{ color: 'var(--accent-blue)' }}>
                      📁 {activeFolder.name}
                    </span>
                    <span className={`pill-badge text-[10px] ${activeFolder.status === 'active' ? 'pill-emerald' : 'pill-amber'}`}>
                      {activeFolder.status === 'active' ? 'Active' : 'Not yet'}
                    </span>
                    <span className="pill-badge pill-purple text-[10px]">
                      {activeFolder.date}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
                    Lecture {activeFolder.lectureNumber} Materials &amp; Slides
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {activeFolder.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Folders</span>
                </button>

                <button
                  onClick={() => handleOpenEditFolder(activeFolder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit Folder</span>
                </button>

                <button
                  onClick={handleOpenNewFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Upload / Add File</span>
                </button>

                {activeFolder.lectureNumber === 1 && (
                  <Link
                    href="/lectures/1"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-emerald)' }}
                  >
                    <span>Lecture 1 Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Files List or Empty State */}
          {filteredFiles.length > 0 ? (
            
            viewMode === 'grid' ? (
              
              /* File Grid View */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className="bento-card p-5 flex flex-col justify-between hover:border-blue-400 group transition-all"
                  >
                    <div>
                      {/* Top: Type Badge & Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`pill-badge text-[10px] ${getFileTypeBadge(file.type)}`}>
                          {file.type.toUpperCase()} • {file.size}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditFile(file)}
                            title="Edit file details"
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted transition-all cursor-pointer"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <Pencil className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                          </button>
                          
                          <button
                            onClick={() => setDeleteConfirm({ type: 'file', folderId: activeFolder.id, fileId: file.id, name: file.name })}
                            title="Delete file"
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 transition-all cursor-pointer"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new browser tab"
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted transition-all"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                          </a>
                        </div>
                      </div>

                      {/* File Icon & Name */}
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-mono text-xs font-bold truncate leading-tight" style={{ color: 'var(--text-main)' }}>
                            {file.name}
                          </h4>
                          {file.author && (
                            <span className="text-[10px] block text-muted mt-0.5">
                              {file.author}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h5 className="font-extrabold text-xs leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                        {file.title}
                      </h5>
                      <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                        {file.description}
                      </p>

                      {/* Highlights */}
                      {file.highlights && file.highlights.length > 0 && (
                        <div className="p-2.5 rounded-xl mb-3 space-y-1" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-faint)' }}>
                            Key Highlights:
                          </span>
                          {file.highlights.slice(0, 2).map((h, i) => (
                            <div key={i} className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                              <span className="truncate">{h}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Open in Tab & Download */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-blue)' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Tab</span>
                      </a>

                      <a
                        href={file.url}
                        download={file.name}
                        title="Download file"
                        className="p-2 rounded-xl border hover:opacity-80 transition-all text-muted cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleCopyLink(file.url, file.name)}
                        title="Copy direct file URL"
                        className="p-2 rounded-xl border hover:opacity-80 transition-all text-muted cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              
              /* File Table View */
              <div className="bento-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                        <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>File Name</th>
                        <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Document Title</th>
                        <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Format</th>
                        <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Author</th>
                        <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Size</th>
                        <th className="py-3 px-4 font-bold text-right" style={{ color: 'var(--text-faint)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {filteredFiles.map(file => (
                        <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-2 font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                            {getFileIcon(file.type)}
                            <span>{file.name}</span>
                          </td>
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-main)' }}>
                            {file.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`pill-badge text-[10px] ${getFileTypeBadge(file.type)}`}>
                              {file.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                            {file.author || 'VGU CS'}
                          </td>
                          <td className="py-3 px-4 font-mono" style={{ color: 'var(--text-muted)' }}>
                            {file.size}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90"
                                style={{ backgroundColor: 'var(--accent-blue)' }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open</span>
                              </a>
                              <a
                                href={file.url}
                                download={file.name}
                                className="p-1 rounded-lg border hover:opacity-80 text-muted"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleOpenEditFile(file)}
                                title="Edit file"
                                className="p-1 rounded-lg border hover:opacity-80 text-muted"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'file', folderId: activeFolder.id, fileId: file.id, name: file.name })}
                                title="Delete file"
                                className="p-1 rounded-lg border hover:opacity-80 text-rose-500"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

          ) : (
            
            /* Empty Folder State */
            <div className="bento-card p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                Folder Empty
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                No materials have been uploaded to <code>{activeFolder.name}</code> yet. You can upload slide decks, documents, or lecture notes now.
              </p>
              <div className="pt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                >
                  &larr; All Folders
                </button>
                <button
                  onClick={handleOpenNewFile}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  + Add First File
                </button>
              </div>
            </div>

          )}

        </div>
      )}

      {/* FOLDER MODAL (CREATE & EDIT) */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)' 
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-extrabold">
                  {editingFolder ? 'Edit Folder Properties' : 'Create New Lecture Folder'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Folder Name (Filesystem Standard)
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="Lecture_02_2026-09-16"
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 font-mono text-xs"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Convention: <code>Lecture_XX_YYYY-MM-DD</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Lecture Session #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    required
                    value={folderForm.lectureNumber}
                    onChange={(e) => setFolderForm({ ...folderForm, lectureNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </label>
                  <select
                    value={folderForm.status}
                    onChange={(e) => setFolderForm({ ...folderForm, status: e.target.value as 'active' | 'upcoming' })}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="active">Active (Conducted)</option>
                    <option value="upcoming">Upcoming (Not yet)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Scheduled Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={folderForm.date}
                  onChange={(e) => setFolderForm({ ...folderForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  placeholder="Syllabus, topics covered, or slide deck summaries..."
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs resize-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl font-bold border hover:opacity-80 transition-all text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-white shadow-xs hover:opacity-90 transition-all text-xs cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {editingFolder ? 'Save Changes' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE MODAL (CREATE & EDIT) */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)' 
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-extrabold">
                  {editingFile ? 'Edit File Metadata' : 'Add File to ' + (activeFolder?.name || 'Folder')}
                </h3>
              </div>
              <button 
                onClick={() => setIsFileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFile} className="space-y-3.5 text-xs">
              
              {/* File Error Notice */}
              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Upload Validation Error</p>
                      <p className="text-[11px] mt-0.5">{fileError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Local File Autofill / Cloud Upload */}
              {!editingFile && (
                <div className="p-3 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <label className="cursor-pointer block">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <span className="font-bold text-xs block" style={{ color: 'var(--accent-blue)' }}>
                      {isSupabaseConfigured ? 'Choose file to upload to Supabase Storage' : 'Click to choose local file to autofill'}
                    </span>
                    <span className="text-[10px] text-muted block">
                      Max 50 MB per file (Free Tier limit). Formats: PDF, HTML, Slides, Markdown
                    </span>
                    <input
                      type="file"
                      onChange={handleFilePickerChange}
                      className="hidden"
                    />
                  </label>
                  {selectedUploadFile && (
                    <div className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Ready to upload: {selectedUploadFile.name} ({(selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Filename
                  </label>
                  <input
                    type="text"
                    required
                    value={fileForm.name}
                    onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                    placeholder="Lecture_01_Slides.pdf"
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 font-mono text-xs"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    File Format / Type
                  </label>
                  <select
                    value={fileForm.type}
                    onChange={(e) => setFileForm({ ...fileForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="html">HTML Dossier (.html)</option>
                    <option value="slides">Presentation (.ppt / .key)</option>
                    <option value="doc">Markdown / Document (.doc / .md)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={fileForm.title}
                  onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                  placeholder="Official Lecture Slides & Syllabus"
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Resource URL / Target Path
                  </label>
                  <input
                    type="text"
                    required
                    value={fileForm.url}
                    onChange={(e) => setFileForm({ ...fileForm, url: e.target.value })}
                    placeholder="/lectures/Lecture_01_2026-09-09/slides.pdf"
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 font-mono text-xs"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  />
                  <span className="text-[10px] text-muted mt-0.5 block">
                    Target path under <code>/lectures/...</code> or external URL
                  </span>
                </div>

                <div>
                  <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    File Size
                  </label>
                  <input
                    type="text"
                    required
                    value={fileForm.size}
                    onChange={(e) => setFileForm({ ...fileForm, size: e.target.value })}
                    placeholder="2.5 MB"
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Author / Presenter
                </label>
                <input
                  type="text"
                  value={fileForm.author}
                  onChange={(e) => setFileForm({ ...fileForm, author: e.target.value })}
                  placeholder="Dr. Tran Duc Khanh or Team Lead"
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Description / Abstract
                </label>
                <textarea
                  rows={2}
                  value={fileForm.description}
                  onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                  placeholder="Detailed context, topics covered, reference notes..."
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs resize-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Key Highlights (One bullet per line)
                </label>
                <textarea
                  rows={2}
                  value={fileForm.highlights}
                  onChange={(e) => setFileForm({ ...fileForm, highlights: e.target.value })}
                  placeholder="Lecture timeline & grading criteria&#10;Topic 1: Modern Deep Learning"
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 text-xs resize-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl font-bold border hover:opacity-80 transition-all text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl font-bold text-white shadow-xs hover:opacity-90 transition-all text-xs cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {isUploading ? 'Uploading to Storage...' : editingFile ? 'Save Changes' : selectedUploadFile ? 'Upload to Storage & Save' : 'Add File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div 
            className="w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)' 
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">
                  Delete {deleteConfirm.type === 'folder' ? 'Folder' : 'File'}?
                </h4>
                <p className="text-xs text-muted">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs">
              Are you sure you want to delete <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{deleteConfirm.name}</span>
              {deleteConfirm.type === 'folder' ? ' and all files stored inside it?' : '?'}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-1.5 rounded-xl font-bold border hover:opacity-80 transition-all text-xs cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl font-bold text-white shadow-xs hover:opacity-90 transition-all text-xs bg-rose-600 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
