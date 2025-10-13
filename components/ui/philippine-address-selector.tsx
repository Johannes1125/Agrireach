"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface PhilippineAddress {
  region: string
  province: string
  city: string
  barangay: string
  streetAddress?: string
  zipCode?: string
}

interface PhilippineAddressSelectorProps {
  value?: PhilippineAddress
  onChange: (address: PhilippineAddress) => void
  showStreetAddress?: boolean
  showZipCode?: boolean
  className?: string
}

// Static Philippine address data
const PHILIPPINE_REGIONS = [
  { code: "NCR", name: "National Capital Region (NCR)" },
  { code: "CAR", name: "Cordillera Administrative Region (CAR)" },
  { code: "I", name: "Region I (Ilocos Region)" },
  { code: "II", name: "Region II (Cagayan Valley)" },
  { code: "III", name: "Region III (Central Luzon)" },
  { code: "IV-A", name: "Region IV-A (CALABARZON)" },
  { code: "IV-B", name: "Region IV-B (MIMAROPA)" },
  { code: "V", name: "Region V (Bicol Region)" },
  { code: "VI", name: "Region VI (Western Visayas)" },
  { code: "VII", name: "Region VII (Central Visayas)" },
  { code: "VIII", name: "Region VIII (Eastern Visayas)" },
  { code: "IX", name: "Region IX (Zamboanga Peninsula)" },
  { code: "X", name: "Region X (Northern Mindanao)" },
  { code: "XI", name: "Region XI (Davao Region)" },
  { code: "XII", name: "Region XII (SOCCSKSARGEN)" },
  { code: "XIII", name: "Region XIII (Caraga)" },
  { code: "BARMM", name: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)" }
]

