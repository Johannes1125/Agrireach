import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const apiKey = "7d943482be02a1ca265cd79c48d6d2cd"
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: "Failed to fetch weather", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Validate the response structure
    if (!data || !data.main || !data.weather || !Array.isArray(data.weather) || !data.weather[0]) {
      console.error("Invalid weather data from OpenWeatherMap:", data)
      return NextResponse.json(
        { error: "Invalid weather data received from weather service" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

