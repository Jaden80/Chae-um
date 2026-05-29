export type TripType = 'day' | 'training' | 'tour';
export type TripScale = 'small' | 'medium' | 'large';
export type StayType = 'day' | 'overnight';

export interface TripPlan {
  type: TripType;
  scale: TripScale;
  stayType: StayType;
  title: string;
  purpose: string;
  startDate: string;
  endDate: string;
  departureTime: string;
  returnTime: string;
  grade: string[];
  totalStudents: number;
  nonParticipants: number;
  specialNeedsStudents: number;
  subsidyStudents: number;
  budget: number;
  transportType: 'bus' | 'train' | 'flight' | 'mixed';
  accommodationName?: string;
  accommodationAddress?: string;
  accommodationPhone?: string;
  mealPlan?: MealPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
  menu: string;
  restaurant: string;
}

export interface TripPlace {
  placeId: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  phone?: string;
  description?: string;
  programs?: PlaceProgram[];
  operatingHours?: string;
  admissionFee?: number;
  website?: string;
  sourceApp: 'app-a' | 'manual';
}

export interface PlaceProgram {
  name: string;
  duration: number;
  minAge?: number;
  maxParticipants?: number;
  fee?: number;
}

export interface RouteInfo {
  from: string;
  to: string;
  distance: number;
  duration: number;
  waypoints?: string[];
  nearbyHospitals?: Hospital[];
}

export interface Hospital {
  name: string;
  address: string;
  phone: string;
  distance: number;
  isEmergency: boolean;
}

export interface WeatherInfo {
  date: string;
  time: string;
  temperature: number;
  sky: string;
  precipitation: string;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  warning?: string;
}