const PHILIPPINE_PROVINCES: Record<string, Array<{code: string, name: string}>> = {
  "NCR": [
    { code: "NCR-MNL", name: "Manila" },
    { code: "NCR-QUE", name: "Quezon City" },
    { code: "NCR-CAL", name: "Caloocan" },
    { code: "NCR-LAS", name: "Las Piñas" },
    { code: "NCR-MAK", name: "Makati" },
    { code: "NCR-MAL", name: "Malabon" },
    { code: "NCR-MAN", name: "Mandaluyong" },
    { code: "NCR-MAR", name: "Marikina" },
    { code: "NCR-MUN", name: "Muntinlupa" },
    { code: "NCR-NAV", name: "Navotas" },
    { code: "NCR-PAR", name: "Parañaque" },
    { code: "NCR-PAS", name: "Pasay" },
    { code: "NCR-PAT", name: "Pateros" },
    { code: "NCR-SAN", name: "San Juan" },
    { code: "NCR-TAG", name: "Taguig" },
    { code: "NCR-VAL", name: "Valenzuela" }
  ],
  "CAR": [
    { code: "CAR-ABR", name: "Abra" },
    { code: "CAR-APY", name: "Apayao" },
    { code: "CAR-BEN", name: "Benguet" },
    { code: "CAR-IFU", name: "Ifugao" },
    { code: "CAR-KAL", name: "Kalinga" },
    { code: "CAR-MOU", name: "Mountain Province" }
  ],
  "I": [
    { code: "I-ILN", name: "Ilocos Norte" },
    { code: "I-ILS", name: "Ilocos Sur" },
    { code: "I-LUN", name: "La Union" },
    { code: "I-PAN", name: "Pangasinan" }
  ],
  "II": [
    { code: "II-BTN", name: "Batanes" },
    { code: "II-CAG", name: "Cagayan" },
    { code: "II-ISA", name: "Isabela" },
    { code: "II-NUV", name: "Nueva Vizcaya" },
    { code: "II-QUI", name: "Quirino" }
  ],
  "III": [
    { code: "III-AUR", name: "Aurora" },
    { code: "III-BAT", name: "Bataan" },
    { code: "III-BUL", name: "Bulacan" },
    { code: "III-NUE", name: "Nueva Ecija" },
    { code: "III-PAM", name: "Pampanga" },
    { code: "III-TAR", name: "Tarlac" },
    { code: "III-ZAM", name: "Zambales" }
  ],
  "IV-A": [
    { code: "IV-A-BAT", name: "Batangas" },
    { code: "IV-A-CAV", name: "Cavite" },
    { code: "IV-A-LAG", name: "Laguna" },
    { code: "IV-A-QUE", name: "Quezon" },
    { code: "IV-A-RIZ", name: "Rizal" }
  ],
  "IV-B": [
    { code: "IV-B-MAR", name: "Marinduque" },
    { code: "IV-B-OCC", name: "Occidental Mindoro" },
    { code: "IV-B-ORI", name: "Oriental Mindoro" },
    { code: "IV-B-PAL", name: "Palawan" },
    { code: "IV-B-ROM", name: "Romblon" }
  ],
  "V": [
    { code: "V-ALB", name: "Albay" },
    { code: "V-CAM", name: "Camarines Norte" },
    { code: "V-CAS", name: "Camarines Sur" },
    { code: "V-CAT", name: "Catanduanes" },
    { code: "V-MAS", name: "Masbate" },
    { code: "V-SOR", name: "Sorsogon" }
  ],
  "VI": [
    { code: "VI-AKL", name: "Aklan" },
    { code: "VI-ANT", name: "Antique" },
    { code: "VI-CAP", name: "Capiz" },
    { code: "VI-GUI", name: "Guimaras" },
    { code: "VI-ILI", name: "Iloilo" },
    { code: "VI-NEG", name: "Negros Occidental" }
  ],
  "VII": [
    { code: "VII-BOH", name: "Bohol" },
    { code: "VII-CEB", name: "Cebu" },
    { code: "VII-NEG", name: "Negros Oriental" },
    { code: "VII-SIG", name: "Siquijor" }
  ],
  "VIII": [
    { code: "VIII-BIL", name: "Biliran" },
    { code: "VIII-EAS", name: "Eastern Samar" },
    { code: "VIII-LEY", name: "Leyte" },
    { code: "VIII-NOR", name: "Northern Samar" },
    { code: "VIII-SAM", name: "Samar" },
    { code: "VIII-SOU", name: "Southern Leyte" }
  ],
  "IX": [
    { code: "IX-ZAN", name: "Zamboanga del Norte" },
    { code: "IX-ZAS", name: "Zamboanga del Sur" },
    { code: "IX-ZSI", name: "Zamboanga Sibugay" }
  ],
  "X": [
    { code: "X-BUK", name: "Bukidnon" },
    { code: "X-CAM", name: "Camiguin" },
    { code: "X-LAN", name: "Lanao del Norte" },
    { code: "X-MIS", name: "Misamis Occidental" },
    { code: "X-MSC", name: "Misamis Oriental" }
  ],
  "XI": [
    { code: "XI-COM", name: "Compostela Valley" },
    { code: "XI-DAV", name: "Davao del Norte" },
    { code: "XI-DAS", name: "Davao del Sur" },
    { code: "XI-DAO", name: "Davao Oriental" }
  ],
  "XII": [
    { code: "XII-COT", name: "Cotabato" },
    { code: "XII-SAR", name: "Sarangani" },
    { code: "XII-SOU", name: "South Cotabato" },
    { code: "XII-SUL", name: "Sultan Kudarat" }
  ],
  "XIII": [
    { code: "XIII-AGN", name: "Agusan del Norte" },
    { code: "XIII-AGS", name: "Agusan del Sur" },
    { code: "XIII-DIN", name: "Dinagat Islands" },
    { code: "XIII-SUR", name: "Surigao del Norte" },
    { code: "XIII-SUS", name: "Surigao del Sur" }
  ],
  "BARMM": [
    { code: "BARMM-BAS", name: "Basilan" },
    { code: "BARMM-LAN", name: "Lanao del Sur" },
    { code: "BARMM-MAG", name: "Maguindanao" },
    { code: "BARMM-SUL", name: "Sulu" },
    { code: "BARMM-TAW", name: "Tawi-Tawi" }
  ]
}

