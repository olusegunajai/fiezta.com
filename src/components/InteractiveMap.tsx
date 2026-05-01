import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  ChevronRight, 
  Navigation2, 
  Map as MapIcon, 
  Layers, 
  Compass,
  ArrowUpRight,
  Info,
  Package,
  Calendar,
  X
} from 'lucide-react';
import { TravelPackage } from '../types';
import { cn } from '../lib/utils';

// Fix for Leaflet default icon issues in React
const markerIcon2x = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const markerIcon = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const markerShadow = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DestinationMapProps {
  packages: TravelPackage[];
  onSelectPackage: (pkg: TravelPackage) => void;
  onClose?: () => void;
}

interface MarketData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  packages: TravelPackage[];
}

// Sample destination data with coordinates
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'Santorini, Greece': { lat: 36.3932, lng: 25.4615 },
  'Paris, France': { lat: 48.8566, lng: 2.3522 },
  'Bali, Indonesia': { lat: -8.4095, lng: 115.1889 },
  'Tokyo, Japan': { lat: 35.6762, lng: 139.6503 },
  'New York, USA': { lat: 40.7128, lng: -74.0060 },
  'Rome, Italy': { lat: 41.9028, lng: 12.4964 },
  'London, UK': { lat: 51.5074, lng: -0.1278 },
  'Dubai, UAE': { lat: 25.2048, lng: 55.2708 },
  'Cairo, Egypt': { lat: 30.0444, lng: 31.2357 },
  'Sydney, Australia': { lat: -33.8688, lng: 151.2093 },
  'Cape Town, South Africa': { lat: -33.9249, lng: 18.4232 },
  'Kyoto, Japan': { lat: 35.0116, lng: 135.7681 },
  'Amalfi Coast, Italy': { lat: 40.6333, lng: 14.6002 },
  'Swiss Alps, Switzerland': { lat: 46.5581, lng: 8.5204 },
  'Machu Picchu, Peru': { lat: -13.1631, lng: -72.5450 },
};

const CustomZoomControl = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-2">
      <button 
        onClick={() => map.zoomIn()}
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-xl hover:bg-slate-50 transition-all border border-slate-100"
      >
        <span className="text-xl font-black">+</span>
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-xl hover:bg-slate-50 transition-all border border-slate-100"
      >
        <span className="text-xl font-black">-</span>
      </button>
    </div>
  );
};

export const InteractiveMap: React.FC<DestinationMapProps> = ({ packages, onSelectPackage, onClose }) => {
  const [markers, setMarkers] = useState<MarketData[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<MarketData | null>(null);

  useEffect(() => {
    const data: Record<string, MarketData> = {};
    
    packages?.forEach(pkg => {
      if (!pkg) return;
      const destName = (pkg.destinations && pkg.destinations.length > 0) ? pkg.destinations[0] : (pkg.destination || '');
      if (destName && DESTINATION_COORDS[destName]) {
        if (!data[destName]) {
          data[destName] = {
            id: `marker-${destName}-${pkg.id}`,
            name: destName,
            lat: DESTINATION_COORDS[destName].lat,
            lng: DESTINATION_COORDS[destName].lng,
            description: pkg.description,
            packages: [pkg]
          };
        } else {
          data[destName].packages.push(pkg);
        }
      }
    });

    setMarkers(Object.values(data));
  }, [packages]);

  const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white sm:rounded-[40px] w-full h-full sm:max-h-[90vh] sm:max-w-6xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Compass className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tighter text-slate-900">Virtual Exploration</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs uppercase font-black tracking-widest">Click markers to discover curated journeys</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 relative flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar - Package Discovery */}
          <AnimatePresence>
            {selectedDestination && (
              <motion.div 
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                className="absolute md:relative inset-y-0 left-0 w-full md:w-[400px] bg-white/95 backdrop-blur-md border-r border-slate-100 z-20 flex flex-col shadow-2xl transition-all"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-[20px] flex items-center justify-center text-indigo-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{selectedDestination.name}</h3>
                      <p className="text-slate-500 text-xs">{selectedDestination.packages.length} curated journeys found</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDestination(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                  {selectedDestination.packages.map((pkg, idx) => (
                    <motion.div 
                      key={`${pkg.id}-${idx}`} 
                      whileHover={{ scale: 1.02 }}
                      className="group bg-slate-50 border border-slate-200 rounded-[28px] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all"
                      onClick={() => onSelectPackage(pkg)}
                    >
                      <div className="h-40 relative overflow-hidden">
                        <img 
                          src={pkg.imageUrl || pkg.image} 
                          alt={pkg.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                            {pkg.duration} Days
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-5">
                        <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{pkg.title}</h4>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting from</span>
                            <span className="text-xl font-black text-indigo-600">${pkg.price.toLocaleString()}</span>
                          </div>
                          <button className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform">
                            <ArrowUpRight size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Area */}
          <div className="flex-1 relative h-full">
            <MapContainer 
              center={[30, 0]} 
              zoom={3} 
              style={{ height: '100%', width: '100%', background: '#f8fafc' }}
              zoomControl={false}
              className="z-10"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {markers.map((marker) => (
                <Marker 
                  key={marker.id} 
                  position={[marker.lat, marker.lng]}
                  eventHandlers={{
                    click: () => setSelectedDestination(marker),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 max-w-[200px]">
                      <h4 className="font-black text-slate-900 mb-1">{marker.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{marker.description}</p>
                      <button 
                        onClick={() => setSelectedDestination(marker)}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md shadow-indigo-100"
                      >
                        Explore Packages
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <CustomZoomControl />
            </MapContainer>

            {/* Float Info */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-xl shadow-slate-900/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{markers.length} Regions Active</span>
              </div>
            </div>

            {/* Map Controls Card */}
            <div className="absolute bottom-10 left-6 z-20 hidden sm:block">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xl flex flex-col gap-4">
                <button className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 transition-all">
                  <MapIcon size={18} />
                  <span className="text-xs font-bold">Satellite</span>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 transition-all">
                  <Layers size={18} />
                  <span className="text-xs font-bold">Terrain</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};
