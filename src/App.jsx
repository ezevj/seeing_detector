import React, { useState, useEffect, useRef } from 'react';
import { Eye, Wind, Cloud, Droplets, Info, Star, ArrowUp, Moon, Sun, Search, MapPin, AlertTriangle, Flame, Activity, BarChart3, HelpCircle } from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-black/20 ${className}`}>
    {children}
  </div>
);

const NavButton = ({ onClick, active, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
      active
        ? 'text-cyan-400 scale-110'
        : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-cyan-500/10' : 'bg-transparent'}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-cyan-500/20' : ''}`} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[10px] font-medium mt-1 ${active ? 'opacity-100' : 'opacity-70'}`}>
      {label}
    </span>
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('simulate'); 
  const [seeingValue, setSeeingValue] = useState(5);
  const [aperture, setAperture] = useState(130); 
  const [weather, setWeather] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [errorWeather, setErrorWeather] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // --- Logic: Fetch Clima + Calidad de Aire ---
  const fetchWeatherAndAir = async (lat, lon, name = null) => {
    setLoadingWeather(true);
    setErrorWeather(null);
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,is_day&daily=sunrise,sunset&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData);

      const airRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,aerosol_optical_depth,dust&timezone=auto`
      );
      const airData = await airRes.json();
      setAirQuality(airData);

      if (name) setLocationName(name);
      else setLocationName(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`);

    } catch (err) {
      setErrorWeather("Error conectando con satélites.");
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!citySearch.trim()) return;
    setIsSearchingCity(true);
    setErrorWeather(null);
    setWeather(null);
    setAirQuality(null);
    try {
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearch)}&count=1&language=es&format=json`
        );
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            setErrorWeather("Ciudad no encontrada.");
            setIsSearchingCity(false);
            return;
        }
        const { latitude, longitude, name, country } = geoData.results[0];
        const fullName = `${name}, ${country}`;
        await fetchWeatherAndAir(latitude, longitude, fullName);
    } catch (err) {
        setErrorWeather("Error al buscar.");
    } finally {
        setIsSearchingCity(false);
    }
  };

  useEffect(() => {
    if (!weather && !errorWeather) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeatherAndAir(position.coords.latitude, position.coords.longitude, "Tu Ubicación");
          },
          () => {
            fetchWeatherAndAir(-41.1335, -71.3103, "Bariloche (Default)");
          }
        );
      } else {
         fetchWeatherAndAir(-41.1335, -71.3103, "Bariloche (Default)");
      }
    }
  }, []);

  // --- Animation Logic ---
  useEffect(() => {
    if (activeTab !== 'simulate') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
      ctx.fillStyle = '#020617'; 
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
      ctx.fill();

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const stability = seeingValue; 
      const turbulence = (11 - stability) * 1.5; 

      const layers = 6;
      for (let i = 0; i < layers; i++) {
        ctx.beginPath();
        let radius = (i + 1) * 8;
        if (i === 0) radius = 6; 
        const distortionX = Math.sin(time + i) * turbulence * (Math.random() * 0.5 + 0.5);
        const distortionY = Math.cos(time * 0.8 + i) * turbulence * (Math.random() * 0.5 + 0.5);
        let alpha = i === 0 ? 1 : 0.4 - (i * 0.05);
        if (stability < 5 && i > 0) {
           alpha *= 0.5; 
           radius += Math.random() * turbulence;
        }
        ctx.arc(centerX + distortionX, centerY + distortionY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        if (stability < 7) ctx.filter = `blur(${(11 - stability) * 0.5}px)`;
        else ctx.filter = 'none';
        ctx.fill();
        ctx.filter = 'none'; 
      }
      if (stability < 4) {
          for(let k=0; k<10; k++) {
              ctx.beginPath();
              const randX = (Math.random() - 0.5) * turbulence * 4;
              const randY = (Math.random() - 0.5) * turbulence * 4;
              ctx.arc(centerX + randX, centerY + randY, 2, 0, 2 * Math.PI);
              ctx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.5})`;
              ctx.fill();
          }
      }
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [activeTab, seeingValue]);

  // Helpers
  const getPickeringDesc = (val) => {
    if (val >= 9) return "Perfecto (10)";
    if (val >= 7) return "Muy Bueno (7-9)";
    if (val >= 5) return "Regular (5-6)";
    if (val >= 3) return "Malo (3-4)";
    return "Pésimo (1-2)";
  };

  const calculateMaxMag = () => {
    let multiplier = 1;
    if (seeingValue <= 3) multiplier = 0.8;
    else if (seeingValue <= 6) multiplier = 1.2;
    else if (seeingValue <= 8) multiplier = 1.6;
    else multiplier = 2.0;
    return Math.floor(aperture * multiplier);
  };

  // --- NUEVA LÓGICA DE PUNTAJE CON DESGLOSE ---
  const calculateSkyScore = () => {
      if (!weather || !airQuality) return { score: 0, verdict: "Calculando...", penalties: [] };

      let score = 100;
      const wind = weather.current.wind_speed_10m;
      const clouds = weather.current.cloud_cover;
      const pm25 = airQuality.current.pm2_5;
      const humidity = weather.current.relative_humidity_2m;
      
      let penalties = [];

      // Penalizaciones Detalladas
      if (wind > 5) {
          const p = Math.floor((wind - 5) * 1.5);
          score -= p;
          penalties.push({ name: "Viento", loss: p, icon: Wind });
      }
      
      if (clouds > 0) {
          const p = Math.floor(clouds * 1.5);
          score -= p;
          penalties.push({ name: "Nubes", loss: p, icon: Cloud });
      }
      
      if (pm25 > 5) { // Un poco de humo ya resta algo
          const p = Math.floor(pm25 * 4);
          score -= p;
          penalties.push({ name: "Humo", loss: p, icon: Flame });
      }

      if (humidity > 85) {
          const p = Math.floor((humidity - 85) * 1);
          score -= p;
          penalties.push({ name: "Humedad", loss: p, icon: Droplets });
      }

      // Clamp score
      score = Math.max(0, Math.min(100, Math.floor(score)));

      let verdict = "";
      let color = "";
      if (score >= 90) { verdict = "Cielo Legendario"; color = "text-purple-400"; }
      else if (score >= 75) { verdict = "Excelente"; color = "text-emerald-400"; }
      else if (score >= 60) { verdict = "Bueno"; color = "text-cyan-400"; }
      else if (score >= 40) { verdict = "Regular"; color = "text-yellow-400"; }
      else if (score >= 20) { verdict = "Malo"; color = "text-orange-400"; }
      else { verdict = "Pésimo / Inusable"; color = "text-red-500"; }

      return { score, verdict, color, penalties };
  };

  const generateAlerts = () => {
    if (!weather || !airQuality) return [];
    
    const alerts = [];
    const wind = weather.current.wind_speed_10m;
    const clouds = weather.current.cloud_cover;
    const pm25 = airQuality.current.pm2_5;
    
    // 1. Alerta de HUMO (Ajustada para ser más sensible)
    if (pm25 > 25) {
        alerts.push({
            type: 'danger',
            title: 'Humo Denso / Polvo',
            desc: `PM2.5: ${pm25}μg/m³. Transparencia crítica. La luz de las estrellas se dispersará mucho.`,
            icon: Flame
        });
    } else if (pm25 > 10) { 
        alerts.push({
            type: 'warning',
            title: 'Transparencia Reducida',
            desc: `PM2.5: ${pm25}μg/m³. Hay humo o bruma ligera. Evita espacio profundo (nebulosas).`,
            icon: Activity
        });
    }

    // 2. Alerta de VIENTO
    if (wind > 30) {
        alerts.push({
            type: 'danger',
            title: 'Viento Fuerte',
            desc: `Ráfagas de ${wind}km/h. Vibración severa en el equipo.`,
            icon: Wind
        });
    }

    // 3. Alerta de NUBES
    if (clouds > 50) {
        alerts.push({
            type: 'danger',
            title: 'Nubosidad Alta',
            desc: `Cobertura del ${clouds}%. Pocos huecos visibles.`,
            icon: Cloud
        });
    }

    return alerts;
  };

  const skyStats = calculateSkyScore();
  const alertsList = generateAlerts();

  return (
    <div className="min-h-screen font-sans text-slate-200 selection:bg-cyan-500/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 bg-slate-950 -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-10" />
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-500/5 to-transparent -z-10" />

      {/* Main Container */}
      <div className="max-w-md mx-auto p-4 pb-32">
        
        {/* Header Compacto */}
        <header className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                <Star className="w-6 h-6 text-cyan-400 fill-cyan-400 animate-pulse-slow" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                AstroSeeing
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">V 2.2 • Desglose Detallado</p>
            </div>
          </div>
        </header>

        {/* --- TABS CONTENT --- */}
        
        {/* SIMULATE TAB */}
        {activeTab === 'simulate' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="text-center relative overflow-hidden border-indigo-500/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Simulador Pickering</h2>
              <div className="mx-auto w-64 h-64 relative rounded-full border-4 border-slate-800 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)] bg-slate-950">
                 <canvas ref={canvasRef} width={256} height={256} className="w-full h-full rounded-full opacity-90" />
                 <div className="absolute inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-1/2 left-4 right-4 h-px bg-cyan-500/50"></div>
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-cyan-500/50"></div>
                 </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-bold text-slate-500">Malo</span>
                    <div className="text-center">
                        <span className="block text-4xl font-bold text-cyan-400 tabular-nums leading-none tracking-tighter">{seeingValue}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">Excelente</span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  value={seeingValue}
                  onChange={(e) => setSeeingValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-colors"
                />
                <p className="text-sm text-slate-300 font-medium bg-slate-800/50 py-2 rounded-lg border border-slate-700/50">
                  {getPickeringDesc(seeingValue)}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Calculadora de Aumentos</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Apertura (mm)</label>
                    <input 
                        type="number" 
                        value={aperture} 
                        onChange={(e) => setAperture(Number(e.target.value))}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                </div>
                <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Máx. Zoom</span>
                    <span className="text-xl font-bold text-cyan-400">{calculateMaxMag()}x</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* WEATHER TAB */}
        {activeTab === 'weather' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
             
             {/* Search */}
             <form onSubmit={handleCitySearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar ciudad..." 
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-lg"
                />
                <button type="submit" disabled={isSearchingCity} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isSearchingCity ? <div className="animate-spin w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"/> : <div className="bg-slate-800 p-1 rounded-md"><ArrowUp className="w-3 h-3 rotate-90 text-slate-400"/></div>}
                </button>
             </form>

             {loadingWeather && <div className="text-center py-10 text-cyan-400 animate-pulse text-sm font-medium">Escaneando atmósfera...</div>}
             {errorWeather && <div className="text-center py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">{errorWeather}</div>}

             {weather && !loadingWeather && (
                <>
                <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase tracking-wide">{locationName}</span>
                            </div>
                            <div className="text-4xl font-bold text-white tracking-tighter">
                                {weather.current.temperature_2m}°
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-1">
                                {weather.current.is_day ? "Día" : "Noche"} • Humedad {weather.current.relative_humidity_2m}%
                            </div>
                        </div>
                        {weather.current.is_day ? <Sun className="w-12 h-12 text-amber-400" /> : <Moon className="w-12 h-12 text-cyan-200" />}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-1">
                            <Wind className={`w-5 h-5 ${weather.current.wind_speed_10m > 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Viento</span>
                            <span className="text-sm font-bold text-slate-200">{weather.current.wind_speed_10m} <span className="text-[10px] font-normal text-slate-500">km/h</span></span>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-1">
                            <Cloud className={`w-5 h-5 ${weather.current.cloud_cover > 20 ? 'text-amber-400' : 'text-emerald-400'}`} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Nubes</span>
                            <span className="text-sm font-bold text-slate-200">{weather.current.cloud_cover}<span className="text-[10px] font-normal text-slate-500">%</span></span>
                        </div>
                    </div>
                </Card>
                
                {airQuality && (
                   <Card className="flex items-center justify-between border-slate-700/50">
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${airQuality.current.pm2_5 > 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                               <Flame className="w-5 h-5" />
                           </div>
                           <div>
                               <h4 className="text-xs font-bold uppercase text-slate-400">Partículas (Humo)</h4>
                               <p className="text-lg font-bold">
                                   PM2.5: {airQuality.current.pm2_5} 
                                   <span className="text-[10px] text-slate-500 font-normal ml-1">μg/m³</span>
                               </p>
                           </div>
                       </div>
                       <div className={`text-xs px-2 py-1 rounded font-bold ${airQuality.current.pm2_5 > 10 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                           {airQuality.current.pm2_5 > 10 ? 'PRESENTE' : 'BAJO'}
                       </div>
                   </Card>
                )}
                </>
             )}
          </div>
        )}

        {/* ALERTAS TAB (CON DESGLOSE) */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
             
             {/* SCORE PANEL */}
             <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden text-center shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BarChart3 className="w-24 h-24" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Puntaje Astronómico</h2>
                
                <div className="flex items-center justify-center gap-1 mb-2">
                    <span className={`text-6xl font-black tracking-tighter ${skyStats.color}`}>
                        {skyStats.score}
                    </span>
                    <span className="text-xl text-slate-500 font-bold self-end mb-2">/100</span>
                </div>
                
                <div className={`inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sm font-bold ${skyStats.color} mb-4`}>
                    {skyStats.verdict}
                </div>

                {/* NUEVO: DESGLOSE DE PUNTOS PERDIDOS */}
                {skyStats.penalties.length > 0 && (
                    <div className="mt-2 bg-slate-950/50 rounded-lg p-3 text-left">
                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 text-center">¿Por qué bajó mi nota?</p>
                        <div className="space-y-1">
                            {skyStats.penalties.map((p, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                        <p.icon className="w-3 h-3 text-red-400" />
                                        <span>{p.name}</span>
                                    </div>
                                    <span className="font-mono text-red-400 font-bold">-{p.loss} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                 <Activity className="w-5 h-5 text-cyan-400" />
                 <h2 className="text-lg font-bold text-slate-200">Factores de Riesgo</h2>
             </div>

             {alertsList.length > 0 ? (
                 alertsList.map((alert, idx) => (
                    <Card key={idx} className={`border-l-4 ${
                        alert.type === 'danger' ? 'border-l-red-500 bg-red-900/10' : 
                        alert.type === 'warning' ? 'border-l-amber-500 bg-amber-900/10' : 
                        'border-l-emerald-500 bg-emerald-900/10'
                    }`}>
                        <div className="flex gap-3">
                            <alert.icon className={`w-6 h-6 shrink-0 mt-1 ${
                                alert.type === 'danger' ? 'text-red-400' : 
                                alert.type === 'warning' ? 'text-amber-400' : 
                                'text-emerald-400'
                            }`} />
                            <div>
                                <h3 className={`font-bold ${
                                    alert.type === 'danger' ? 'text-red-300' : 
                                    alert.type === 'warning' ? 'text-amber-300' : 
                                    'text-emerald-300'
                                }`}>{alert.title}</h3>
                                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                                    {alert.desc}
                                </p>
                            </div>
                        </div>
                    </Card>
                 ))
             ) : (
                <Card className="border-l-4 border-l-emerald-500 bg-emerald-900/10">
                    <div className="flex gap-3">
                        <Star className="w-6 h-6 shrink-0 mt-1 text-emerald-400" />
                        <div>
                            <h3 className="font-bold text-emerald-300">Sin Alertas Activas</h3>
                            <p className="text-sm text-slate-300 mt-1">
                                No se detectan factores negativos graves (ni viento fuerte, ni humo denso, ni nubes totales).
                            </p>
                        </div>
                    </div>
                </Card>
             )}
          </div>
        )}

        {/* INFO TAB (RECUPERADA) */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card>
               <h2 className="text-lg font-bold text-cyan-400 mb-2">¿Cómo interpreto el puntaje?</h2>
               <div className="space-y-3">
                 <div className="flex gap-3">
                    <div className="font-black text-purple-400 w-12 text-right">90+</div>
                    <div className="text-xs text-slate-300">Noches legendarias. Saca el equipo grande.</div>
                 </div>
                 <div className="flex gap-3">
                    <div className="font-black text-emerald-400 w-12 text-right">75+</div>
                    <div className="text-xs text-slate-300">Muy buena noche. Transparencia y estabilidad altas.</div>
                 </div>
                 <div className="flex gap-3">
                    <div className="font-black text-yellow-400 w-12 text-right">40+</div>
                    <div className="text-xs text-slate-300">Condiciones mixtas. Quizás sirva para cúmulos o Luna.</div>
                 </div>
                 <div className="flex gap-3">
                    <div className="font-black text-red-400 w-12 text-right">&lt;40</div>
                    <div className="text-xs text-slate-300">Mejor quedarse adentro. Lluvia, humo denso o viento.</div>
                 </div>
               </div>
            </Card>
            
            <Card className="flex gap-3 items-start bg-blue-900/10 border-blue-500/20">
                <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                <div>
                   <h3 className="text-sm font-bold text-blue-300 mb-1">¿Por qué "Pésimo" si el Humo es "Bajo"?</h3>
                   <p className="text-xs text-slate-300 leading-relaxed">
                     El puntaje mira TODO. Si hay mucho viento ({'>'}20km/h) o nubes, el puntaje será malo aunque el aire esté limpio. Revisa la sección "¿Por qué bajó mi nota?" en la pestaña de Alertas.
                   </p>
                </div>
            </Card>

            <Card>
               <h2 className="text-lg font-bold text-cyan-400 mb-2">Sobre el Humo</h2>
               <p className="text-sm text-slate-400 leading-relaxed">
                 Si ves el cielo "lechoso" o grisáceo de día, hay humo aunque el satélite diga que es poco. La app ahora te avisará si el PM2.5 pasa de 10, lo cual ya degrada la visión de galaxias.
               </p>
            </Card>
          </div>
        )}

      </div>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black z-50 h-16 flex items-center justify-around px-2 max-w-md mx-auto">
          <NavButton 
            active={activeTab === 'simulate'} 
            onClick={() => setActiveTab('simulate')} 
            icon={Eye} 
            label="Medir" 
          />
          <NavButton 
            active={activeTab === 'weather'} 
            onClick={() => setActiveTab('weather')} 
            icon={Cloud} 
            label="Clima" 
          />
          <NavButton 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')} 
            icon={AlertTriangle} 
            label="Alertas" 
          />
          <NavButton 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')} 
            icon={Info} 
            label="Guía" 
          />
      </div>

    </div>
  );
}
