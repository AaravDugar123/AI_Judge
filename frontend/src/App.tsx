import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Upload as UploadIcon, Bot, Users, TrendingUp, Github, ExternalLink } from 'lucide-react';
import Upload from "./pages/Upload";
import Judges from "./pages/Judges";
import Queue from "./pages/Queue";  
import Results from "./pages/Results";

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Upload', icon: UploadIcon },
    { path: '/judges', label: 'Judges', icon: Bot },
    { path: '/queue', label: 'Assignments', icon: Users },
    { path: '/results', label: 'Results', icon: TrendingUp },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">AI Judge</span>
            </Link>
            
            <div className="flex space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/yourusername/ai-judge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
            >
              <Github className="w-4 h-4 mr-1" />
              <ExternalLink className="w-3 h-3" />
            </a>
          <div className="text-sm text-gray-500">
            Backend: localhost:5000
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/judges" element={<Judges />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>AI Judge - Automated Submission Evaluation Platform</p>
              <p>Built with React, TypeScript, and Flask</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}