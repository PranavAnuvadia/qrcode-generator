import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Link, MessageSquare, User, Download, Copy, Check, History, Palette, Image as ImageIcon, Trash2 } from 'lucide-react';

const TRANSLATIONS = {
  "en-US": {
    "appTitle": "QR Generator",
    "appDescription": "Simple, clean QR code generation",
    "urlTab": "URL",
    "textTab": "Text",
    "contactTab": "Contact",
    "historyTab": "History",
    "enterUrl": "Website URL",
    "enterText": "Text Content",
    "contactInformation": "Contact Info",
    "websiteUrl": "URL",
    "urlPlaceholder": "example.com",
    "urlHelp": "Auto-prefixes https:// if missing.",
    "textContent": "Text",
    "textPlaceholder": "Enter text...",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phoneNumber": "Phone",
    "emailAddress": "Email",
    "organization": "Company",
    "website": "Website",
    "clearAllFields": "Reset",
    "generatedQrCode": "Result",
    "scanQrCode": "Scan me",
    "fillFormPrompt": "Enter data to generate",
    "download": "Download",
    "copyData": "Copy",
    "copied": "Copied!",
    "qrCodeData": "Raw Data:",
    "footerText": "Private • Minimal • Free",
    "colors": "Colors",
    "foreground": "Foreground",
    "background": "Background",
    "logo": "Logo",
    "uploadLogo": "Upload Logo",
    "removeLogo": "Remove",
    "history": "Recent",
    "noHistory": "No recent QR codes",
    "clearHistory": "Clear History"
  }
};

const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const t = (key) => TRANSLATIONS["en-US"][key] || key;

