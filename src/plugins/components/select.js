import plugin from 'tailwindcss/plugin';
import svgToDataUri from 'mini-svg-data-uri';

export default plugin(({ addComponents, theme }) => {
  addComponents({
    '.select': {
      'display': 'block',
      'width': '100%',
      'appearance': 'none',
      'box-shadow': 'none',
      'outline': 'none',
      'background-repeat': 'no-repeat',
      'background-position': `right 0.675rem center`, // Logical property for RTL/LTR
      'background-size': '14px 11px',
      'background-image': `url("${svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="none" stroke="${theme('base.colors.gray.light.600')}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m2 5 6 6 6-6"/></svg>`)}")`,
      '.dark &': {
        'background-image': `url("${svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="none" stroke="${theme('base.colors.gray.dark.600')}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m2 5 6 6 6-6"/></svg>`)}")`,
      },
      '&[multiple], &[size]:not([size="1"])': {
        'padding-inline-end': `${theme('custom.components.btn.DEFAULT.px')}`, // Logical property for RTL/LTR
        'background-image': 'none',
      },
      '&:-moz-focusring': {
        'color': 'transparent',
        'text-shadow': 'none',
      },
      'font-weight': theme('custom.components.btn.DEFAULT.fontWeight'),
      'font-size': theme('custom.components.btn.DEFAULT.fontSize'),
      'line-height': '1',
      'background-color': 'var(--tw-light-active)',
      'border-radius': theme('custom.components.common.borderRadius.btn'),
      'height': theme('custom.components.btn.DEFAULT.height'),
      'padding-inline-start': theme('custom.components.input.DEFAULT.px'), // Logical property for RTL/LTR
      'padding-inline-end': theme('custom.components.input.DEFAULT.px'), // Logical property for RTL/LTR
      'border': '1px solid var(--tw-gray-300)',
      'color': 'var(--tw-gray-700)',
      '&:hover': {
        'border-color': 'var(--tw-gray-400)',
      },
      '&:focus': {
        'border-color': 'var(--tw-primary)',
        'box-shadow': 'var(--tw-input-focus-box-shadow)',
        'color': 'var(--tw-gray-700)',
        '&::placeholder': {
          'color': 'var(--tw-gray-600)',
        },
      },
      '&:active': {
        'color': 'var(--tw-gray-700)',
        '&::placeholder': {
          'color': 'var(--tw-gray-600)',
        },
        'box-shadow': 'none',
      },
      '&:disabled': {
        'background-color': 'var(--tw-gray-100)',
        'color': 'var(--tw-gray-400)',
        '&::placeholder': {
          'color': 'var(--tw-gray-300)',
        },
      },
    },
    '.select-sm': {
      'font-weight': theme('custom.components.btn.sm.fontWeight'),
      'font-size': theme('custom.components.btn.sm.fontSize'),
      'height': theme('custom.components.btn.sm.height'),
      'padding-inline-start': theme('custom.components.input.sm.px'), // Logical property for RTL/LTR
      'padding-inline-end': theme('custom.components.input.sm.px'), // Logical property for RTL/LTR
      'background-size': '14px 10px',
      'background-position': `inset-inline-end 0.55rem center`, // Logical property for RTL/LTR
    },
    '.select-lg': {
      'font-weight': theme('custom.components.btn.lg.fontWeight'),
      'font-size': theme('custom.components.btn.lg.fontSize'),
      'height': theme('custom.components.btn.lg.height'),
      'padding-inline-start': theme('custom.components.input.lg.px'), // Logical property for RTL/LTR
      'padding-inline-end': theme('custom.components.input.lg.px'), // Logical property for RTL/LTR
      'background-size': '14px 12px',
      'background-position': `inset-inline-end 0.75rem center`, // Logical property for RTL/LTR
    },
    '[dir=rtl]': {
      '.select': {
       'background-position': `left 0.675rem center`, // Logical property for RTL/LTR
      }
    }
  });
});
