import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Wind,
  Cloud,
  Droplets,
  Info,
  Star,
  ArrowUp,
  Moon,
  Sun,
  Search,
  MapPin,
  Telescope,
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-black/20 ${className}`}
  >
    {children}
  </div>
);

// Botón de navegación optimizado para móviles
const NavButton = ({ onClick, active, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
      active ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div
      className={`p-1.5 rounded-full transition-all ${
        active ? 'bg-cyan-500/10' : 'bg-transparent'
      }`}
    >
      <Icon
        className={`w-6 h-6 ${active ? 'fill-cyan-500/20' : ''}`}
        strokeWidth={active ? 2.5 : 2}
      />
    </div>
    <span
      className={`text-[10px] font-medium mt-1 ${
        active ? 'opacity-100' : 'opacity-70'
      }`}
    >
      {label}
    </span>
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('simulate');
  const [seeingValue, setSeeingValue] = useState(5);
  const [aperture, setAperture] = useState(130);
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [errorWeather, setErrorWeather] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // --- Weather Logic ---
  const fetchWeather = async (lat, lon, name = null) => {
    setLoadingWeather(true);
    setErrorWeather(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,is_day&timezone=auto`
      );
      const data = await response.json();
      setWeather(data);
      if (name) setLocationName(name);
      else setLocationName(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`);
    } catch (err) {
      setErrorWeather('Error de conexión.');
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
    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          citySearch
        )}&count=1&language=es&format=json`
      );
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        setErrorWeather('Ciudad no encontrada.');
        setIsSearchingCity(false);
        return;
      }
      const { latitude, longitude, name, country } = geoData.results[0];
      const fullName = `${name}, ${country}`;
      await fetchWeather(latitude, longitude, fullName);
    } catch (err) {
      setErrorWeather('Error al buscar.');
    } finally {
      setIsSearchingCity(false);
    }
  };

  useEffect(() => {
    // Si no tenemos clima cargado aún...
    if (!weather && !errorWeather) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(
              position.coords.latitude,
              position.coords.longitude,
              'Tu Ubicación'
            );
          },
          () => {
            // FALLBACK: Si falla el GPS o se deniega, carga Bariloche por defecto.
            console.log('GPS denegado, cargando Bariloche por defecto.');
            fetchWeather(-41.1335, -71.3103, 'Bariloche (Default)');
          }
        );
      } else {
        // Si no soporta GPS, carga Bariloche
        fetchWeather(-41.1335, -71.3103, 'Bariloche (Default)');
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
      // Background Match
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Transparent background so card shows through, or dark circle
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2
      );
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
        const distortionX =
          Math.sin(time + i) * turbulence * (Math.random() * 0.5 + 0.5);
        const distortionY =
          Math.cos(time * 0.8 + i) * turbulence * (Math.random() * 0.5 + 0.5);
        let alpha = i === 0 ? 1 : 0.4 - i * 0.05;
        if (stability < 5 && i > 0) {
          alpha *= 0.5;
          radius += Math.random() * turbulence;
        }
        ctx.arc(
          centerX + distortionX,
          centerY + distortionY,
          radius,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        if (stability < 7) ctx.filter = `blur(${(11 - stability) * 0.5}px)`;
        else ctx.filter = 'none';
        ctx.fill();
        ctx.filter = 'none';
      }
      if (stability < 4) {
        for (let k = 0; k < 10; k++) {
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
    if (val >= 9) return 'Perfecto (10)';
    if (val >= 7) return 'Muy Bueno (7-9)';
    if (val >= 5) return 'Regular (5-6)';
    if (val >= 3) return 'Malo (3-4)';
    return 'Pésimo (1-2)';
  };

  const calculateMaxMag = () => {
    let multiplier = 1;
    if (seeingValue <= 3) multiplier = 0.8;
    else if (seeingValue <= 6) multiplier = 1.2;
    else if (seeingValue <= 8) multiplier = 1.6;
    else multiplier = 2.0;
    return Math.floor(aperture * multiplier);
  };

  const getSeeingForecast = () => {
    if (!weather)
      return { status: '--', color: 'text-slate-500', desc: 'Sin datos' };
    const wind = weather.current.wind_speed_10m;
    if (wind < 10)
      return {
        status: 'Excelente',
        color: 'text-emerald-400',
        desc: 'Atmósfera estable',
      };
    if (wind < 20)
      return {
        status: 'Bueno',
        color: 'text-cyan-400',
        desc: 'Poca turbulencia',
      };
    if (wind < 35)
      return {
        status: 'Regular',
        color: 'text-yellow-400',
        desc: 'Viento moderado',
      };
    return { status: 'Malo', color: 'text-red-400', desc: 'Mucha turbulencia' };
  };

  const getRecommendations = () => {
    const s = seeingValue;
    if (s >= 7)
      return [
        {
          title: 'Planetas',
          desc: 'Detalles finos en Júpiter/Saturno.',
          icon: '🪐',
        },
        { title: 'Dobles', desc: 'Separación nítida de pares.', icon: '✨' },
      ];
    else if (s >= 4)
      return [
        {
          title: 'Cúmulos',
          desc: 'Estrellas puntuales y brillantes.',
          icon: '✨',
        },
        { title: 'Luna', desc: 'Cráteres principales visibles.', icon: '🌑' },
      ];
    else
      return [
        { title: 'Vía Láctea', desc: 'Observación de gran campo.', icon: '🌌' },
        {
          title: 'Espacio Profundo',
          desc: 'Objetos difusos grandes.',
          icon: '🔭',
        },
      ];
  };

  const forecast = getSeeingForecast();
  const targets = getRecommendations();

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
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Asistente de Observación
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded">
            v1.3
          </div>
        </header>

        {/* --- TABS CONTENT --- */}

        {/* SIMULATE TAB */}
        {activeTab === 'simulate' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="text-center relative overflow-hidden border-indigo-500/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">
                Simulador Pickering
              </h2>

              {/* Canvas Container */}
              <div className="mx-auto w-64 h-64 relative rounded-full border-4 border-slate-800 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)] bg-slate-950">
                <canvas
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="w-full h-full rounded-full opacity-90"
                />
                {/* Crosshair */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute top-1/2 left-4 right-4 h-px bg-cyan-500/50"></div>
                  <div className="absolute left-1/2 top-4 bottom-4 w-px bg-cyan-500/50"></div>
                </div>
              </div>

              {/* Slider Control */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end px-1">
                  <span className="text-xs font-bold text-slate-500">Malo</span>
                  <div className="text-center">
                    <span className="block text-4xl font-bold text-cyan-400 tabular-nums leading-none tracking-tighter">
                      {seeingValue}
                    </span>
                    <span className="text-[10px] text-cyan-200/70 font-medium tracking-widest uppercase">
                      Escala 1-10
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Excelente
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
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
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                  Calculadora de Aumentos
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Apertura (mm)
                  </label>
                  <input
                    type="number"
                    value={aperture}
                    onChange={(e) => setAperture(Number(e.target.value))}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
                <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Máx. Zoom
                  </span>
                  <span className="text-xl font-bold text-cyan-400">
                    {calculateMaxMag()}x
                  </span>
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
              <button
                type="submit"
                disabled={isSearchingCity}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {isSearchingCity ? (
                  <div className="animate-spin w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
                ) : (
                  <div className="bg-slate-800 p-1 rounded-md">
                    <ArrowUp className="w-3 h-3 rotate-90 text-slate-400" />
                  </div>
                )}
              </button>
            </form>

            {loadingWeather && (
              <div className="text-center py-10 text-cyan-400 animate-pulse text-sm font-medium">
                Conectando con satélites...
              </div>
            )}
            {errorWeather && (
              <div className="text-center py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                {errorWeather}
              </div>
            )}

            {weather && !loadingWeather && (
              <>
                {/* Main Weather Card */}
                <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          {locationName}
                        </span>
                      </div>
                      <div className="text-4xl font-bold text-white tracking-tighter">
                        {weather.current.temperature_2m}°
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-1">
                        {weather.current.is_day ? 'Día' : 'Noche'} • Humedad{' '}
                        {weather.current.relative_humidity_2m}%
                      </div>
                    </div>
                    {weather.current.is_day ? (
                      <Sun className="w-12 h-12 text-amber-400" />
                    ) : (
                      <Moon className="w-12 h-12 text-cyan-200" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-1">
                      <Wind
                        className={`w-5 h-5 ${
                          weather.current.wind_speed_10m > 20
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Viento
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {weather.current.wind_speed_10m}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          km/h
                        </span>
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-1">
                      <Cloud
                        className={`w-5 h-5 ${
                          weather.current.cloud_cover > 20
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Nubes
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {weather.current.cloud_cover}
                        <span className="text-[10px] font-normal text-slate-500">
                          %
                        </span>
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-3">
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      weather.current.wind_speed_10m > 20
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    <Wind
                      className={`w-5 h-5 ${
                        weather.current.wind_speed_10m > 20
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    />
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          weather.current.wind_speed_10m > 20
                            ? 'text-red-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        Estabilidad Atmosférica
                      </h4>
                      <p className="text-xs text-slate-400 opacity-80 leading-tight mt-0.5">
                        {weather.current.wind_speed_10m > 20
                          ? 'Alta turbulencia esperada. Mal seeing.'
                          : 'Viento en calma. Probable buen seeing.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TARGETS TAB */}
        {activeTab === 'targets' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900/40 rounded-2xl p-5 border border-slate-700/50 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl"></div>
              <h2 className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider mb-2">
                Predicción de Hoy
              </h2>
              <div className="flex items-end gap-2">
                <span
                  className={`text-3xl font-bold tracking-tight ${forecast.color}`}
                >
                  {forecast.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{forecast.desc}</p>
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mt-6 mb-2">
              Recomendados
            </h3>

            <div className="grid gap-3">
              {targets.map((target, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="text-2xl bg-slate-800 w-12 h-12 flex items-center justify-center rounded-full shadow-inner shadow-black/40">
                    {target.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{target.title}</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      {target.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="mt-4 bg-indigo-600/10 border-indigo-500/20">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300 block mb-1">
                    Dato Curioso
                  </strong>
                  Los planetas no titilan porque tienen un disco aparente, a
                  diferencia de las estrellas que son puntos de luz. Si ves un
                  astro brillante que no parpadea, ¡probablemente sea Júpiter!
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card>
              <h2 className="text-lg font-bold text-cyan-400 mb-2">
                ¿Qué es el Seeing?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Es la medida de la turbulencia atmosférica. Imagina mirar una
                moneda en el fondo de una piscina: si el agua se mueve mucho, la
                moneda se ve deformada (mal seeing). Si el agua está quieta, se
                ve perfecta (buen seeing).
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="font-mono font-bold text-red-400 text-lg w-8 text-center">
                    1-3
                  </div>
                  <div className="text-xs text-slate-400">
                    Pésimo. Estrellas parecen manchas hirviendo.
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <div className="font-mono font-bold text-yellow-400 text-lg w-8 text-center">
                    4-6
                  </div>
                  <div className="text-xs text-slate-400">
                    Regular. Imagen vibra, detalles fugaces.
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="font-mono font-bold text-emerald-400 text-lg w-8 text-center">
                    7+
                  </div>
                  <div className="text-xs text-slate-400">
                    Excelente. Imagen quieta y nítida.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* --- BOTTOM NAVIGATION BAR (Mobile Optimized) --- */}
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
          active={activeTab === 'targets'}
          onClick={() => setActiveTab('targets')}
          icon={Telescope}
          label="Objetos"
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
