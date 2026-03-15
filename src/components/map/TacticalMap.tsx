import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, LayersControl } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css'; // Moved to index.css
import { PatrolUnit, Incident } from '@/types';
import L from 'leaflet';
import { 
  Target, AlertTriangle, Navigation,
  Car, User, Plane, PawPrint,
  Skull, Plus, Minus, Bomb, Users, Package
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface TacticalMapProps {
  units: PatrolUnit[];
  incidents: Incident[];
  selectedUnitId: string | null;
  selectedIncidentId: string | null;
  onUnitSelect: (id: string) => void;
  onIncidentSelect: (id: string) => void;
}

// Custom DivIcons for tactical look
const createUnitIcon = (unit: PatrolUnit, isSelected: boolean) => {
  const isSelf = unit.callsign.includes('SELF');
  const color = isSelf ? '#06b6d4' : // Cyan-500 for self
                unit.status === 'distress' ? '#ef4444' : 
                unit.status === 'engaged' ? '#f97316' : 
                unit.status === 'offline' ? '#57534e' : '#65a30d'; // Lime-600 for active
  
  let IconComponent = Navigation;
  switch (unit.type) {
    case 'infantry': IconComponent = User; break;
    case 'vehicle': IconComponent = Car; break;
    case 'drone': IconComponent = Plane; break;
    case 'k9': IconComponent = PawPrint; break;
  }

  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10">
      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute -inset-4 border-2 border-orange-500/50 rounded-full animate-ping opacity-20" />
      )}
      
      {/* Background with rotation for heading if applicable, or just static */}
      <div 
        className={`relative flex items-center justify-center w-full h-full rounded-full border-2 transition-all duration-300 ${isSelected ? 'bg-stone-900 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-stone-900/80 border-stone-600'}`}
        style={{ borderColor: isSelected ? '#f97316' : color }}
      >
        <IconComponent 
          size={18} 
          color={isSelected ? '#f97316' : color}
          className={`transition-transform duration-500 ${unit.type === 'drone' || unit.type === 'vehicle' ? '' : ''}`}
          style={{ transform: (unit.type === 'drone' || unit.type === 'vehicle') ? `rotate(${unit.heading - 90}deg)` : 'none' }}
        />
        
        {/* Status Indicator Dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-stone-900" style={{ backgroundColor: color }}>
          {unit.status === 'distress' && <div className="absolute inset-0 rounded-full animate-ping bg-red-500" />}
        </div>
      </div>
      
      {/* Label */}
      {isSelected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-[10px] font-mono text-white px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm z-50">
          {unit.callsign}
        </div>
      )}
    </div>
  );

  return L.divIcon({
    html,
    className: 'bg-transparent',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createIncidentIcon = (incident: Incident, isSelected: boolean) => {
  const color = incident.priority === 'critical' ? '#ef4444' : 
                incident.priority === 'high' ? '#f97316' : 
                incident.priority === 'medium' ? '#eab308' : '#3b82f6';
  
  let IconComponent = AlertTriangle;
  switch (incident.type) {
    case 'hostile': IconComponent = Skull; break;
    case 'medical': IconComponent = Plus; break;
    case 'ied': IconComponent = Bomb; break;
    case 'civilian': IconComponent = Users; break;
    case 'logistics': IconComponent = Package; break;
  }
  
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10">
      {/* Pulse Effect for Critical/High */}
      {(incident.priority === 'critical' || incident.priority === 'high') && (
        <div className={`absolute inset-0 rounded-full animate-ping opacity-20`} style={{ backgroundColor: color }}></div>
      )}
      
      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute -inset-4 border-2 border-red-500/50 rounded-full animate-ping opacity-30" />
      )}

      {/* Main Icon Container */}
      <div 
        className={`relative flex items-center justify-center w-full h-full clip-hexagon transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
        style={{ 
          backgroundColor: isSelected ? '#7f1d1d' : '#1c1917', // Red-900 or Stone-900
          border: `2px solid ${color}`,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        }}
      >
        <IconComponent 
          size={20} 
          color={color} 
          fill={incident.priority === 'critical' ? color : 'none'}
          fillOpacity={0.2}
        />
      </div>

      {/* Label */}
      {isSelected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-[10px] font-mono text-white px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm z-50">
          {incident.type.toUpperCase()}
        </div>
      )}
    </div>
  );

  return L.divIcon({
    html,
    className: 'bg-transparent',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Memoized Layers for Performance
const UnitTrailsLayer = React.memo(({ units, selectedUnitId }: { units: PatrolUnit[], selectedUnitId: string | null }) => {
  return (
    <>
      {units.map(unit => (
        unit.path && unit.path.length > 1 && (
          <React.Fragment key={`trail-group-${unit.id}`}>
            <Polyline
              positions={unit.path.map(p => [p.lat, p.lng])}
              pathOptions={{ 
                color: unit.id === selectedUnitId ? '#f97316' : (unit.callsign.includes('SELF') ? '#06b6d4' : '#65a30d'), 
                weight: unit.id === selectedUnitId ? 3 : 1, 
                opacity: unit.id === selectedUnitId ? 0.8 : 0.3,
                dashArray: unit.id === selectedUnitId ? undefined : '5, 10'
              }}
            />
            {/* Start Point Marker */}
            <Circle 
              center={[unit.path[0].lat, unit.path[0].lng]}
              radius={2}
              pathOptions={{
                color: unit.id === selectedUnitId ? '#f97316' : '#65a30d',
                fillColor: unit.id === selectedUnitId ? '#f97316' : '#65a30d',
                fillOpacity: 1
              }}
            />
          </React.Fragment>
        )
      ))}
    </>
  );
});

const UnitsLayer = React.memo(({ units, selectedUnitId, onUnitSelect }: { units: PatrolUnit[], selectedUnitId: string | null, onUnitSelect: (id: string) => void }) => {
  return (
    <>
      {units.map(unit => (
        <Marker 
          key={unit.id} 
          position={[unit.position.lat, unit.position.lng]}
          icon={createUnitIcon(unit, unit.id === selectedUnitId)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              onUnitSelect(unit.id);
            },
          }}
        />
      ))}
    </>
  );
});

const IncidentsLayer = React.memo(({ incidents, selectedIncidentId, onIncidentSelect }: { incidents: Incident[], selectedIncidentId: string | null, onIncidentSelect: (id: string) => void }) => {
  return (
    <>
      {incidents.map(incident => (
        <Marker 
          key={incident.id} 
          position={[incident.position.lat, incident.position.lng]}
          icon={createIncidentIcon(incident, incident.id === selectedIncidentId)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              onIncidentSelect(incident.id);
            },
          }}
        />
      ))}
    </>
  );
});

export default function TacticalMap({ units, incidents, selectedUnitId, selectedIncidentId, onUnitSelect, onIncidentSelect }: TacticalMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);

  // Center map on first unit or default
  const center = units.length > 0 
    ? [units[0].position.lat, units[0].position.lng] as [number, number]
    : [36.1699, -115.1398] as [number, number];

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', updateZoom);
    
    // Set initial zoom
    setCurrentZoom(map.getZoom());

    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  useEffect(() => {
    if (map) {
      if (selectedUnitId) {
        const unit = units.find(u => u.id === selectedUnitId);
        if (unit) {
          map.flyTo([unit.position.lat, unit.position.lng], 16, {
            animate: true,
            duration: 1.5
          });
        }
      } else if (selectedIncidentId) {
        const incident = incidents.find(i => i.id === selectedIncidentId);
        if (incident) {
          map.flyTo([incident.position.lat, incident.position.lng], 16, {
            animate: true,
            duration: 1.5
          });
        }
      }
    }
  }, [selectedUnitId, selectedIncidentId, map, units, incidents]);

  return (
    <div className="h-full w-full relative bg-[#0c0a09]">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#0c0a09' }}
        zoomControl={false}
        ref={setMap}
        preferCanvas={true} // Performance optimization for vectors
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Tactical (Dark)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Standard">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <UnitTrailsLayer units={units} selectedUnitId={selectedUnitId} />
        <UnitsLayer units={units} selectedUnitId={selectedUnitId} onUnitSelect={onUnitSelect} />
        <IncidentsLayer incidents={incidents} selectedIncidentId={selectedIncidentId} onIncidentSelect={onIncidentSelect} />
        
      </MapContainer>
      
      {/* Map Overlays */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-black/80 border border-stone-700/30 p-2 rounded text-xs font-mono text-stone-300 backdrop-blur shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            LIVE FEED // SAT-LINK
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
        <div className="text-[10px] font-mono text-stone-500 bg-black/50 p-1 rounded border border-stone-800/50 backdrop-blur">
          LAT: {center[0].toFixed(4)} <br/>
          LNG: {center[1].toFixed(4)} <br/>
          ZOOM: {currentZoom}X
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1 pointer-events-auto">
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) + 1)}
          className="bg-black/80 border border-stone-700/30 p-2 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors backdrop-blur shadow-lg"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) - 1)}
          className="bg-black/80 border border-stone-700/30 p-2 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors backdrop-blur shadow-lg"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => map?.setView(center, 13)}
          className="bg-black/80 border border-stone-700/30 p-2 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors backdrop-blur shadow-lg mt-2"
          title="Reset View"
        >
          <Target className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
