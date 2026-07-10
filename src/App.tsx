/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ImageItem, LayoutType, AppState } from './types';
import { Editor } from './components/Editor';
import { LayoutStage } from './components/LayoutStage';
import { ImageIcon, Moon, Sun, ArrowLeft, Copy, ExternalLink, Check } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<'edit' | 'published'>('edit');
  const [publishedId, setPublishedId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial theme check and URL params
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const checkUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        try {
          const res = await fetch(`/api/galleries/${id}`);
          if (res.ok) {
            const data = await res.json();
            setImages(data.images);
            setLayout(data.layout);
            setPublishedId(id);
            setViewMode('published');
          } else {
            console.error('Gallery not found');
          }
        } catch (e) {
          console.error(e);
        }
      }
      setIsLoading(false);
    };
    
    checkUrl();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handlePublish = async () => {
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, layout })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPublishedId(data.id);
        setViewMode('published');
        // Update URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('id', data.id);
        window.history.pushState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to publish', e);
      alert('Failed to create link');
    }
  };

  const actualUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(actualUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackToEditor = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
    setViewMode('edit');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  if (viewMode === 'published') {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Published Header Banner */}
        <div className="fixed top-0 inset-x-0 h-14 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToEditor}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
              title="Back to Editor"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate max-w-[200px] sm:max-w-md">
                {actualUrl.replace(/^https?:\/\//, '')}
              </span>
              <button 
                onClick={copyToClipboard}
                className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md hover:opacity-90" onClick={() => window.open(actualUrl, '_blank')}>
               Open <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Viewer Stage */}
        <div className="pt-14 flex-1">
          <LayoutStage images={images} layout={layout} isViewer={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* App Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ImageLink <span className="font-light">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Editor */}
      <Editor 
        images={images} 
        layout={layout} 
        setImages={setImages} 
        setLayout={setLayout} 
        onPublish={handlePublish}
      />
    </div>
  );
}

