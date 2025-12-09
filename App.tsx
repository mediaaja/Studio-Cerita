
import React, { useState } from 'react';
import { Genre, StoryParams, StoryState, Character } from './types';
import { generateStoryText, generateStoryImage, generateStorySpeech } from './services/geminiService';
import { decodeAudioData } from './services/audioUtils';
import { StoryCard } from './components/StoryCard';
import { Button } from './components/Button';
import { Sparkles, Wand2, RefreshCw, PenTool, AlertCircle, Book, LayoutTemplate, Users, Trash2, Plus, Check, Split } from 'lucide-react';

const App: React.FC = () => {
  // Input State
  const [params, setParams] = useState<StoryParams>({
    mainTitle: '',
    chapterNumber: '1',
    chapterTitle: '',
    characters: [{
      id: '1',
      name: '',
      gender: 'Laki-laki',
      age: '',
      role: 'Utama',
      description: '',
      settingEnvironment: '',
      settingLocation: '',
      settingAtmosphere: '',
      settingVisuals: ''
    }],
    genre: [Genre.FANTASY],
    theme: '',
    language: 'id',
    parallelScene: ''
  });

  // App State
  const [state, setState] = useState<StoryState>({
    data: null,
    imageUrl: null,
    audioData: null,
    isLoading: false,
    loadingStep: 'idle',
    error: null
  });

  const handleInputChange = (field: keyof StoryParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (selectedGenre: string) => {
    setParams(prev => {
      const currentGenres = prev.genre;
      if (currentGenres.includes(selectedGenre)) {
        return { ...prev, genre: currentGenres.filter(g => g !== selectedGenre) };
      } else {
        return { ...prev, genre: [...currentGenres, selectedGenre] };
      }
    });
  };

  // Character Management Functions
  const addCharacter = () => {
    setParams(prev => ({
      ...prev,
      characters: [
        ...prev.characters,
        {
          id: Date.now().toString(),
          name: '',
          gender: 'Laki-laki',
          age: '',
          role: 'Pendukung',
          description: '',
          settingEnvironment: '',
          settingLocation: '',
          settingAtmosphere: '',
          settingVisuals: ''
        }
      ]
    }));
  };

  const removeCharacter = (id: string) => {
    if (params.characters.length <= 1) return;
    setParams(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setParams(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const fillExample = () => {
    const examples = [
      {
        mainTitle: 'Legenda Pendekar Naga',
        chapterNumber: '1',
        chapterTitle: 'Pertemuan di Gunung Kabut',
        characters: [
          { 
            id: 'ex1', name: 'Wei', gender: 'Laki-laki', age: '18', role: 'Utama', 
            description: 'Pendekar pedang muda yang mencari jati diri, memakai jubah biru usang.',
            settingEnvironment: 'Pegunungan Tinggi',
            settingLocation: 'Puncak Batu Naga',
            settingAtmosphere: 'Sunyi, dingin, berkabut tebal, suara elang dari kejauhan.',
            settingVisuals: 'Jurang terjal dengan pohon pinus tua yang tumbuh miring, kuil runtuh di latar belakang.'
          },
          { 
            id: 'ex2', name: 'Mei Lin', gender: 'Perempuan', age: '17', role: 'Pendukung', 
            description: 'Ahli obat-obatan dari lembah tersembunyi.',
            settingEnvironment: 'Hutan Bambu',
            settingLocation: 'Gubuk Herbal',
            settingAtmosphere: 'Tenang, aroma obat herbal yang kuat, suara gemericik air.',
            settingVisuals: 'Sinar matahari menembus daun bambu, sungai kecil mengalir jernih, rak-rak penuh botol obat.'
          }
        ] as Character[],
        genre: [Genre.ACTION, Genre.MARTIAL_ART, Genre.XIANXIA],
        theme: 'Kehormatan dan takdir',
        parallelScene: 'Di istana kekaisaran yang jauh, Jenderal Hitam sedang menerima laporan mata-mata tentang keberadaan pedang pusaka yang dibawa Wei.',
      },
      {
        mainTitle: 'Akademi Sihir Modern',
        chapterNumber: '1',
        chapterTitle: 'Surat Penerimaan',
        characters: [
            { 
              id: 'ex3', name: 'Aruna', gender: 'Perempuan', age: '16', role: 'Murid Baru', 
              description: 'Gadis biasa yang tiba-tiba membangkitkan kekuatan es.',
              settingEnvironment: 'Kota Neo-Jakarta',
              settingLocation: 'Kamar Tidur Apartemen',
              settingAtmosphere: 'Futuristik tapi berantakan, suara sirine mobil terbang samar-samar.',
              settingVisuals: 'Lampu neon dari jendela, hologram melayang, buku-buku berserakan di lantai.'
            }
        ] as Character[],
        genre: [Genre.FANTASY, Genre.SLICE_OF_LIFE, Genre.COMEDY],
        theme: 'Persahabatan masa sekolah',
        parallelScene: 'Di ruang kepala sekolah, para dewan penyihir sedang berdebat tentang ramalan kuno yang mulai menjadi kenyataan.',
      }
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setParams(prev => ({ ...prev, ...randomExample }));
  };

  const handleGenerate = async () => {
    const hasValidCharacter = params.characters.some(c => c.name.trim() !== '');
    if (!hasValidCharacter || !params.theme || params.genre.length === 0) {
      setState(prev => ({ ...prev, error: "Mohon lengkapi detail inti cerita (Minimal 1 Karakter, Tema, dan 1 Genre)." }));
      return;
    }

    setState({
      data: null,
      imageUrl: null,
      audioData: null,
      isLoading: true,
      loadingStep: 'writing',
      error: null
    });

    try {
      const story = await generateStoryText(params);
      setState(prev => ({ 
        ...prev, 
        data: story, 
        loadingStep: 'drawing' 
      }));

      const imageBase64 = await generateStoryImage(story, params);
      setState(prev => ({ 
        ...prev, 
        imageUrl: imageBase64,
        loadingStep: 'narrating'
      }));

      const audioBase64 = await generateStorySpeech(story.content, params.language);
      let audioBuffer: AudioBuffer | null = null;

      if (audioBase64) {
         const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
         audioBuffer = await decodeAudioData(audioBase64, ctx);
      }

      setState(prev => ({ 
        ...prev, 
        audioData: audioBuffer,
        isLoading: false, 
        loadingStep: 'idle'
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        loadingStep: 'idle',
        error: "Maaf, terjadi kesalahan saat membuat cerita. Silakan coba lagi."
      }));
    }
  };

  const resetApp = () => {
    setState({
      data: null,
      imageUrl: null,
      audioData: null,
      isLoading: false,
      loadingStep: 'idle',
      error: null
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-2 px-4 bg-slate-900/50 border border-slate-800 rounded-full shadow-lg mb-6 backdrop-blur-md">
            <Sparkles className="text-indigo-400 mr-2 w-4 h-4" />
            <span className="font-bold text-xs text-indigo-300 tracking-widest uppercase">
              Powered by Gemini 2.5
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
            Cerita<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Ajaib</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Platform kreasi cerita anak & novel futuristik. Hasilkan narasi, ilustrasi, dan audio profesional dalam sekejap.
          </p>
        </header>

        {/* Main Content Area */}
        <main>
          {state.error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-200 flex items-center shadow-lg backdrop-blur-sm">
              <AlertCircle className="mr-2 text-red-400" size={20} />
              {state.error}
            </div>
          )}

          {!state.data && !state.isLoading ? (
            /* Input Form Container */
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800/50 ring-1 ring-white/5">
              
              {/* Toolbar Section */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-slate-800/50">
                <button 
                  onClick={handleGenerate}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:from-fuchsia-500 hover:to-pink-500 transition-all shadow-lg shadow-fuchsia-900/30"
                >
                  <Sparkles size={18} />
                  Generate Plot & Story
                </button>

                <button 
                  onClick={fillExample}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-200 font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-all"
                >
                  <LayoutTemplate size={18} />
                  Isi Contoh
                </button>
              </div>

              {/* Section 1: Informasi Dasar */}
              <div className="mb-8 pb-8 border-b border-slate-800/50">
                <div className="flex items-center gap-2 mb-6">
                  <Book className="text-indigo-400" size={20} />
                  <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Informasi Dasar</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="md:col-span-4 space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Cerita Utama</label>
                      <input
                        type="text"
                        placeholder="Contoh: Sang Penakluk Naga"
                        className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-300"
                        value={params.mainTitle}
                        onChange={(e) => handleInputChange('mainTitle', e.target.value)}
                      />
                   </div>

                   <div className="md:col-span-1 space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">No. Chapter</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-300"
                        value={params.chapterNumber}
                        onChange={(e) => handleInputChange('chapterNumber', e.target.value)}
                      />
                   </div>

                   <div className="md:col-span-3 space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Chapter</label>
                      <input
                        type="text"
                        placeholder="Judul bab ini..."
                        className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-300"
                        value={params.chapterTitle}
                        onChange={(e) => handleInputChange('chapterTitle', e.target.value)}
                      />
                   </div>
                </div>
              </div>

              {/* Section 2: Karakter */}
              <div className="mb-8 pb-8 border-b border-slate-800/50">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="text-indigo-400" size={20} />
                  <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Karakter</h3>
                </div>

                <div className="space-y-6">
                  {params.characters.map((char, index) => (
                    <div key={char.id} className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-indigo-400 font-bold text-lg">#{index + 1}</span>
                        {params.characters.length > 1 && (
                          <button 
                            onClick={() => removeCharacter(char.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      {/* Character Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama</label>
                           <input 
                              type="text" 
                              value={char.name}
                              onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                              className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none"
                              placeholder="Nama Karakter"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                           <select 
                              value={char.gender}
                              onChange={(e) => updateCharacter(char.id, 'gender', e.target.value as any)}
                              className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none appearance-none"
                           >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                           </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Usia</label>
                           <input 
                              type="text" 
                              value={char.age}
                              onChange={(e) => updateCharacter(char.id, 'age', e.target.value)}
                              className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none"
                              placeholder="Contoh: 10 Tahun"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Peran</label>
                           <input 
                              type="text" 
                              value={char.role}
                              onChange={(e) => updateCharacter(char.id, 'role', e.target.value)}
                              className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none"
                              placeholder="Contoh: Pendukung, Protagonis"
                           />
                        </div>
                      </div>

                      <div className="space-y-2 mb-8">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Deskripsi Fisik & Sifat</label>
                          <textarea 
                             value={char.description}
                             onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                             className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none h-20 resize-none"
                             placeholder="Rambut perak, mata tajam, sifat periang..."
                          />
                      </div>

                      {/* Character Setting/Environment Section - Divider */}
                      <div className="border-t border-slate-700/50 my-6"></div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Block 1: Lingkungan */}
                        <div className="space-y-4">
                           <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">LINGKUNGAN</label>
                           <div className="space-y-4">
                              <input 
                                  type="text" 
                                  value={char.settingEnvironment}
                                  onChange={(e) => updateCharacter(char.id, 'settingEnvironment', e.target.value)}
                                  className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none"
                                  placeholder="Misal: Hutan Hujan"
                              />
                              <textarea 
                                  value={char.settingAtmosphere}
                                  onChange={(e) => updateCharacter(char.id, 'settingAtmosphere', e.target.value)}
                                  className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 text-sm focus:border-indigo-500 outline-none h-20 resize-none"
                                  placeholder="Deskripsi detail suasana..."
                              />
                           </div>
                        </div>

                        {/* Block 2: Lokasi Spesifik */}
                        <div className="space-y-4">
                           <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">LOKASI SPESIFIK</label>
                           <div className="space-y-4">
                              <input 
                                  type="text" 
                                  value={char.settingLocation}
                                  onChange={(e) => updateCharacter(char.id, 'settingLocation', e.target.value)}
                                  className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 outline-none"
                                  placeholder="Default (Otomatis)"
                              />
                              <textarea 
                                  value={char.settingVisuals}
                                  onChange={(e) => updateCharacter(char.id, 'settingVisuals', e.target.value)}
                                  className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 text-sm focus:border-indigo-500 outline-none h-20 resize-none"
                                  placeholder="Detail geografis & visual..."
                              />
                           </div>
                        </div>

                      </div>

                    </div>
                  ))}

                  <button 
                    onClick={addCharacter}
                    className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <Plus size={20} />
                    + Tambah Karakter
                  </button>
                </div>
              </div>

              {/* Section 3: Detail Cerita */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <PenTool className="text-indigo-400" size={20} />
                  <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Detail Lainnya</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Adegan Paralel / Kejadian di Tempat Lain */}
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Split size={14} />
                        <label className="text-xs font-bold uppercase tracking-widest">Adegan Paralel / Kejadian di Tempat Lain (Opsional)</label>
                    </div>
                    <textarea
                      placeholder="Jelaskan peristiwa yang terjadi bersamaan di lokasi berbeda. Misal: Keluarga di rumah yang khawatir, atau musuh yang sedang menyusun rencana di markas..."
                      className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-300 h-24 resize-none"
                      value={params.parallelScene}
                      onChange={(e) => handleInputChange('parallelScene', e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tema Cerita</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tentang persahabatan, balas dendam, kultivasi abadi"
                      className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-300"
                      value={params.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-3">
                      Genre (Checklist - Bisa pilih lebih dari satu)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {Object.values(Genre).map((g) => {
                        const isSelected = params.genre.includes(g);
                        return (
                          <button
                            key={g}
                            onClick={() => toggleGenre(g)}
                            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border flex items-center gap-2 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                            }`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={handleGenerate} className="text-lg px-10 py-4 shadow-xl shadow-indigo-900/20 w-full md:w-auto">
                  <Wand2 className="mr-2" size={24} />
                  Buat Cerita Ajaib
                </Button>
              </div>
            </div>
          ) : null}

          {/* Loading State */}
          {state.isLoading && (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-slate-800/50 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-slate-800/50 text-indigo-400 rounded-full mx-auto flex items-center justify-center mb-8 border border-slate-700">
                  <PenTool className={`w-10 h-10 ${state.loadingStep === 'writing' ? 'animate-bounce' : ''}`} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  {state.loadingStep === 'writing' && 'Merangkai Kata...'}
                  {state.loadingStep === 'drawing' && 'Melukis Imajinasi...'}
                  {state.loadingStep === 'narrating' && 'Merekam Suara...'}
                </h2>
                <p className="text-slate-400">AI sedang bekerja mewujudkan ide Anda.</p>
                
                <div className="mt-10 w-full max-w-md mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ 
                      width: state.loadingStep === 'writing' ? '30%' : 
                            state.loadingStep === 'drawing' ? '66%' : '90%' 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {state.data && !state.isLoading && (
            <div className="space-y-8 animate-fade-in-up">
               <div className="flex justify-end">
                <Button onClick={resetApp} variant="outline" className="text-sm backdrop-blur-sm">
                  <RefreshCw size={16} className="mr-2" />
                  Buat Cerita Baru
                </Button>
              </div>
              
              <StoryCard 
                story={state.data} 
                imageUrl={state.imageUrl} 
                audioBuffer={state.audioData}
              />
            </div>
          )}
        </main>

        <footer className="mt-20 pb-8 text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} CeritaAjaib. Built with Gemini API.
        </footer>
      </div>
    </div>
  );
};

export default App;
