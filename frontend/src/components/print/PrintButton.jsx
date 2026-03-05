import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const PrintButton = ({ label = "Print", ...props }) => {
  const theme = useTheme();

  const handlePrint = () => {
    window.print();
  };

  const buttonStyle = {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    backgroundColor: theme.colors.secondary.DEFAULT,
    color: 'white',
    border: 'none',
    borderRadius: theme.radius.md,
    fontSize: theme.fonts.sizes.sm,
    cursor: 'pointer',
  };

  return (
    <button style={buttonStyle} onClick={handlePrint} {...props}>
      {label}
    </button>
  );
};

export default PrintButton;