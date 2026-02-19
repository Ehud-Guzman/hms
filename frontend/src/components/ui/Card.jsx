import { useTheme } from '../../context/ThemeContext'

export const Card = ({ children, padding = 'md', noShadow = false, className = '', ...props }) => {
  const theme = useTheme()
  
  const paddings = {
    none: theme.spacing[0],
    sm: theme.spacing[3],
    md: theme.spacing[5],
    lg: theme.spacing[8]
  }

  const style = {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: paddings[padding],
    boxShadow: noShadow ? 'none' : theme.shadows.DEFAULT,
    border: `1px solid ${theme.colors.gray[200]}`
  }

  return (
    <div style={style} className={className} {...props}>
      {children}
    </div>
  )
}