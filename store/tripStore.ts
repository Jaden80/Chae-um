import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TripPlan, TripType, TripScale, TripPlace, RouteInfo, WeatherInfo } from '@/types';

export interface AppAPayload {
  placeId:    string;
  placeName:  string;
  address:    string;
  lat:        string;
  lng:        string;
  category:   string;
  phone?:     string;
  programs?:  string;
  receivedAt: string;
}

interface TripState {
  tripType:  TripType | null;
  tripScale: TripScale | null;
  plan:      Partial<TripPlan>;
  place:     TripPlace | null; // Primary place (or first place)
  places:    TripPlace[]; // Array of places for multi-place trips
  appAPayload: AppAPayload | null;
  route:     RouteInfo | null;
  weather:   WeatherInfo[];
  isCollectingRoute:   boolean;
  isCollectingWeather: boolean;
  collectError:        string | null;
  currentStep:   number;
  completedSteps: number[];

  selectTripType:     (type: TripType, scale: TripScale) => void;
  updatePlan:         (updates: Partial<TripPlan>) => void;
  setPlace:           (place: TripPlace) => void;
  addPlace:           (place: TripPlace) => void;
  removePlace:        (placeId: string) => void;
  parseAppAPayload:   (params: URLSearchParams) => AppAPayload | null;
  setRoute:           (route: RouteInfo) => void;
  setWeather:         (weather: WeatherInfo[]) => void;
  setCollectingRoute: (v: boolean) => void;
  setCollectingWeather: (v: boolean) => void;
  setCollectError:    (error: string | null) => void;
  completeStep:       (step: number) => void;
  setCurrentStep:     (step: number) => void;
  getTripLabel:       () => string;
  isOvernightTrip:    () => boolean;
  resetAll:           () => void;
}

const TRIP_TYPE_LABELS: Record<TripType, string> = {
  day:      '1일형 현장체험학습',
  training: '수련활동',
  tour:     '수학여행',
};
const TRIP_SCALE_LABELS: Record<TripScale, string> = {
  small: '소규모', medium: '중규모', large: '대규모',
};

const initialState = {
  tripType: null, tripScale: null, plan: {}, place: null, places: [],
  appAPayload: null, route: null, weather: [],
  isCollectingRoute: false, isCollectingWeather: false,
  collectError: null, currentStep: 1, completedSteps: [] as number[],
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      ...initialState,

      selectTripType: (type, scale) =>
        set({ tripType: type, tripScale: scale,
              plan: { type, scale, stayType: type === 'day' ? 'day' : 'overnight' } }),

      updatePlan: (updates) =>
        set((state) => ({ plan: { ...state.plan, ...updates,
                                  updatedAt: new Date().toISOString() } })),

      setPlace: (place) => set({ place, places: [place] }),
      addPlace: (place) => set((state) => ({ 
        places: [...state.places, place],
        place: state.place ? state.place : place // Set first place as primary if not set
      })),
      removePlace: (placeId) => set((state) => {
        const newPlaces = state.places.filter(p => p.placeId !== placeId);
        return {
          places: newPlaces,
          place: state.place?.placeId === placeId ? (newPlaces.length > 0 ? newPlaces[0] : null) : state.place
        };
      }),

      parseAppAPayload: (params) => {
        const placeId   = params.get('placeId');
        const placeName = params.get('placeName');
        const address   = params.get('address');
        const lat       = params.get('lat');
        const lng       = params.get('lng');
        const category  = params.get('category');
        if (!placeId || !placeName || !address || !lat || !lng || !category) return null;
        const latNum = parseFloat(lat), lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum) ||
            latNum < 33 || latNum > 43 || lngNum < 124 || lngNum > 132) return null;
        const payload: AppAPayload = {
          placeId, placeName: decodeURIComponent(placeName),
          address: decodeURIComponent(address), lat, lng,
          category: decodeURIComponent(category),
          phone:    params.get('phone') ?? undefined,
          programs: params.get('programs') ?? undefined,
          receivedAt: new Date().toISOString(),
        };
        set({ appAPayload: payload, place: {
          placeId, name: payload.placeName, address: payload.address,
          category: payload.category, latitude: latNum, longitude: lngNum,
          phone: payload.phone, sourceApp: 'app-a',
        }});
        return payload;
      },

      setRoute:           (route)   => set({ route, isCollectingRoute: false }),
      setWeather:         (weather) => set({ weather, isCollectingWeather: false }),
      setCollectingRoute: (v)       => set({ isCollectingRoute: v }),
      setCollectingWeather:(v)      => set({ isCollectingWeather: v }),
      setCollectError:    (e)       => set({ collectError: e }),

      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps : [...state.completedSteps, step],
        })),

      setCurrentStep: (currentStep) => set({ currentStep }),

      getTripLabel: () => {
        const { tripType, tripScale } = get();
        if (!tripType) return '';
        return `${TRIP_TYPE_LABELS[tripType]}${tripScale ? ` (${TRIP_SCALE_LABELS[tripScale]})` : ''}`;
      },

      isOvernightTrip: () => get().tripType !== 'day',

      resetAll: () => set(initialState),
    }),
    {
      name:    'trip-doc-trip',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    }
  )
);
