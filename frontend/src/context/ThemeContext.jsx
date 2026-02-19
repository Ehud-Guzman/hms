// src/core/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { theme as defaultTheme } from '../config/theme'
import settingsService from '../modules/settings/services/settingsService'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadBranding = useCallback(async () => {
    const hospitalId = localStorage.getItem('hospitalId')
    if (!hospitalId) {
      setLoading(false)
      return
    }
    try {
      const data = await settingsService.getBranding() // uses interceptor header
      setBranding(data.branding)
    } catch (error) {
      console.error('Failed to load branding:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranding()

    const handleHospitalChange = () => {
      loadBranding()
    }
    window.addEventListener('hospitalChanged', handleHospitalChange)

    const handleBrandingUpdate = () => {
      loadBranding()
    }
    window.addEventListener('brandingUpdated', handleBrandingUpdate)

    return () => {
      window.removeEventListener('hospitalChanged', handleHospitalChange)
      window.removeEventListener('brandingUpdated', handleBrandingUpdate)
    }
  }, [loadBranding])

  // Helper to lighten/darken a hex color (simple version)
  function adjustColor(hex, percent) {
    const amt = Math.round(2.55 * percent)
    const clamp = (val) => Math.min(255, Math.max(0, val))
    const num = parseInt(hex.slice(1), 16)
    const r = clamp((num >> 16) + amt)
    const g = clamp(((num >> 8) & 0x00FF) + amt)
    const b = clamp((num & 0x0000FF) + amt)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  const mergedTheme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: {
        DEFAULT: branding?.brandPrimaryColor || defaultTheme.colors.primary.DEFAULT,
        dark: branding?.brandPrimaryColor 
          ? adjustColor(branding.brandPrimaryColor, -15) 
          : defaultTheme.colors.primary.dark,
        light: branding?.brandPrimaryColor 
          ? adjustColor(branding.brandPrimaryColor, 15) 
          : defaultTheme.colors.primary.light,
        foreground: '#ffffff'
      },
      secondary: {
        DEFAULT: branding?.brandSecondaryColor || defaultTheme.colors.secondary.DEFAULT,
        dark: branding?.brandSecondaryColor 
          ? adjustColor(branding.brandSecondaryColor, -15) 
          : defaultTheme.colors.secondary.dark,
        light: branding?.brandSecondaryColor 
          ? adjustColor(branding.brandSecondaryColor, 15) 
          : defaultTheme.colors.secondary.light,
        foreground: '#ffffff'
      }
    },
    radius: {
      ...defaultTheme.radius,
      DEFAULT: branding?.radius === 'none' ? '0' :
                branding?.radius === 'sm' ? '0.25rem' :
                branding?.radius === 'md' ? '0.5rem' :
                branding?.radius === 'lg' ? '0.75rem' :
                branding?.radius === 'xl' ? '1rem' : defaultTheme.radius.DEFAULT
    },
    themeMode: branding?.themeKey || defaultTheme.themeKey || 'light',
    density: branding?.density || defaultTheme.density || 'comfortable'
  }

  const refreshBranding = useCallback(() => {
    loadBranding()
  }, [loadBranding])

  if (loading) return null // or spinner

  return (
    <ThemeContext.Provider value={{ theme: mergedTheme, refreshBranding }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context.theme
}

export const useRefreshBranding = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useRefreshBranding must be used within ThemeProvider')
  }
  return context.refreshBranding
}