import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Link, MessageSquare, User, Download, Copy, Check, History, Palette, Image as ImageIcon, Trash2, X, RefreshCw, ChevronRight, Hash, ChevronDown } from 'lucide-react';

const TRANSLATIONS = {
  "en-US": {
    "appTitle": "QR Studio",
    "appDescription": "Professional-grade QR code creation",
    "urlTab": "URL",
    "textTab": "Text",
    "contactTab": "Contact",
    "historyTab": "History",
    "enterUrl": "Target URL",
    "enterText": "Text Content",
    "contactInformation": "Contact Information",
    "websiteUrl": "URL",
    "urlPlaceholder": "https://example.com",
    "urlHelp": "We automatically handle the protocol for you.",
    "textContent": "Text",
    "textPlaceholder": "Type your message here...",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phoneNumber": "Phone Number",
    "emailAddress": "Email Address",
    "organization": "Company",
    "website": "Website",
    "clearAllFields": "Clear All",
    "generatedQrCode": "Preview",
    "scanQrCode": "Scan to Preview",
    "fillFormPrompt": "Complete fields to generate",
    "download": "Export PNG",
    "copyData": "Copy Data",
    "copied": "Copied!",
    "qrCodeData": "Encoded Data",
    "footerText": "Secure • Client-side • High Fidelity",
    "colors": "Custom Colors",
    "foreground": "Foreground",
    "background": "Background",
    "logo": "Branding",
    "uploadLogo": "Add Logo",
    "removeLogo": "Remove",
    "history": "Recent Projects",
    "noHistory": "No history yet",
    "clearHistory": "Clear all"
  }
};

const t = (key) => TRANSLATIONS["en-US"][key] || key;

const PRESET_COLORS = [
  '#000000', '#0F172A', '#1E293B', '#334155', '#475569',
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1',
  '#2563EB', '#3B82F6', '#06B6D4', '#10B981', '#84CC16',
  '#EAB308', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'
];

