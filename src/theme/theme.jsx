import WorkSansTTF from '../assets/fonts/WorkSans-VariableFont_wght.ttf';

const WorkSans = {
  fontFamily: 'Work Sans Thin',
  fontStyle: 'normal',
  fontDisplay: 'swap',
  fontWeight: 400,
  src: `
    local('Work Sans Thin'),
    local('Work Sans Thin'),
    url(${WorkSansTTF}) format('truetype')
  `,
  unicodeRange:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF',
};

export const colors = {
  black: "#000000",
  white: "#FFFFFF",
  lightGray: "#ecf0f8",
  text: "#212529",
  blue: "#1965e9",
  lightBlue: "#2F80ED",
  topaz: "#0b8f92",
  pink: "#DC6BE5",
  inputBackground: "#f8f9fa",
  red: "#f44336",
  orange: 'orange',
  darkGray: "rgba(43,57,84,.5)",
  lightBlack: "#6a6a6a",
  green: '#1abc9c',
};

const fantomTheme =  {
  type: 'light',
  palette: {
    primary: {
      main: colors.blue
    },
    secondary: {
      main: colors.topaz
    },
    text: {
      primary: colors.text,
      secondary: colors.text
    }
  },
  typography: {
    fontFamily: [
      '"Work Sans Thin"',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '48px',
      fontWeight: '600',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      lineHeight: 1.2
    },
    h2: {
      fontSize: '36px',
      fontWeight: '600',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      lineHeight: 1.2
    },
    h3: {
      fontSize: '24px',
      fontWeight: '600',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      lineHeight: 1.2
    },
    h4: {
      fontSize: '16px',
      fontWeight: '600',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      lineHeight: 1.2
    },
    h5: {
      fontSize: '14px',
      fontWeight: '600',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      lineHeight: 1.2
    },
    body1: {
      fontSize: '16px',
      fontWeight: '300',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    body2: {
      fontSize: '16px',
      fontWeight: '300',
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [WorkSans],
      },
    },
    MuiSelect: {
      select: {
        padding: '9px'
      },
      selectMenu: {
        minHeight: '30px',
        display: 'flex',
        alignItems: 'center'
      }
    },
    MuiButton: {
      root: {
        borderRadius: '30px',
        padding: '10px 24px'
      },
      outlined: {
        padding: '10px 24px',
        borderWidth: '2px !important'
      },
      text: {
        padding: '10px 24px'
      },
      label: {
        textTransform: 'none',
        fontSize: '1rem'
      }
    },
    MuiInputBase: {
      input: {
        fontSize: '16px',
        fontWeight: '600',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        lineHeight: 1.2
      }
    },
    MuiOutlinedInput: {
      input: {
        "&::placeholder": {
          color: colors.text
        },
        color: colors.text,
        padding: '14px',
        borderRadius: '30px'
      },
      root: {
        // border: "none !important",
        borderRadius: '30px'
      },
      notchedOutline: {
        // border: "none !important"
      }
    },
    MuiSnackbar : {
      root: {
        maxWidth: 'calc(100vw - 24px)'
      },
      anchorOriginBottomLeft: {
        bottom: '12px',
        left: '12px',
        '@media (min-width: 960px)': {
          bottom: '50px',
          left: '80px'
        }
      }
    },
    MuiSnackbarContent: {
      root: {
        backgroundColor: colors.white,
        padding: '0px',
        minWidth: 'auto',
        '@media (min-width: 960px)': {
          minWidth: '500px',
        }
      },
      message: {
        padding: '0px'
      },
      action: {
        marginRight: '0px'
      }
    },
  }
};

export default fantomTheme;
