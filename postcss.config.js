export default {
  plugins: {
    'postcss-preset-env': {
      features: {
        'nesting-rules': false,
        'is-pseudo-class': false,
      },
    },
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-logical': {
      preserve: true, // Preserve logical properties and don't convert them
    },
  },
};