const PHILIPPINE_CITIES: Record<string, Array<{code: string, name: string}>> = {
  // NCR Cities - Major cities for delivery
  "NCR-MNL": [
    { code: "MNL-001", name: "Manila City" }
  ],
  "NCR-QUE": [
    { code: "QUE-001", name: "Quezon City" }
  ],
  "NCR-MAK": [
    { code: "MAK-001", name: "Makati City" }
  ],
  "NCR-TAG": [
    { code: "TAG-001", name: "Taguig City" }
  ],
  "NCR-PAS": [
    { code: "PAS-001", name: "Pasay City" }
  ],
  "NCR-MAR": [
    { code: "MAR-001", name: "Marikina City" }
  ],
  "NCR-MUN": [
    { code: "MUN-001", name: "Muntinlupa City" }
  ],
  "NCR-LAS": [
    { code: "LAS-001", name: "Las Piñas City" }
  ],
  "NCR-PAR": [
    { code: "PAR-001", name: "Parañaque City" }
  ],
  "NCR-VAL": [
    { code: "VAL-001", name: "Valenzuela City" }
  ],
  "NCR-CAL": [
    { code: "CAL-001", name: "Caloocan City" }
  ],
  "NCR-MAL": [
    { code: "MAL-001", name: "Malabon City" }
  ],
  "NCR-NAV": [
    { code: "NAV-001", name: "Navotas City" }
  ],
  "NCR-MAN": [
    { code: "MAN-001", name: "Mandaluyong City" }
  ],
  "NCR-SAN": [
    { code: "SAN-001", name: "San Juan City" }
  ],
  "NCR-PAT": [
    { code: "PAT-001", name: "Pateros" }
  ],
  
  // Region III - Major cities
  "III-BUL": [
    { code: "BUL-001", name: "Malolos City" },
    { code: "BUL-002", name: "Meycauayan City" },
    { code: "BUL-003", name: "San Jose del Monte City" },
    { code: "BUL-004", name: "Baliuag" },
    { code: "BUL-005", name: "Marilao" },
    { code: "BUL-006", name: "Santa Maria" }
  ],
  "III-PAM": [
    { code: "PAM-001", name: "Angeles City" },
    { code: "PAM-002", name: "San Fernando City" },
    { code: "PAM-003", name: "Mabalacat City" },
    { code: "PAM-004", name: "Mexico" },
    { code: "PAM-005", name: "Guagua" }
  ],
  "III-NUE": [
    { code: "NUE-001", name: "Cabanatuan City" },
    { code: "NUE-002", name: "Palayan City" },
    { code: "NUE-003", name: "San Jose City" },
    { code: "NUE-004", name: "Gapan City" },
    { code: "NUE-005", name: "Muñoz City" }
  ],
  "III-TAR": [
    { code: "TAR-001", name: "Tarlac City" },
    { code: "TAR-002", name: "Capas" },
    { code: "TAR-003", name: "Concepcion" }
  ],
  "III-ZAM": [
    { code: "ZAM-001", name: "Olongapo City" },
    { code: "ZAM-002", name: "Botolan" },
    { code: "ZAM-003", name: "Cabangan" },
    { code: "ZAM-004", name: "Candelaria" },
    { code: "ZAM-005", name: "Castillejos" },
    { code: "ZAM-006", name: "Iba (capital)" },
    { code: "ZAM-007", name: "Masinloc" },
    { code: "ZAM-008", name: "Palauig" },
    { code: "ZAM-009", name: "San Antonio" },
    { code: "ZAM-010", name: "San Felipe" },
    { code: "ZAM-011", name: "San Marcelino" },
    { code: "ZAM-012", name: "San Narciso" },
    { code: "ZAM-013", name: "Santa Cruz" },
    { code: "ZAM-014", name: "Subic" }
  ],
  "III-AUR": [
    { code: "AUR-001", name: "Baler" },
    { code: "AUR-002", name: "Maria Aurora" }
  ],
  "III-BAT": [
    { code: "BAT-001", name: "Balanga City" },
    { code: "BAT-002", name: "Mariveles" },
    { code: "BAT-003", name: "Dinalupihan" }
  ],
  "ZAM-001": [
    { code: "OLG-001", name: "Asinan" },
    { code: "OLG-002", name: "Banicain" },
    { code: "OLG-003", name: "Barretto" },
    { code: "OLG-004", name: "East Bajac-Bajac" },
    { code: "OLG-005", name: "East Tapinac" },
    { code: "OLG-006", name: "Gordon Heights" },
    { code: "OLG-007", name: "Kalaklan" },
    { code: "OLG-008", name: "Mabayuan" },
    { code: "OLG-009", name: "New Cabalan" },
    { code: "OLG-010", name: "New Kalalake" },
    { code: "OLG-011", name: "Old Cabalan" },
    { code: "OLG-012", name: "Pag-asa" },
    { code: "OLG-013", name: "Santa Rita" },
    { code: "OLG-014", name: "West Bajac-Bajac" },
    { code: "OLG-015", name: "West Tapinac" },
    { code: "OLG-016", name: "Kababae" },
    { code: "OLG-017", name: "Kalalake" }
  ],
  
  // Region IV-A - Major cities
  "IV-A-CAV": [
    { code: "CAV-001", name: "Bacoor City" },
    { code: "CAV-002", name: "Cavite City" },
    { code: "CAV-003", name: "Dasmariñas City" },
    { code: "CAV-004", name: "Imus City" },
    { code: "CAV-005", name: "Tagaytay City" },
    { code: "CAV-006", name: "Trece Martires City" },
    { code: "CAV-007", name: "General Trias City" }
  ],
  "IV-A-LAG": [
    { code: "LAG-001", name: "Biñan City" },
    { code: "LAG-002", name: "Calamba City" },
    { code: "LAG-003", name: "San Pablo City" },
    { code: "LAG-004", name: "Santa Rosa City" },
    { code: "LAG-005", name: "Cabuyao City" },
    { code: "LAG-006", name: "Los Baños" },
    { code: "LAG-007", name: "San Pedro City" }
  ],
  "IV-A-BAT": [
    { code: "BAT-001", name: "Batangas City" },
    { code: "BAT-002", name: "Lipa City" },
    { code: "BAT-003", name: "Tanauan City" },
    { code: "BAT-004", name: "Calaca" },
    { code: "BAT-005", name: "Lemery" }
  ],
  "IV-A-RIZ": [
    { code: "RIZ-001", name: "Antipolo City" },
    { code: "RIZ-002", name: "Taytay" },
    { code: "RIZ-003", name: "Cainta" },
    { code: "RIZ-004", name: "Angono" },
    { code: "RIZ-005", name: "Binangonan" }
  ],
  "IV-A-QUE": [
    { code: "QUE-001", name: "Lucena City" },
    { code: "QUE-002", name: "Tayabas City" },
    { code: "QUE-003", name: "Sariaya" },
    { code: "QUE-004", name: "Candelaria" }
  ],
  
  // Region VII - Major cities
  "VII-CEB": [
    { code: "CEB-001", name: "Cebu City" },
    { code: "CEB-002", name: "Lapu-Lapu City" },
    { code: "CEB-003", name: "Mandaue City" },
    { code: "CEB-004", name: "Talisay City" },
    { code: "CEB-005", name: "Toledo City" },
    { code: "CEB-006", name: "Carcar City" },
    { code: "CEB-007", name: "Danao City" },
    { code: "CEB-008", name: "Consolacion" },
    { code: "CEB-009", name: "Liloan" },
    { code: "CEB-010", name: "Minglanilla" }
  ],
  "VII-BOH": [
    { code: "BOH-001", name: "Tagbilaran City" },
    { code: "BOH-002", name: "Carmen" },
    { code: "BOH-003", name: "Corella" }
  ],
  "VII-NEG": [
    { code: "NEG-001", name: "Dumaguete City" },
    { code: "NEG-002", name: "Bais City" },
    { code: "NEG-003", name: "Canlaon City" }
  ],
  "VII-SIG": [
    { code: "SIG-001", name: "Siquijor" },
    { code: "SIG-002", name: "Larena" }
  ],
  
  // Region XI - Major cities
  "XI-DAV": [
    { code: "DAV-001", name: "Davao City" },
    { code: "DAV-002", name: "Panabo City" },
    { code: "DAV-003", name: "Samal City" },
    { code: "DAV-004", name: "Tagum City" }
  ],
  "XI-DAS": [
    { code: "DAS-001", name: "Digos City" },
    { code: "DAS-002", name: "Mati City" }
  ],
  "XI-DAO": [
    { code: "DAO-001", name: "Mati City" },
    { code: "DAO-002", name: "Baganga" }
  ],
  "XI-COM": [
    { code: "COM-001", name: "Nabunturan" },
    { code: "COM-002", name: "Maco" }
  ]
}

