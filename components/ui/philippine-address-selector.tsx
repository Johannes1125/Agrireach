"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Navigation, Loader2, Map } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

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

import type { LeafletMouseEvent } from "leaflet";
// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

export interface PhilippineAddress {
  coordinates?: { latitude: number; longitude: number }
  formattedAddress?: string // Optional: reverse geocoded address for display
  // Structured address components extracted from reverse geocoding
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface PhilippineAddressSelectorProps {
  value?: PhilippineAddress
  onChange: (address: PhilippineAddress) => void
  className?: string
  showMap?: boolean
}

export function PhilippineAddressSelector({
  value,
  onChange,
  className = "",
  showMap = true
}: PhilippineAddressSelectorProps) {
  // Location and map state
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapVisible, setMapVisible] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(
    value?.coordinates ? { lat: value.coordinates.latitude, lng: value.coordinates.longitude } : null
  )
  const [mapKey, setMapKey] = useState(0)
  const [formattedAddress, setFormattedAddress] = useState<string>(value?.formattedAddress || "")

  // Fix Leaflet marker icon issue in Next.js
  useEffect(() => {
    if (typeof window !== "undefined" && showMap) {
      import("leaflet").then((leafletModule) => {
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
  }, [showMap])

  // Sync with external value changes
  useEffect(() => {
    if (value?.coordinates) {
      setMapCoordinates({ lat: value.coordinates.latitude, lng: value.coordinates.longitude })
      setFormattedAddress(value.formattedAddress || "")
      setMapKey(prev => prev + 1)
    }
  }, [value])

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    toast.info("Getting your location...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setMapCoordinates({ lat: latitude, lng: longitude })
        setMapKey(prev => prev + 1)

        try {
          // Reverse geocode to get formatted address
          const response = await fetch(
            `/api/geocoding?action=reverse&lat=${latitude}&lng=${longitude}`
          )
          const data = await response.json()

          if (response.ok && data.data) {
            const addressData = data.data.formatted_address || data.data.address
            setFormattedAddress(addressData)
            
            // Update parent with coordinates and structured address components
            onChange({
              coordinates: { latitude, longitude },
              formattedAddress: addressData,
              city: data.data.city || "",
              state: data.data.state || "",
              postalCode: data.data.postal_code || "",
              country: data.data.country || "Philippines"
            })
            toast.success("Location found!")
          } else {
            // Still save coordinates even if reverse geocoding fails
            onChange({
              coordinates: { latitude, longitude },
              formattedAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            })
            toast.success("Location saved!")
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err)
          // Still save coordinates even if reverse geocoding fails
          onChange({
            coordinates: { latitude, longitude },
            formattedAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
          toast.success("Location saved!")
        } finally {
          setIsGettingLocation(false)
        }
      },
      (err) => {
        console.error("Geolocation error:", err)
        setIsGettingLocation(false)
        if (err.code === 1) {
          toast.error("Location access denied. Please enable location permissions.")
        } else {
          toast.error("Failed to get your location")
        }
      }
    )
  }

  // Handle map click
  const handleMapClick = async (e: LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    setMapCoordinates({ lat, lng })
    setMapKey(prev => prev + 1)

    try {
      const response = await fetch(
        `/api/geocoding?action=reverse&lat=${lat}&lng=${lng}`
      )
      const data = await response.json()

      if (response.ok && data.data) {
        const addressData = data.data.formatted_address || data.data.address
        setFormattedAddress(addressData)
        
        // Update parent with coordinates and structured address components
        onChange({
          coordinates: { latitude: lat, longitude: lng },
          formattedAddress: addressData,
          city: data.data.city || "",
          state: data.data.state || "",
          postalCode: data.data.postal_code || "",
          country: data.data.country || "Philippines"
        })
        toast.success("Location selected!")
      } else {
        // Still save coordinates even if reverse geocoding fails
        onChange({
          coordinates: { latitude: lat, longitude: lng },
          formattedAddress: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        })
        toast.success("Location selected!")
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err)
      // Still save coordinates even if reverse geocoding fails
      onChange({
        coordinates: { latitude: lat, longitude: lng },
        formattedAddress: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      })
      toast.success("Location selected!")
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Use Current Location
            </>
          )}
        </Button>
        
        {showMap && (
          <Dialog open={mapVisible} onOpenChange={setMapVisible}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Map className="h-4 w-4" />
                Pick on Map
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Select Location on Map</DialogTitle>
                <DialogDescription>
                  Click on the map to select your delivery location
                </DialogDescription>
              </DialogHeader>
              <div className="h-[500px] w-full rounded-lg overflow-hidden">
                {typeof window !== "undefined" && MapContainer && (
                  <MapContainer
                    key={mapKey}
                    center={mapCoordinates ? [mapCoordinates.lat, mapCoordinates.lng] : [14.5995, 120.9842]} // Default to Manila
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapCoordinates && (
                      <Marker position={[mapCoordinates.lat, mapCoordinates.lng]}>
                      </Marker>
                    )}
                    <MapClickComponent onMapClick={handleMapClick} />
                  </MapContainer>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Display selected location */}
      {formattedAddress && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Selected Location:</p>
          <p className="text-sm text-muted-foreground">{formattedAddress}</p>
          {value?.coordinates && (
            <p className="text-xs text-muted-foreground mt-1">
              Coordinates: {value.coordinates.latitude.toFixed(6)}, {value.coordinates.longitude.toFixed(6)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format address as string
export function formatPhilippineAddress(address: PhilippineAddress): string {
  return address.formattedAddress || 
         (address.coordinates 
           ? `Location: ${address.coordinates.latitude.toFixed(6)}, ${address.coordinates.longitude.toFixed(6)}`
           : "No location selected")
}

// Helper function to validate if address is complete
export function isAddressComplete(address: PhilippineAddress): boolean {
  return !!(address.coordinates?.latitude && address.coordinates?.longitude)
}

// Component to handle map clicks - must be inside MapContainer
const MapClickComponent = ({ onMapClick }: { onMapClick: (e: LeafletMouseEvent) => void }) => {
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

      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }, [map, onMapClick]);

    return null;
  }

  return <InnerComponent />;
};
