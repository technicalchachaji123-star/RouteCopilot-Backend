export type TruckType = 'LCV' | 'MCV' | 'HCV' | 'REEFER' | 'TIPPER' | 'Container';

export type CargoType = 
  | 'General Cargo'
  | 'Bulk Cargo'
  | 'Break Bulk Cargo'
  | 'Containerized Cargo'
  | 'Perishable Cargo'
  | 'Hazardous Cargo'
  | 'Project Cargo'
  | 'Automobile Cargo'
  | 'Express / Parcel Cargo'
  | 'Live Cargo';

export interface RouteRequestParams {
  origin: string;
  destination: string;
  waypoints?: string[];
  cargoTypes: CargoType[];
  truckType: TruckType;
  isNightTime?: boolean;
  simulatedFuelPrice?: number;
  simulatedWeatherIntensity?: number;
}

export interface RiskBreakdown {
  weatherRisk: { score: number; label: string; details: string };
  accidentZoneRisk: { score: number; label: string; zones: string[] };
  roadQuality: { score: number; label: string; details: string };
  politicalUnrest: { score: number; label: string; details: string };
  nightSafety: { score: number; label: string; details: string };
  floodRisk: { score: number; label: string; details: string };
  constructionDelay: { score: number; label: string; zones: string[] };
  trafficCongestion: { score: number; label: string; details: string };
  cargoSpecific: { score: number; label: string; details: string };
  overallDisruptionRisk: number;
}

export interface TollPlaza {
  name: string;
  lat: number;
  lon: number;
  cost: number;
  distanceFromStartKm: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  durationMins: number;
  riskScore: number;
  primaryAdvantage: string;
  badges: string[];
  fuelCostEst: number;
  tollCostEst: number;
  conditions: string[];
  originCoord?: { lat: number; lon: number } | null;
  destCoord?: { lat: number; lon: number } | null;
  waypointCoords?: { lat: number; lon: number }[];
  routeGeometry?: string;
  riskBreakdown?: RiskBreakdown;
  tolls?: TollPlaza[];
  alerts?: any[];
}

// Geocode a place name to lat/lng using Nominatim
async function geocode(place: string): Promise<{lat: number, lon: number} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RouteCopilotAI/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch (err: any) {
    console.error(`Geocode error for "${place}":`, err.message);
    return null;
  }
}