const QRCodeGenerator = () => {
  const [activeTab, setActiveTab] = useState('url');
  const [qrData, setQrData] = useState('');
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);

  // Customization states
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logo, setLogo] = useState(null);
  const [history, setHistory] = useState([]);

  // Form states
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [contactInfo, setContactInfo] = useState({
    firstName: '', lastName: '', phone: '', email: '', organization: '', url: ''
  });

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('qr_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (data, type) => {
    if (!data.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item.data !== data);
      const newItem = { data, type, timestamp: Date.now() };
      return [newItem, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  const generateQRCode = async (text) => {
    if (!text.trim()) {
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

    const size = 600; // High res internal size
    const qr = new window.QRious({
      element: canvas,
      value: text,
      size: size,
      background: bgColor,
      foreground: fgColor,
      level: 'H' // Higher error correction for logos
    });

    canvas.className = 'w-full h-auto border border-gray-100 max-w-[300px] shadow-sm';

    if (logo) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = logo;
      img.onload = () => {
        const logoSize = size * 0.2;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;
        
        // Draw white background for logo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
        
        // Draw logo
        ctx.drawImage(img, x, y, logoSize, logoSize);
      };
    }
  };

  const formatUrl = (url) => {
    if (!url.trim()) return '';
    return (url.startsWith('http://') || url.startsWith('https://')) ? url : 'https://' + url;
  };

  const generateVCard = (c) => `BEGIN:VCARD\nVERSION:3.0\nFN:${c.firstName} ${c.lastName}\nN:${c.lastName};${c.firstName};;;\nORG:${c.organization}\nTEL:${c.phone}\nEMAIL:${c.email}\nURL:${c.url}\nEND:VCARD`;

  useEffect(() => {
    let data = '';
    let type = activeTab;
    if (activeTab === 'url') data = formatUrl(urlInput);
    else if (activeTab === 'text') data = textInput;
    else if (activeTab === 'contact' && (contactInfo.firstName || contactInfo.phone)) data = generateVCard(contactInfo);
    
    if (data !== qrData) {
      setQrData(data);
      if (data) addToHistory(data, type);
    }
    generateQRCode(data);
  }, [activeTab, urlInput, textInput, contactInfo, fgColor, bgColor, logo]);

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
      link.download = `qr-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const copyToClipboard = async () => {
    if (qrData) {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setUrlInput(''); setTextInput(''); setLogo(null);
    setContactInfo({ firstName: '', lastName: '', phone: '', email: '', organization: '', url: '' });
    setFgColor('#000000'); setBgColor('#ffffff');
  };

  const tabs = [
    { id: 'url', label: t('urlTab'), icon: Link },
    { id: 'text', label: t('textTab'), icon: MessageSquare },
    { id: 'contact', label: t('contactTab'), icon: User },
    { id: 'history', label: t('historyTab'), icon: History }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 border-l-4 border-black pl-6">
          <h1 className="text-5xl font-black tracking-tight mb-2 uppercase italic">{t('appTitle')}</h1>
          <p className="text-gray-500 font-medium">{t('appDescription')}</p>
        </header>

        <div className="grid lg:grid-cols-[1fr_350px] gap-16 items-start">
          <section className="space-y-12">
            <nav className="flex gap-8 border-b border-gray-100 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'text-black border-b-2 border-black' : 'text-gray-300 hover:text-gray-600'}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="min-h-[300px]">
              {activeTab === 'url' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-xs font-black uppercase tracking-tighter text-gray-400">{t('enterUrl')}</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t('urlPlaceholder')}
                    className="w-full text-2xl font-light border-b-2 border-gray-100 focus:border-black outline-none py-2 transition-all"
                  />
                  <p className="text-[10px] text-gray-400 font-medium italic">{t('urlHelp')}</p>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-xs font-black uppercase tracking-tighter text-gray-400">{t('enterText')}</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t('textPlaceholder')}
                    rows={4}
                    className="w-full text-2xl font-light border-b-2 border-gray-100 focus:border-black outline-none py-2 transition-all resize-none"
                  />
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {[
                    { key: 'firstName', label: t('firstName') },
                    { key: 'lastName', label: t('lastName') },
                    { key: 'phone', label: t('phoneNumber') },
                    { key: 'email', label: t('emailAddress') },
                    { key: 'organization', label: t('organization') },
                    { key: 'url', label: t('website') }
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-tighter text-gray-400">{field.label}</label>
                      <input
                        type="text"
                        value={contactInfo[field.key]}
                        onChange={(e) => setContactInfo({ ...contactInfo, [field.key]: e.target.value })}
                        className="w-full text-lg border-b border-gray-100 focus:border-black outline-none py-1 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-tighter text-gray-400">{t('history')}</label>
                    {history.length > 0 && (
                      <button onClick={() => setHistory([])} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 flex items-center gap-1">
                        <Trash2 size={10} /> {t('clearHistory')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <p className="text-gray-300 italic">{t('noHistory')}</p>
                    ) : (
                      history.map((item, idx) => (
                        <div key={idx} onClick={() => {
                          if (item.type === 'url') { setActiveTab('url'); setUrlInput(item.data); }
                          else if (item.type === 'text') { setActiveTab('text'); setTextInput(item.data); }
                        }} className="group flex items-center justify-between p-4 border border-gray-100 hover:border-black cursor-pointer transition-all">
                          <div className="overflow-hidden">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{item.type}</p>
                            <p className="text-sm truncate font-medium">{item.data}</p>
                          </div>
                          <span className="text-[10px] text-gray-300 group-hover:text-black font-bold whitespace-nowrap ml-4">LOAD →</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-12 border-t border-gray-100 grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-gray-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{t('colors')}</h3>
                </div>
                <div className="flex gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase text-gray-400">{t('foreground')}</label>
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-12 h-12 block border-none cursor-pointer bg-transparent" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase text-gray-400">{t('background')}</label>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-12 block border-none cursor-pointer bg-transparent" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={16} className="text-gray-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{t('logo')}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                    {t('uploadLogo')}
                    <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </label>
                  {logo && (
                    <button onClick={() => setLogo(null)} className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700">
                      {t('removeLogo')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-20 space-y-8">
            <div className="border-4 border-black p-2 bg-white">
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrData ? (
                  <div ref={qrContainerRef} className="w-full h-full flex items-center justify-center p-4 bg-white" />
                ) : (
                  <div className="text-center p-8">
                    <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{t('fillFormPrompt')}</p>
                  </div>
                )}
              </div>
            </div>

            {qrData && (
              <div className="space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={14} /> {t('download')}
                </button>
                <button
                  onClick={copyToClipboard}
                  className="w-full border-2 border-black py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <><Check size={14} /> {t('copied')}</> : <><Copy size={14} /> {t('copyData')}</>}
                </button>
                <button onClick={resetAll} className="w-full py-2 text-[10px] font-bold uppercase text-gray-400 hover:text-black transition-colors">
                  {t('clearAllFields')}
                </button>
              </div>
            )}

            <footer className="pt-8 text-center border-t border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">{t('footerText')}</p>
            </footer>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
