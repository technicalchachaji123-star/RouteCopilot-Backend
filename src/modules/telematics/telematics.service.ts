export class TelematicsService {
  /**
   * Generates high-fidelity simulated live telematics data.
   * Matches the specific requirements for fuel brands, toll charges, 
   * construction markers, and rerouting logic.
   */
  static async getLiveTelemetry(routeId: string) {
    const currentSpeed = Math.floor(Math.random() * (85 - 40 + 1) + 40);
    const currentRiskScore = Math.floor(Math.random() * (98 - 75 + 1) + 75);

    const weatherConditions = ['Clear Skies', 'Light Showers', 'Heavy Rain', 'Foggy'];
    const trafficConditions = ['Smooth Traffic', 'Moderate Congestion', 'Heavy Traffic Jam'];
    
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const traffic = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];

    return {
      routeId,
      liveStats: {
        currentSpeedKmH: currentSpeed,
        liveRiskScore: currentRiskScore,
        weatherCondition: weather,
        trafficStatus: traffic
      },
      aiAlerts: this.generateDynamicAlerts(weather, traffic),
      upcomingAmenities: this.generateUpcomingAmenities(),
      navigationUpdates: {
        nextToll: { distanceKm: 3, charge: 85, name: 'Main Plaza' },
        nextFuel: { distanceKm: 12, brand: 'HP Petrol Pump', price: 91.2 },
        construction: { distanceKm: 47, status: 'Slow zone', type: 'Road Construction' },
        rerouteSuggestion: { savedMins: 18, via: 'NH58 detour', reason: 'Heavy traffic' }
      }
    };
  }

  private static generateDynamicAlerts(weather: string, traffic: string) {
    const alerts = [];

    // Toll & Fuel Alerts (Highest Priority)
    alerts.push({ type: 'info', icon: 'fuel', message: 'Next Fuel Stop: 12 km — HP Petrol Pump' });
    alerts.push({ type: 'info', icon: 'toll', message: 'Next Toll Plaza: 3 km — ₹85 charged' });

    // Construction & Traffic
    alerts.push({ type: 'warning', icon: 'construction', message: 'Road Construction ahead at km 47 — Slow zone' });

    if (traffic.includes('Heavy')) {
      alerts.push({ type: 'danger', icon: 'reroute', message: 'AI Rerouting suggested: Save 18 mins via NH58 detour' });
    }

    // Weather
    if (weather.includes('Rain')) {
      alerts.push({ type: 'warning', icon: 'weather', message: 'Heavy rain forecast in 2 hrs — Reduce speed' });
    }

    // Rest Stop
    alerts.push({ type: 'info', icon: 'rest', message: 'Rest Stop recommended: Dhaba in 8 km — Good ratings' });

    return alerts;
  }

  private static generateUpcomingAmenities() {
    return {
      restStops: [
        { name: 'Highway Star Dhaba', distanceKm: 8, rating: 4.5, type: 'Dhaba' },
        { name: 'HP Petrol Pump', distanceKm: 12, brand: 'HP', pricePerLiter: 91.2 }
      ],
      tollPlazas: [
        { name: 'NH-48 Toll A', distanceKm: 3, cost: 85 }
      ]
    };
  }
}