const PHILIPPINE_BARANGAYS: Record<string, Array<{code: string, name: string}>> = {
  // NCR Barangays - Major areas
  "MNL-001": [
    { code: "MNL-001", name: "Central Manila" },
    { code: "MNL-002", name: "Downtown Manila" },
    { code: "MNL-003", name: "Port Area" }
  ],
  "QUE-001": [
    { code: "QUE-001", name: "Central Quezon City" },
    { code: "QUE-002", name: "Eastwood" },
    { code: "QUE-003", name: "Cubao" },
    { code: "QUE-004", name: "Katipunan" }
  ],
  "MAK-001": [
    { code: "MAK-001", name: "Central Makati" },
    { code: "MAK-002", name: "Ayala Avenue" },
    { code: "MAK-003", name: "Rockwell" },
    { code: "MAK-004", name: "Salcedo Village" }
  ],
  "TAG-001": [
    { code: "TAG-001", name: "Central Taguig" },
    { code: "TAG-002", name: "Bonifacio Global City" },
    { code: "TAG-003", name: "Fort Bonifacio" }
  ],
  "PAS-001": [
    { code: "PAS-001", name: "Central Pasay" },
    { code: "PAS-002", name: "Mall of Asia Area" },
    { code: "PAS-003", name: "Villamor Airbase" }
  ],
  
  // Region III Barangays
  "BUL-001": [
    { code: "BUL-001", name: "Central Malolos" },
    { code: "BUL-002", name: "Barasoain" },
    { code: "BUL-003", name: "Santo Niño" }
  ],
  "PAM-001": [
    { code: "PAM-001", name: "Central Angeles" },
    { code: "PAM-002", name: "Clark Freeport" },
    { code: "PAM-003", name: "Balibago" }
  ],
  
  // Region IV-A Barangays
  "CAV-001": [
    { code: "CAV-001", name: "Central Bacoor" },
    { code: "CAV-002", name: "Molino" },
    { code: "CAV-003", name: "Zapote" }
  ],
  "LAG-001": [
    { code: "LAG-001", name: "Central Biñan" },
    { code: "LAG-002", name: "Malaban" },
    { code: "LAG-003", name: "San Antonio" }
  ],
  
  // Region VII Barangays
  "CEB-001": [
    { code: "CEB-001", name: "Central Cebu" },
    { code: "CEB-002", name: "Lahug" },
    { code: "CEB-003", name: "Banilad" },
    { code: "CEB-004", name: "IT Park" }
  ],
  
  // Region XI Barangays
  "DAV-001": [
    { code: "DAV-001", name: "Central Davao" },
    { code: "DAV-002", name: "Matina" },
    { code: "DAV-003", name: "Bajada" }
  ],
  
  // Zambales Barangays - Olongapo City
  "ZAM-001": [
    { code: "OLG-001", name: "Asinan" },
    { code: "OLG-002", name: "Banicain" },
    { code: "OLG-003", name: "Barretto" },
    { code: "OLG-004", name: "East Bajac-Bajac" },
    { code: "OLG-005", name: "East Tapinac" },
    { code: "OLG-006", name: "Gordon Heights" },
    { code: "OLG-007", name: "Kalaklan" },
    { code: "OLG-008", name: "Mabayuan" },
    { code: "OLG-009", name: "New Cabalan" },
    { code: "OLG-010", name: "New Kalalake" },
    { code: "OLG-011", name: "Old Cabalan" },
    { code: "OLG-012", name: "Pag-asa" },
    { code: "OLG-013", name: "Santa Rita" },
    { code: "OLG-014", name: "West Bajac-Bajac" },
    { code: "OLG-015", name: "West Tapinac" },
    { code: "OLG-016", name: "Kababae" },
    { code: "OLG-017", name: "Kalalake" }
  ]
}

