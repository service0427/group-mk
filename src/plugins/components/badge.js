import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Base
  addComponents({
    '.badge': {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'line-height': '1',
      'border-radius': theme('custom.components.common.borderRadius.badge'),
      'padding': '0.5rem 0.5rem',
      'border': '1px solid transparent',
      'font-weight': theme('fontWeight.medium'),
      'font-size': '0.6875rem',
      '&.badge-pill': {
        'border-radius': '1.875rem',
        'padding-inline-start': '0.625rem', // Logical property for RTL/LTR
        'padding-inline-end': '0.625rem' // Logical property for RTL/LTR
      }
    },
    '.badge-dot': {
      'padding': '0',
      'border-radius': '50%'
    },
    '.badge-circle': {
      'padding': '0',
      'border-radius': '50%',
      'flex-shrink': '0',
      'line-height': '0'
    },
    '.badge-xs': {
      'font-size': '0.625rem',
      'padding': '0.1875rem 0.3125rem',
      '&.badge-pill': {
        'padding-inline-start': '0.25rem', // Logical property for RTL/LTR
        'padding-inline-end': '0.25rem' // Logical property for RTL/LTR
      }
    },
    '.badge-sm': {
      'padding': '0.3125rem 0.375rem',
      '&.badge-pill': {
        'padding-inline-start': '0.375rem', // Logical property for RTL/LTR
        'padding-inline-end': '0.375rem' // Logical property for RTL/LTR
      }
    },
    '.badge-lg': {
      'padding': '0.5625rem 0.6875rem',
      'font-size': '0.8125rem',
      '&.badge-pill': {
        'padding-inline-start': '0.6875rem', // Logical property for RTL/LTR
        'padding-inline-end': '0.6875rem' // Logical property for RTL/LTR
      }
    }
  });

  // Default option
  addComponents({
    '.badge': {
      'color': 'var(--tw-gray-700)',
      'border-color': 'transparent',
      'background-color': 'var(--tw-gray-200)',
    },
    '.badge-outline': {
      'color': 'var(--tw-gray-600)',
      'border-color': 'var(--tw-gray-300)',
      'background-color': 'var(--tw-gray-100)',
    }
  });

  // Color options
  const colors = ['primary', 'success', 'danger', 'warning', 'info', 'dark'];

  colors.forEach((color) => {
    addComponents({
      [`.badge-${color}`]: {
        'color': theme('colors.white'),
        'background-color': `var(--tw-${color})`
      },
      [`.badge-outline.badge-${color}`]: {
        'color': `var(--tw-${color})`,
        'background-color': `var(--tw-${color}-light)`,
        'border-color': `var(--tw-${color}-clarity)`
      }
    });
  });
});
