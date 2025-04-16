// src/plugins/shadcn-ui.js
const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addUtilities }) {
  addUtilities({
    '.bg-background': {
      'background-color': 'hsl(var(--background))'
    },
    '.text-foreground': {
      'color': 'hsl(var(--foreground))'
    },
    '.border-border': {
      'border-color': 'hsl(var(--border))'
    },
    '.bg-accent': {
      'background-color': 'hsl(var(--accent))'
    },
    '.text-accent-foreground': {
      'color': 'hsl(var(--accent-foreground))'
    },
    '.border-input': {
      'border-color': 'hsl(var(--input))'
    },
    '.ring-ring': {
      '--tw-ring-color': 'hsl(var(--ring))'
    },
    '.ring-offset-background': {
      '--tw-ring-offset-color': 'hsl(var(--background))'
    },
    '.text-muted-foreground': {
      'color': 'hsl(var(--muted-foreground))'
    }
  });
});