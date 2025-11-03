"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Navigation, Loader2, Map } from "lucide-react";
import { debounce } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

import type { LeafletMouseEvent } from "leaflet";

export interface LocationData {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formatted_address?: string;
}

interface LocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
  required?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  label = "Location",
  placeholder = "Enter address or use current location",
  className = "",
  showMap = true,
  required = false,
}: LocationPickerProps) {
  const [address, setAddress] = useState(value?.address || "");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | undefined>(
    value?.coordinates
  );
  const [mapVisible, setMapVisible] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force re-render when coordinates change

  // Fix Leaflet marker icon issue in Next.js (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leafletModule) => {
        // Handle both default and named exports
        const L = (leafletModule.default || leafletModule) as any;
        
        if (L && L.Icon && L.Icon.Default) {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });
        }
      }).catch((err) => {
        console.error("Failed to load Leaflet:", err);
      });
    }
  }, []);

  // Geocode address when it changes (debounced)
  const geocodeAddress = useCallback(
    debounce(async (addr: string) => {
      if (!addr || addr.trim().length === 0) {
        setCoordinates(undefined);
        onChange({ address: addr });
        return;
      }

      setIsGeocoding(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/geocoding?action=geocode&address=${encodeURIComponent(addr)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Geocoding failed");
        }

        if (data.data) {
          setCoordinates(data.data.coordinates);
          setMapKey((prev) => prev + 1); // Update map
          onChange({
            address: addr,
            coordinates: data.data.coordinates,
            formatted_address: data.data.formatted_address,
          });
        }
      } catch (err: any) {
        console.error("Geocoding error:", err);
        setError("Could not find location. Please check the address.");
        // Still save the address even if geocoding fails
        onChange({ address: addr });
      } finally {
        setIsGeocoding(false);
      }
    }, 1000),
    [onChange]
  );

  useEffect(() => {
    if (address !== value?.address) {
      geocodeAddress(address);
    }
  }, [address, geocodeAddress]);

  // Sync coordinates when value changes externally
  useEffect(() => {
    if (value?.coordinates && (
      value.coordinates.latitude !== coordinates?.latitude ||
      value.coordinates.longitude !== coordinates?.longitude
    )) {
      setCoordinates(value.coordinates);
      setMapKey((prev) => prev + 1);
    }
    if (value?.address && value.address !== address) {
      setAddress(value.address);
    }
  }, [value]);

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsGeocoding(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `/api/geocoding?action=reverse&lat=${latitude}&lng=${longitude}`
          );
          const data = await response.json();

          if (response.ok && data.data) {
            const addr = data.data.formatted_address || data.data.address;
            setAddress(addr);
            setCoordinates({ latitude, longitude });
            setMapKey((prev) => prev + 1);
            onChange({
              address: addr,
              coordinates: { latitude, longitude },
              formatted_address: data.data.formatted_address,
            });
          } else {
            // Use coordinates even if reverse geocoding fails
            setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            setCoordinates({ latitude, longitude });
            setMapKey((prev) => prev + 1);
            onChange({
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              coordinates: { latitude, longitude },
            });
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setCoordinates({ latitude, longitude });
          setMapKey((prev) => prev + 1);
          onChange({
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            coordinates: { latitude, longitude },
          });
        } finally {
          setIsGeocoding(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not get your location. Please enter address manually.");
        setIsGeocoding(false);
      }
    );
  };

  // Handle map click to set location
  const handleMapClick = async (e: any) => {
    const { lat, lng } = e.latlng;
    const latitude = lat;
    const longitude = lng;

    setIsGeocoding(true);
    setError(null);

    try {
      // Reverse geocode to get address
      const response = await fetch(
        `/api/geocoding?action=reverse&lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        const addr = data.data.formatted_address || data.data.address;
        setAddress(addr);
        setCoordinates({ latitude, longitude });
        onChange({
          address: addr,
          coordinates: { latitude, longitude },
          formatted_address: data.data.formatted_address,
        });
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setCoordinates({ latitude, longitude });
        onChange({
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: { latitude, longitude },
        });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setCoordinates({ latitude, longitude });
      onChange({
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        coordinates: { latitude, longitude },
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Default center: Olongapo City, Philippines
  const defaultCenter: [number, number] = [14.8292, 120.2829]; // Olongapo City coordinates
  const mapCenter: [number, number] = coordinates
    ? [coordinates.latitude, coordinates.longitude]
    : defaultCenter;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="location-input">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          {showMap && (
            <Dialog open={mapVisible} onOpenChange={setMapVisible}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Open Map
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Select Location on Map</DialogTitle>
                  <DialogDescription>
                    Click anywhere on the map to set your location, or use the buttons below.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 relative px-6 pb-6">
                  {typeof window !== "undefined" && (
                    <div className="h-[calc(80vh-180px)] w-full relative rounded-lg overflow-hidden border">
                      <MapContainer
                        key={mapKey}
                        center={mapCenter}
                        zoom={coordinates ? 15 : 13}
                        style={{ height: "100%", width: "100%", zIndex: 0 }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {coordinates && (
                          <Marker position={[coordinates.latitude, coordinates.longitude]}>
                            <Popup>
                              {address || "Selected Location"}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                              </span>
                            </Popup>
                          </Marker>
                        )}
                        <MapClickComponent onMapClick={handleMapClick} />
                      </MapContainer>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 Click on the map to pin your location
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isGeocoding}
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                      )}
                      Use Current Location
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGeocoding}
          >
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use Current Location
          </Button>
        </div>
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="location-input"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          className="pl-10"
          required={required}
        />
        {isGeocoding && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {coordinates && !error && (
        <p className="text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 inline mr-1" />
          Located at: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
        </p>
      )}

      {value?.formatted_address && value.formatted_address !== address && (
        <p className="text-xs text-muted-foreground italic">
          {value.formatted_address}
        </p>
      )}
    </div>
  );
}

// Component to handle map clicks - must be inside MapContainer
const MapClickComponent = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
  const [useMapHook, setUseMapHook] = useState<any>(null);
  
  useEffect(() => {
    import("react-leaflet").then((mod) => {
      setUseMapHook(() => mod.useMap);
    });
  }, []);
  
  if (!useMapHook) return null;
  
  function InnerComponent() {
    const map = useMapHook();
    
    useEffect(() => {
      const handleClick = (e: LeafletMouseEvent) => {
        onMapClick(e);
      };
      
      map.on("click", handleClick);
      return () => {
        map.off("click", handleClick);
      };
    }, [map, onMapClick]);
    
    return null;
  }
  
  return <InnerComponent />;
};