export function PhilippineAddressSelector({
  value,
  onChange,
  showStreetAddress = true,
  showZipCode = true,
  className = ""
}: PhilippineAddressSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState(value?.region || "")
  const [selectedProvince, setSelectedProvince] = useState(value?.province || "")
  const [selectedCity, setSelectedCity] = useState(value?.city || "")
  const [selectedBarangay, setSelectedBarangay] = useState(value?.barangay || "")
  const [streetAddress, setStreetAddress] = useState(value?.streetAddress || "")
  const [zipCode, setZipCode] = useState(value?.zipCode || "")

  const [provinces, setProvinces] = useState<Array<{code: string, name: string}>>([])
  const [cities, setCities] = useState<Array<{code: string, name: string}>>([])
  const [barangays, setBarangays] = useState<Array<{code: string, name: string}>>([])

  // Load provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      const provincesData = PHILIPPINE_PROVINCES[selectedRegion] || []
      setProvinces(provincesData)
      setSelectedProvince("")
      setSelectedCity("")
      setSelectedBarangay("")
    } else {
      setProvinces([])
      setSelectedProvince("")
      setSelectedCity("")
      setSelectedBarangay("")
    }
  }, [selectedRegion])

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const citiesData = PHILIPPINE_CITIES[selectedProvince] || []
      setCities(citiesData)
      setSelectedCity("")
      setSelectedBarangay("")
    } else {
      setCities([])
      setSelectedCity("")
      setSelectedBarangay("")
    }
  }, [selectedProvince])

  // Load barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      const barangaysData = PHILIPPINE_BARANGAYS[selectedCity] || []
      setBarangays(barangaysData)
      setSelectedBarangay("")
    } else {
      setBarangays([])
      setSelectedBarangay("")
    }
  }, [selectedCity])

  // Update parent component when any field changes
  useEffect(() => {
    const address: PhilippineAddress = {
      region: selectedRegion,
      province: selectedProvince,
      city: selectedCity,
      barangay: selectedBarangay,
      streetAddress: showStreetAddress ? streetAddress : undefined,
      zipCode: showZipCode ? zipCode : undefined
    }
    onChange(address)
  }, [selectedRegion, selectedProvince, selectedCity, selectedBarangay, streetAddress, zipCode, onChange, showStreetAddress, showZipCode])

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
  }

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value)
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
  }

  const handleBarangayChange = (value: string) => {
    setSelectedBarangay(value)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Two-column grid for main address fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region *</Label>
          <Select value={selectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              {PHILIPPINE_REGIONS.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Province */}
        <div className="space-y-2">
          <Label htmlFor="province">Province *</Label>
          <Select 
            value={selectedProvince} 
            onValueChange={handleProvinceChange}
            disabled={!selectedRegion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City/Municipality */}
        <div className="space-y-2">
          <Label htmlFor="city">City/Municipality *</Label>
          <Select 
            value={selectedCity} 
            onValueChange={handleCityChange}
            disabled={!selectedProvince}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select City/Municipality" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.code} value={city.code}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Barangay */}
        <div className="space-y-2">
          <Label htmlFor="barangay">Barangay *</Label>
          <Select 
            value={selectedBarangay} 
            onValueChange={handleBarangayChange}
            disabled={!selectedCity}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Barangay" />
            </SelectTrigger>
            <SelectContent>
              {barangays.map((barangay) => (
                <SelectItem key={barangay.code} value={barangay.code}>
                  {barangay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Optional fields in two columns */}
      {(showStreetAddress || showZipCode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street Address */}
          {showStreetAddress && (
            <div className="space-y-2">
              <Label htmlFor="street-address">Street Address</Label>
              <Input
                id="street-address"
                placeholder="House/Building number, Street name"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
              />
            </div>
          )}

          {/* Zip Code */}
          {showZipCode && (
            <div className="space-y-2">
              <Label htmlFor="zip-code">ZIP Code</Label>
              <Input
                id="zip-code"
                placeholder="ZIP Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={4}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format address as string
export function formatPhilippineAddress(address: PhilippineAddress): string {
  const parts = []
  
  if (address.streetAddress) parts.push(address.streetAddress)
  if (address.barangay) parts.push(address.barangay)
  if (address.city) parts.push(address.city)
  if (address.province) parts.push(address.province)
  if (address.region) parts.push(address.region)
  if (address.zipCode) parts.push(address.zipCode)
  
  return parts.join(", ")
}

// Helper function to validate if address is complete
export function isAddressComplete(address: PhilippineAddress): boolean {
  return !!(address.region && address.province && address.city && address.barangay)
}
