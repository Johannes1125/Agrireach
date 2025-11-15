"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, CloudSun } from "lucide-react"
import { authFetch } from "@/lib/auth-client"

interface WeatherData {
  temp: number
  description: string
  icon: string
  humidity: number
  feelsLike: number
  city: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, try to get user location from profile
        let lat: number | null = null
        let lon: number | null = null

        try {
          const userRes = await authFetch("/api/auth/me")
          if (userRes.ok) {
            const userData = await userRes.json()
            const user = userData?.data?.user || userData?.user
            if (user?.location_coordinates?.latitude && user?.location_coordinates?.longitude) {
              lat = user.location_coordinates.latitude
              lon = user.location_coordinates.longitude
            }
          }
        } catch (e) {
          console.warn("Could not fetch user location from profile:", e)
        }

        // If no user location, try browser geolocation
        if (!lat || !lon) {
          if (navigator.geolocation) {
            try {
              await new Promise<void>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    lat = position.coords.latitude
                    lon = position.coords.longitude
                    console.log("Got location from geolocation:", lat, lon)
                    resolve()
                  },
                  (err) => {
                    console.warn("Geolocation error:", err)
                    reject(err)
                  },
                  { timeout: 10000, enableHighAccuracy: false }
                )
              })
            } catch (geoErr) {
              console.warn("Geolocation failed:", geoErr)
              // Don't throw here, let it continue to see if we can still get weather
            }
          } else {
            console.warn("Geolocation not supported")
          }
        }

        if (!lat || !lon) {
          throw new Error("Could not determine location")
        }

        // Fetch weather from our API route (which proxies to OpenWeatherMap)
        const weatherRes = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}`
        )

        if (!weatherRes.ok) {
          const errorData = await weatherRes.json().catch(() => ({}))
          console.error("Weather API error:", weatherRes.status, errorData)
          throw new Error(`Failed to fetch weather: ${weatherRes.status}`)
        }

        const response = await weatherRes.json()
        // Handle both { data: {...} } and direct response structures
        const weatherData = response.data || response
        console.log("Weather data received:", weatherData)

        if (!cancelled && weatherData && weatherData.main && weatherData.weather && Array.isArray(weatherData.weather) && weatherData.weather[0]) {
          setWeather({
            temp: Math.round(weatherData.main.temp),
            description: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            humidity: weatherData.main.humidity,
            feelsLike: Math.round(weatherData.main.feels_like),
            city: weatherData.name,
          })
        } else {
          console.error("Invalid weather data structure:", weatherData, "Full response:", response)
          // Don't show error in admin dashboard, just return null
          if (!cancelled) {
            setLoading(false)
          }
          return
        }
      } catch (err: any) {
        console.error("Weather widget error:", err)
        if (!cancelled) {
          setError(err.message || "Failed to load weather")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchWeather()

    return () => {
      cancelled = true
    }
  }, [])

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes("01")) return <Sun className="h-4 w-4 text-yellow-500" />
    if (iconCode.includes("02")) return <CloudSun className="h-4 w-4 text-yellow-400" />
    if (iconCode.includes("09") || iconCode.includes("10")) return <CloudRain className="h-4 w-4 text-blue-500" />
    return <Cloud className="h-4 w-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
        <Cloud className="h-4 w-4 animate-pulse text-muted-foreground" />
        <span className="text-xs text-muted-foreground hidden sm:inline">Loading...</span>
      </div>
    )
  }

  if (error) {
    // Show error state for debugging (can be removed later)
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
        <Cloud className="h-4 w-4 text-destructive" />
        <span className="text-xs text-destructive hidden sm:inline truncate max-w-[80px]">
          {error}
        </span>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
      {getWeatherIcon(weather.icon)}
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-foreground">{weather.temp}°</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">C</span>
      </div>
      <span className="text-xs text-muted-foreground hidden md:inline capitalize truncate max-w-[100px]">
        {weather.description}
      </span>
    </div>
  )
}