// Helper functions for color conversion
const hexToHsl = (hex) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const CustomColorWheel = ({ color, onChange }) => {
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const satRectRef = useRef(null);
  const hueRectRef = useRef(null);

  useEffect(() => {
    const newHsl = hexToHsl(color);
    if (Math.abs(newHsl.h - hsl.h) > 1 || Math.abs(newHsl.s - hsl.s) > 1 || Math.abs(newHsl.l - hsl.l) > 1) {
      setHsl(newHsl);
    }
  }, [color]);

  const handleSatMouseDown = (e) => {
    const move = (event) => {
      const rect = satRectRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const newS = x * 100;
      const newL = (1 - y) * 100;
      setHsl(prev => {
        const updated = { ...prev, s: newS, l: newL };
        onChange(hslToHex(updated.h, updated.s, updated.l));
        return updated;
      });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e);
  };

  const handleHueMouseDown = (e) => {
    const move = (event) => {
      const rect = hueRectRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const newH = x * 360;
      setHsl(prev => {
        const updated = { ...prev, h: newH };
        onChange(hslToHex(updated.h, updated.s, updated.l));
        return updated;
      });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e);
  };

  return (
    <div className="space-y-4">
      {/* Saturation/Lightness Box */}
      <div 
        ref={satRectRef}
        onMouseDown={handleSatMouseDown}
        className="relative w-full aspect-video rounded-xl cursor-crosshair overflow-hidden border border-slate-200"
        style={{ backgroundColor: `hsl(${hsl.h}, 100%, 50%)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div 
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md -translate-x-1/2 translate-y-1/2 pointer-events-none"
          style={{ left: `${hsl.s}%`, bottom: `${hsl.l}%` }}
        />
      </div>

      {/* Hue Slider */}
      <div 
        ref={hueRectRef}
        onMouseDown={handleHueMouseDown}
        className="relative h-6 w-full rounded-full cursor-pointer shadow-inner"
        style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
      >
        <div 
          className="absolute w-6 h-6 bg-white border-2 border-slate-900 rounded-full shadow-md -translate-x-1/2 pointer-events-none top-0"
          style={{ left: `${(hsl.h / 360) * 100}%` }}
        />
      </div>
    </div>
  );
};

const ColorPicker = ({ label, color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex-1 space-y-3" ref={containerRef}>
      <label className="text-xs font-bold text-slate-400 block">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 transition-all shadow-sm group"
        >
          <div 
            className="w-8 h-8 rounded-lg shadow-inner border border-slate-100" 
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 text-left flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 group-hover:text-slate-900">{color.toUpperCase()}</span>
            <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <>
            {/* Desktop Popover */}
            <div className="hidden md:block absolute z-50 top-full mt-3 left-0 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-in zoom-in duration-200 origin-top-left">
              <CustomColorWheel color={color} onChange={onChange} />
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {PRESET_COLORS.map((pColor) => (
                    <button
                      key={pColor}
                      onClick={() => onChange(pColor)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${color === pColor ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: pColor }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <Hash size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-mono font-bold focus:outline-none"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Bottom Sheet */}
            <div className="md:hidden">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" onClick={() => setIsOpen(false)} />
              <div className="fixed bottom-0 left-0 right-0 bg-white z-[101] rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900">{label}</h3>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                    <X size={20} />
                  </button>
                </div>
                
                <CustomColorWheel color={color} onChange={onChange} />

                <div className="mt-8">
                  <div className="grid grid-cols-5 gap-3 mb-8">
                    {PRESET_COLORS.map((pColor) => (
                      <button
                        key={pColor}
                        onClick={() => onChange(pColor)}
                        className={`w-full aspect-square rounded-xl border-2 transition-all ${color === pColor ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: pColor }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 mb-6">
                    <Hash size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => onChange(e.target.value)}
                      className="flex-1 bg-transparent text-lg font-mono font-bold focus:outline-none"
                      placeholder="#000000"
                    />
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest">
                    Done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const QRCodeGenerator = () => {
  const [activeTab, setActiveTab] = useState('url');
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);

  const [fgColor, setFgColor] = useState('#0F172A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [logo, setLogo] = useState(null);
  const [history, setHistory] = useState([]);

  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [contactInfo, setContactInfo] = useState({
    firstName: '', lastName: '', phone: '', email: '', organization: '', url: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('qr_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qr_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (data, type) => {
    if (!data || !data.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item.data !== data);
      return [{ data, type, timestamp: Date.now() }, ...filtered].slice(0, 8);
    });
  };

  const generateQRCode = async (text) => {
    if (!text || !text.trim()) {
      if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
      return;
    }

    if (!window.QRious) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.onload = () => createQR(text);
      document.head.appendChild(script);
    } else {
      createQR(text);
    }
  };

  const createQR = (text) => {
    if (!qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainerRef.current.appendChild(canvas);

    const size = 800;
    new window.QRious({
      element: canvas,
      value: text,
      size: size,
      background: bgColor,
      foreground: fgColor,
      level: 'H'
    });

    canvas.className = 'w-full h-auto rounded-lg shadow-sm';
    canvas.style.maxWidth = '280px';

    if (logo) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = logo;
      img.onload = () => {
        const logoSize = size * 0.22;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 10, logoSize + 20, logoSize + 20, 15);
        ctx.fill();
        ctx.drawImage(img, x, y, logoSize, logoSize);
      };
    }
  };

  useEffect(() => {
    let data = '';
    if (activeTab === 'url') {
      data = (urlInput.trim() && !urlInput.startsWith('http')) ? 'https://' + urlInput : urlInput;
    } else if (activeTab === 'text') {
      data = textInput;
    } else if (activeTab === 'contact' && (contactInfo.firstName || contactInfo.phone)) {
      const c = contactInfo;
      data = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.firstName} ${c.lastName}\nTEL:${c.phone}\nEMAIL:${c.email}\nEND:VCARD`;
    }
    
    if (data !== qrData) {
      setQrData(data);
    }
    generateQRCode(data);
  }, [activeTab, urlInput, textInput, contactInfo, fgColor, bgColor, logo]);

  useEffect(() => {
    if (!qrData || !qrData.trim() || activeTab === 'history') return;

    const timeoutId = setTimeout(() => {
      addToHistory(qrData, activeTab);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [qrData]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const downloadQRCode = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-studio-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl">
              <QrCode className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('appTitle')}</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('appDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setUrlInput(''); setTextInput(''); setLogo(null); setContactInfo({firstName:'',lastName:'',phone:'',email:'',organization:'',url:''}); }} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500" title="Reset all">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <main className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'url', label: t('urlTab'), icon: Link },
                  { id: 'text', label: t('textTab'), icon: MessageSquare },
                  { id: 'contact', label: t('contactTab'), icon: User },
                  { id: 'history', label: t('historyTab'), icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8">
                {activeTab === 'url' && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <label className="text-sm font-bold text-slate-700">{t('enterUrl')}</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder={t('urlPlaceholder')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'text' && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <label className="text-sm font-bold text-slate-700">{t('enterText')}</label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={t('textPlaceholder')}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all resize-none placeholder:text-slate-300"
                    />
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="grid sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    {[
                      { key: 'firstName', label: t('firstName') },
                      { key: 'lastName', label: t('lastName') },
                      { key: 'phone', label: t('phoneNumber') },
                      { key: 'email', label: t('emailAddress') }
                    ].map(field => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</label>
                        <input
                          type="text"
                          value={contactInfo[field.key]}
                          onChange={(e) => setContactInfo({ ...contactInfo, [field.key]: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:border-slate-900 outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-700">{t('history')}</h3>
                      {history.length > 0 && (
                        <button onClick={() => setHistory([])} className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1">
                          <Trash2 size={12} /> {t('clearHistory')}
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                      {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 italic text-sm">{t('noHistory')}</div>
                      ) : (
                        history.map((item, idx) => (
                          <button key={idx} onClick={() => { if (item.type === 'url') { setActiveTab('url'); setUrlInput(item.data); } else if (item.type === 'text') { setActiveTab('text'); setTextInput(item.data); } }} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-400 transition-all text-left group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 group-hover:text-slate-900 transition-colors">
                                {item.type === 'url' ? <Link size={14}/> : <MessageSquare size={14}/>}
                              </div>
                              <p className="text-sm font-semibold truncate text-slate-600 group-hover:text-slate-900 transition-colors">{item.data}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                <div className="flex items-center gap-2 mb-6">
                  <Palette size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{t('colors')}</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ColorPicker label={t('foreground')} color={fgColor} onChange={setFgColor} />
                  <ColorPicker label={t('background')} color={bgColor} onChange={setBgColor} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <ImageIcon size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{t('logo')}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer bg-slate-900 text-white p-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                    {t('uploadLogo')}
                    <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </label>
                  {logo && (
                    <button onClick={() => setLogo(null)} className="p-3.5 border border-slate-200 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors">
                      <X size={18} />
                    </button>
                  )}
                </div>
                <p className="mt-4 text-[10px] text-slate-400 font-medium italic text-center">Recommended: Square PNG with transparent background</p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{t('generatedQrCode')}</h2>
              <div className="relative group p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 w-full flex items-center justify-center">
                {qrData ? (
                  <div ref={qrContainerRef} className="animate-in zoom-in duration-300" />
                ) : (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <QrCode size={32} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{t('fillFormPrompt')}</p>
                  </div>
                )}
              </div>

              {qrData && (
                <div className="w-full mt-10 space-y-3">
                  <button
                    onClick={downloadQRCode}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    <Download size={18} /> {t('download')}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={async () => { await navigator.clipboard.writeText(qrData); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="bg-white border border-slate-200 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />} 
                      {copied ? t('copied') : t('copyData')}
                    </button>
                    <button 
                      onClick={() => setUrlInput('')}
                      className="bg-white border border-slate-200 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Trash2 size={14} /> {t('clearAllFields')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl text-white overflow-hidden relative group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{t('qrCodeData')}</h4>
              <p className="text-xs font-mono break-all opacity-80 leading-relaxed line-clamp-3">
                {qrData || "Generate code to view raw encoded data..."}
              </p>
            </div>

            <footer className="px-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">{t('footerText')}</p>
            </footer>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
