import { useTheme } from '../../context/ThemeContext'

export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const theme = useTheme()
  
  const variants = {
    primary: {
      bg: theme.colors.primary.DEFAULT,
      hover: theme.colors.primary.dark,
      text: theme.colors.primary.foreground
    },
    secondary: {
      bg: theme.colors.secondary.DEFAULT,
      hover: theme.colors.secondary.dark,
      text: theme.colors.secondary.foreground
    },
    accent: {
      bg: theme.colors.accent.DEFAULT,
      hover: theme.colors.accent.dark,
      text: theme.colors.accent.foreground
    },
    danger: {
      bg: theme.colors.danger.DEFAULT,
      hover: theme.colors.danger.dark,
      text: theme.colors.danger.foreground
    },
    outline: {
      bg: 'transparent',
      hover: theme.colors.gray[100],
      text: theme.colors.gray[700],
      border: theme.colors.gray[300]
    },
    ghost: {
      bg: 'transparent',
      hover: theme.colors.gray[100],
      text: theme.colors.gray[700]
    }
  }

  const sizes = {
    sm: {
      px: theme.spacing[3],
      py: theme.spacing[1.5],
      fontSize: theme.fonts.sizes.sm
    },
    md: {
      px: theme.spacing[4],
      py: theme.spacing[2],
      fontSize: theme.fonts.sizes.base
    },
    lg: {
      px: theme.spacing[6],
      py: theme.spacing[3],
      fontSize: theme.fonts.sizes.lg
    }
  }

  const variantStyle = variants[variant]
  const sizeStyle = sizes[size]

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    fontWeight: theme.fonts.weights.medium,
    transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: variant === 'outline' ? `1px solid ${variantStyle.border}` : 'none',
    backgroundColor: variantStyle.bg,
    color: variantStyle.text,
    padding: `${sizeStyle.py} ${sizeStyle.px}`,
    fontSize: sizeStyle.fontSize
  }

  const hoverStyle = !disabled ? {
    backgroundColor: variantStyle.hover,
    ...(variant === 'outline' && {
      backgroundColor: variantStyle.hover,
      borderColor: variantStyle.hover
    })
  } : {}

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...hoverStyle }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}