// Get real driving distance/duration from OSRM free API with geometries
async function getOSRMRoute(originCoord: {lat: number, lon: number}, destCoord: {lat: number, lon: number}, waypointCoords?: {lat: number, lon: number}[]): Promise<{distanceKm: number, durationMins: number, routeName: string, geometry: string} | null> {
  try {
    // Build coordinate string: origin;wp1;wp2;...;destination
    let coordStr = `${originCoord.lon},${originCoord.lat}`;
    if (waypointCoords && waypointCoords.length > 0) {
      for (const wp of waypointCoords) {
        coordStr += `;${wp.lon},${wp.lat}`;
      }
    }
    coordStr += `;${destCoord.lon},${destCoord.lat}`;
    
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=polyline`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RouteCopilotAI/1.0' } });
    const data = await res.json();
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceKm: Math.round(route.distance / 1000),
        durationMins: Math.round(route.duration / 60),
        routeName: data.waypoints?.map((w: any) => w.name).filter((n: string) => n).join(' → ') || '',
        geometry: route.geometry
      };
    }
    return null;
  } catch (err: any) {
    console.error(`OSRM error:`, err.message);
    return null;
  }
}

// Haversine distance as fallback
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Indian National Highway database by region
const NH_DATABASE: Record<string, string[]> = {
  'north': ['NH-48', 'NH-44', 'NH-8', 'NH-24', 'NH-58', 'NH-2', 'NH-10', 'NH-1'],
  'south': ['NH-44', 'NH-48', 'NH-66', 'NH-75', 'NH-544', 'NH-275', 'NH-47', 'NH-7', 'NH-27', 'NH-30'],
  'east': ['NH-16', 'NH-60', 'NH-31', 'NH-34', 'NH-6', 'NH-2', 'NH-55', 'NH-12'],
  'west': ['NH-48', 'NH-8', 'NH-27', 'NH-47', 'NH-66', 'NH-15', 'NH-68', 'NH-14'],
  'central': ['NH-44', 'NH-46', 'NH-30', 'NH-26', 'NH-7', 'NH-12A', 'NH-3', 'NH-25']
};

function getRegion(lat: number, lon: number): string {
  if (lat > 25 && lon < 78) return 'north';
  if (lat < 15) return 'south';
  if (lon > 85) return 'east';
  if (lon < 73) return 'west';
  return 'central';
}

function pickHighways(originCity: string, destCity: string, count: number = 3): string[] {
  const combo = originCity + destCity;
  const majorHighways = [
    'NH-44 (Kanyakumari-Srinagar)', 'NH-48 (Delhi-Chennai)', 'NH-19 (Delhi-Kolkata)', 
    'NH-16 (Kolkata-Chennai)', 'NH-27 (Porbandar-Silchar)', 'NH-52 (Sangrur-Ankola)',
    'NH-30 (Sitarganj-Ibrahimpatnam)', 'NH-66 (Panvel-Kanyakumari)', 'NE-1 (Ahmedabad-Vadodara)',
    'NE-2 (Eastern Peripheral)', 'Yamuna Expressway', 'Mumbai-Pune Expressway'
  ];
  
  // Hash-based selection for consistency
  let hash = 0;
  for (let i = 0; i < combo.length; i++) hash = ((hash << 5) - hash) + combo.charCodeAt(i);
  const seed = Math.abs(hash);
  
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(majorHighways[(seed + i) % majorHighways.length].split(' (')[0]);
  }
  
  return [...new Set(results)];
}

const TOLL_PLAZA_NAMES = [
  'Vadape Toll', 'Khopoli Toll', 'Palaspe Toll', 'Shedung Toll', 'Khed Shivapur Toll',
  'Uruli Toll', 'Nimbhore Toll', 'Dhayari Toll', 'Rajewadi Toll', 'Chandansar Toll',
  'Vapi Toll', 'Surat Toll', 'Sachin Toll', 'Valsad Toll', 'Ankleshwar Toll',
  'Sanand Toll', 'Ahmedabad Toll', 'Gandhinagar Toll', 'Mahisagar Toll', 'Modasa Toll'
];
const FUEL_BRAND_NAMES = [
  'HP Petrol Pump', 'Indian Oil (IOCL)', 'Bharat Petroleum (BPCL)', 'Reliance Petroleum',
  'Nayara Energy', 'Shell Fuel Station', 'Hindustan Petroleum (HP)', 'Essar Fuel Stop'
];
const REST_STOP_NAMES = [
  'Kamath Lokaruchi', 'Highway King Dhaba', 'MTR Restaurant', 'Adyar Ananda Bhavan',
  'Sagar Ratna', 'Punjabi Dhaba', 'Cafe Coffee Day', 'Havmor Ice Cream Stop',
  'Pind Balluchi', 'Bikaner Sweets', 'Highway Halwa House', 'Honest Restaurant'
];

function generateTolls(routeDist: number, multiplier: number = 1.0): TollPlaza[] {
  const numTolls = Math.max(1, Math.floor(routeDist / 100));
  const tolls: TollPlaza[] = [];
  for (let i = 0; i < numTolls; i++) {
    const name = TOLL_PLAZA_NAMES[Math.floor(Math.random() * TOLL_PLAZA_NAMES.length)];
    // Approximate progress along the route for better visual distribution
    const progress = (i + 1) / (numTolls + 1);
    tolls.push({
      name,
      lat: 0, // Frontend handles placement via geometry, but we keep this for schema
      lon: 0,
      cost: Math.round((Math.floor(Math.random() * 50) + 80) * multiplier),
      distanceFromStartKm: Math.round(routeDist * progress)
    });
  }
  return tolls;
}

function generateFuelStations(routeDist: number): string[] {
  const count = Math.max(1, Math.floor(routeDist / 120));
  const stations: string[] = [];
  for (let i = 0; i < count; i++) {
    stations.push(FUEL_BRAND_NAMES[Math.floor(Math.random() * FUEL_BRAND_NAMES.length)]);
  }
  return stations;
}

function generateRestStops(routeDist: number): string[] {
  const count = Math.max(1, Math.floor(routeDist / 150));
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    stops.push(REST_STOP_NAMES[Math.floor(Math.random() * REST_STOP_NAMES.length)]);
  }
  return stops;
}

export class RouteEngine {
  static async calculateOptimalRoutes(params: RouteRequestParams): Promise<RouteOption[]> {
    const { origin, destination, waypoints, truckType, cargoTypes, isNightTime, simulatedFuelPrice, simulatedWeatherIntensity } = params;

    const originCity = origin.split(',')[0].trim();
    const destCity = destination.split(',')[0].trim();

    const originCoord = await geocode(origin) || {lat: 28.6139, lon: 77.2090};
    const destCoord = await geocode(destination) || {lat: 19.0760, lon: 72.8777};

    // Geocode waypoints if provided
    let waypointCoords: {lat: number, lon: number}[] = [];
    if (waypoints && waypoints.length > 0) {
      for (const wp of waypoints) {
        const coord = await geocode(wp);
        if (coord) waypointCoords.push(coord);
      }
    }

    let realDistanceKm = Math.round(haversineKm(originCoord.lat, originCoord.lon, destCoord.lat, destCoord.lon) * 1.3);
    let realDurationMins = Math.round(realDistanceKm * 1.2);
    let geometry = '';
    const osrmResult = await getOSRMRoute(originCoord, destCoord, waypointCoords.length > 0 ? waypointCoords : undefined);
    if (osrmResult) {
      realDistanceKm = osrmResult.distanceKm;
      realDurationMins = osrmResult.durationMins;
      geometry = osrmResult.geometry;
    }

    const highways = pickHighways(originCity, destCity);

    // Generate 5 route variants
    const timestamp = Date.now();
    const baseRoutes = [
      { 
        id: `r1_${timestamp}`, 
        name: `${highways[0]} (${originCity} → ${destCity} Expressway)`, 
        dist: realDistanceKm, 
        dur: realDurationMins, 
        baseToll: Math.round(realDistanceKm * 3.5), 
        cond: ['Smooth Traffic'], 
        isExpressway: true,
        isRural: false,
        waypoints: waypointCoords
      },
      { 
        id: `r2_${timestamp}`, 
        name: `${highways[1]} (${originCity} → ${destCity} Highway)`, 
        dist: Math.round(realDistanceKm * 1.05),
        dur: Math.round(realDurationMins * 1.1),
        baseToll: Math.round(realDistanceKm * 1.5),
        cond: ['Heavy Traffic'], 
        isExpressway: false,
        isRural: false,
        waypoints: waypointCoords
      },
      { 
        id: `r3_${timestamp}`, 
        name: `${highways[2]} (${originCity} Rural Route)`, 
        dist: Math.round(realDistanceKm * 1.2),
        dur: Math.round(realDurationMins * 1.4),
        baseToll: 0,
        cond: ['Potholes', 'Narrow Sections'], 
        isExpressway: false,
        isRural: true,
        waypoints: waypointCoords
      },
      { 
        id: `r4_${timestamp}`, 
        name: `${highways[3] || 'NH-27'} (${originCity} → ${destCity} Coastal Route)`, 
        dist: Math.round(realDistanceKm * 1.1),
        dur: Math.round(realDurationMins * 1.15),
        baseToll: Math.round(realDistanceKm * 2.0),
        cond: ['Scenic', 'Monsoon Risk'], 
        isExpressway: false,
        isRural: false,
        waypoints: waypointCoords
      },
      { 
        id: `r5_${timestamp}`, 
        name: `${highways[4] || 'NH-30'} (${originCity} State Highway Alternate)`, 
        dist: Math.round(realDistanceKm * 1.08),
        dur: Math.round(realDurationMins * 1.25),
        baseToll: Math.round(realDistanceKm * 0.8),
        cond: ['Mixed Traffic', 'Town Crossings'], 
        isExpressway: false,
        isRural: false,
        waypoints: waypointCoords
      }
    ];

    // Vehicle Toll Multiplier
    let tollMultiplier = 1.0;
    if (truckType === 'MCV') tollMultiplier = 1.8;
    if (truckType === 'HCV') tollMultiplier = 3.5;
    if (truckType === 'Container') tollMultiplier = 4.0;
    if (truckType === 'TIPPER') tollMultiplier = 4.5;
    
    const fuelPrice = simulatedFuelPrice || 90; 

    // Cargo Modifiers
    const cargoMods = {
      isPerishable: cargoTypes.includes('Perishable Cargo'),
      isHazardous: cargoTypes.includes('Hazardous Cargo'),
      isProject: cargoTypes.includes('Project Cargo'),
      isAuto: cargoTypes.includes('Automobile Cargo'),
      isExpress: cargoTypes.includes('Express / Parcel Cargo'),
      isLive: cargoTypes.includes('Live Cargo'),
      isFragile: cargoTypes.includes('Break Bulk Cargo'),
      isHeavy: cargoTypes.includes('Bulk Cargo')
    };

    // Seed for location-based variability
    const locationSeed = originCity.length + destCity.length + (originCoord.lat * 10);
    
    const processedRoutes = baseRoutes.map((route, idx) => {
      // 1. Core Risks with randomness and location seed
      const rnd = (seed: number) => Math.sin(seed + idx + locationSeed) * 0.5 + 0.5; // Pseudo-random 0-1
      
      const weatherScore = Math.min(100, Math.max(5, (simulatedWeatherIntensity || 20) + (route.isRural ? 25 : 5) + (rnd(1) * 20)));
      const accidentScore = Math.min(100, Math.max(5, (route.isExpressway ? 15 : (route.isRural ? 45 : 65)) + (rnd(2) * 30 - 15)));
      const roadQualityScore = Math.min(100, Math.max(5, (route.isExpressway ? 10 : (route.isRural ? 75 : 35)) + (rnd(3) * 25 - 10)));
      const unrestScore = Math.min(100, Math.max(2, (rnd(4) * 40))); 
      const nightScore = isNightTime ? (route.isExpressway ? 35 : 85) : (10 + (rnd(5) * 15));
      const floodScore = Math.min(100, Math.max(2, (route.isRural ? 45 : 15) + (rnd(6) * 20)));
      const constructScore = Math.min(100, Math.max(5, (route.isExpressway ? 25 : 55) + (rnd(7) * 30)));
      const trafficScore = Math.min(100, Math.max(5, (route.isRural ? 15 : (route.isExpressway ? 40 : 75)) + (rnd(8) * 35 - 15)));

      // 2. Cargo Specific Logic
      let cargoSpecificScore = 15;
      let cargoDetails = "Normal conditions.";
      
      if (cargoMods.isPerishable) {
        cargoSpecificScore += (route.dur > realDurationMins * 1.1) ? 65 : 15;
        cargoDetails = "Spoilage risk evaluated based on route duration.";
      }
      if (cargoMods.isHazardous) {
        cargoSpecificScore += route.isRural ? 25 : 75;
        cargoDetails = "Hazardous routing prioritizing safety corridors.";
      }
      if (cargoMods.isFragile || cargoMods.isAuto) {
        cargoSpecificScore += (roadQualityScore * 0.8);
        cargoDetails = "Road vibration impact factored into safety score.";
      }
      if (cargoMods.isExpress) {
        cargoSpecificScore += (route.dur > realDurationMins * 1.05) ? 55 : 0;
        cargoDetails = "Strict time-sensitive routing applied.";
      }

      // Final Risk calculation (Balanced Weights)
      const totalRisk = (
        (weatherScore * 0.12) +
        (accidentScore * 0.18) +
        (roadQualityScore * 0.15) +
        (unrestScore * 0.08) +
        (nightScore * 0.12) +
        (floodScore * 0.10) +
        (constructScore * 0.10) +
        (trafficScore * 0.15)
      ) * (1 + (cargoSpecificScore / 450));

      const overallRisk = Math.max(8, Math.min(92, Math.round(totalRisk)));

      const breakdown: RiskBreakdown = {
        weatherRisk: { score: weatherScore, label: weatherScore > 50 ? 'High' : 'Low', details: weatherScore > 50 ? 'Rain/Fog Expected' : 'Clear Skies' },
        accidentZoneRisk: { score: accidentScore, label: accidentScore > 50 ? 'High' : 'Low', zones: accidentScore > 50 ? ['Known Blackspots'] : [] },
        roadQuality: { score: roadQualityScore, label: roadQualityScore > 50 ? 'Poor' : 'Excellent', details: route.isRural ? 'Potholes Reported' : 'Smooth Surface' },
        politicalUnrest: { score: unrestScore, label: 'Low', details: 'No active strikes' },
        nightSafety: { score: nightScore, label: nightScore > 50 ? 'Poor' : 'Good', details: route.isExpressway ? 'Well Lit' : 'Poor Illumination' },
        floodRisk: { score: floodScore, label: floodScore > 50 ? 'High' : 'Low', details: 'Normal' },
        constructionDelay: { score: constructScore, label: constructScore > 50 ? 'High' : 'Low', zones: constructScore > 50 ? ['Highway Widening'] : [] },
        trafficCongestion: { score: trafficScore, label: trafficScore > 50 ? 'Heavy' : 'Light', details: trafficScore > 50 ? 'Peak Hour Congestion' : 'Flowing' },
        cargoSpecific: { score: cargoSpecificScore, label: cargoSpecificScore > 50 ? 'High' : 'Low', details: cargoDetails },
        overallDisruptionRisk: overallRisk
      };

      const alerts = [];
      if (accidentScore > 50) alerts.push({ id: `alert-${idx}-1`, icon: '⚠️', text: `Accident-prone zone on ${route.name}` });
      if (weatherScore > 50) alerts.push({ id: `alert-${idx}-2`, icon: '🌧️', text: `Heavy rain forecast on ${route.name}` });
      if (constructScore > 50) alerts.push({ id: `alert-${idx}-3`, icon: '🚧', text: `Active construction delays` });

      return {
        id: route.id,
        name: route.name,
        distanceKm: route.dist,
        durationMins: route.dur,
        riskScore: overallRisk,
        primaryAdvantage: '',
        badges: route.baseToll === 0 ? ['Zero Toll'] : (route.isExpressway ? ['Expressway', 'Fastest'] : ['Optimal']),
        fuelCostEst: Math.round((route.dist / 6) * fuelPrice),
        tollCostEst: Math.round(route.baseToll * tollMultiplier),
        conditions: route.cond,
        originCoord,
        destCoord,
        waypointCoords: route.waypoints,
        routeGeometry: geometry,
        riskBreakdown: breakdown,
        highwaySequence: highways,
        tolls: route.baseToll > 0 ? generateTolls(route.dist, tollMultiplier) : [],
        fuelStations: (route.dist > 100) ? generateFuelStations(route.dist) : [],
        restStopsList: (route.dist > 150) ? generateRestStops(route.dist) : [],
        alerts
      };
    });

    const sortedByRisk = [...processedRoutes].sort((a, b) => a.riskScore - b.riskScore);
    const sortedByTime = [...processedRoutes].sort((a, b) => a.durationMins - b.durationMins);
    const sortedByCost = [...processedRoutes].sort((a, b) => (a.fuelCostEst + a.tollCostEst) - (b.fuelCostEst + b.tollCostEst));

    processedRoutes.forEach(r => {
      if (r.id === sortedByRisk[0].id) r.primaryAdvantage = 'Safest';
      else if (r.id === sortedByCost[0].id) r.primaryAdvantage = 'Most Economical';
      else if (r.id === sortedByTime[0].id) r.primaryAdvantage = 'Fastest';
      else r.primaryAdvantage = 'Optimal';
    });

    return processedRoutes.sort((a, b) => a.riskScore - b.riskScore);
  }
}
