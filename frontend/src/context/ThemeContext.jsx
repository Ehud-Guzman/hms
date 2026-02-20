// src/core/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { theme as defaultTheme } from '../config/theme'
import settingsService from '../modules/settings/services/settingsService'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadBranding = useCallback(async () => {
    const hospitalId = localStorage.getItem('hospitalId')
    if (!hospitalId) return

    setLoading(true)
    try {
      const data = await settingsService.getBranding()
      setBranding(data.branding)
    } catch (error) {
      console.error('Failed to load branding:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranding()
    const handleHospitalChange = () => loadBranding()
    const handleBrandingUpdate = () => loadBranding()

    window.addEventListener('hospitalChanged', handleHospitalChange)
    window.addEventListener('brandingUpdated', handleBrandingUpdate)

    return () => {
      window.removeEventListener('hospitalChanged', handleHospitalChange)
      window.removeEventListener('brandingUpdated', handleBrandingUpdate)
    }
  }, [loadBranding])

  // Memoized color adjuster
  const adjustColor = useCallback((hex, percent) => {
    const amt = Math.round(2.55 * percent)
    const clamp = (val) => Math.min(255, Math.max(0, val))
    const num = parseInt(hex.slice(1), 16)
    const r = clamp((num >> 16) + amt)
    const g = clamp(((num >> 8) & 0x00FF) + amt)
    const b = clamp((num & 0x0000FF) + amt)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }, [])

  // Smoothly merge theme
  const mergedTheme = useMemo(() => ({
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: {
        DEFAULT: branding?.brandPrimaryColor || defaultTheme.colors.primary.DEFAULT,
        dark: branding?.brandPrimaryColor ? adjustColor(branding.brandPrimaryColor, -15) : defaultTheme.colors.primary.dark,
        light: branding?.brandPrimaryColor ? adjustColor(branding.brandPrimaryColor, 15) : defaultTheme.colors.primary.light,
        foreground: '#ffffff'
      },
      secondary: {
        DEFAULT: branding?.brandSecondaryColor || defaultTheme.colors.secondary.DEFAULT,
        dark: branding?.brandSecondaryColor ? adjustColor(branding.brandSecondaryColor, -15) : defaultTheme.colors.secondary.dark,
        light: branding?.brandSecondaryColor ? adjustColor(branding.brandSecondaryColor, 15) : defaultTheme.colors.secondary.light,
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
    density: branding?.density || defaultTheme.density || 'comfortable',
    transition: 'all 0.3s ease-in-out' // smooth theme transition
  }), [branding, adjustColor])

  const refreshBranding = useCallback(() => loadBranding(), [loadBranding])

  return (
    <ThemeContext.Provider value={{ theme: mergedTheme, refreshBranding }}>
      <div style={{ position: 'relative', transition: 'all 0.3s ease-in-out' }}>
        {children}

        {/* Non-blocking spinner top-right */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            width: '28px',
            height: '28px',
            border: '3px solid rgba(0,0,0,0.1)',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            zIndex: 9999,
            boxShadow: '0 0 6px rgba(0,0,0,0.1)'
          }} />
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          /* Optional: animate color/radius changes for any component */
          * {
            transition: background-color 0.3s ease, color 0.3s ease, border-radius 0.3s ease;
          }
        `}</style>
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context.theme
}

export const useRefreshBranding = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useRefreshBranding must be used within ThemeProvider')
  return context.refreshBranding
}
