import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Form input
  addComponents({
    '.file-input': {
      'display': 'block',
      'width': '100%',
      'appearance': 'none',
      'box-shadow': 'none',
      'outline': 'none',
      'font-weight': theme('custom.components.btn.DEFAULT.fontWeight'),
      'font-size': theme('custom.components.btn.DEFAULT.fontSize'),
      'line-height': '1',
      'background-color': 'var(--tw-light-active)',
      'border-radius': theme('custom.components.common.borderRadius.btn'),
      'height': theme('custom.components.btn.DEFAULT.height'),
      'padding': '0',
      'padding-inline-end': theme('custom.components.btn.DEFAULT.px'),
      'border': '1px solid var(--tw-gray-300)',
      'color': 'var(--tw-gray-700)',
      '&::placeholder': {
        'color': 'var(--tw-gray-500)',
      },
      '&::file-selector-button': {
        'color': 'var(--tw-gray-600)',
        'height': '100%',
        'appearance': 'none',
        'padding-inline-start': theme('custom.components.btn.DEFAULT.px'),
        'padding-inline-end': theme('custom.components.btn.DEFAULT.px'),
        'margin-inline-end': theme('custom.components.btn.DEFAULT.px'),
        'outline': 'none',
        'background-color': 'transparent',
        'border-start-start-radius': theme('custom.components.common.borderRadius.btn'),
        'border-end-start-radius': theme('custom.components.common.borderRadius.btn'),
        'border': '0',
        'border-inline-end': '1px solid var(--tw-gray-300)',
        'box-shadow': 'none',
      },
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
    '.file-input-sm': {
      'font-weight': theme('custom.components.btn.sm.fontWeight'),
      'font-size': theme('custom.components.btn.sm.fontSize'),
      'height': theme('custom.components.btn.sm.height'),
      'padding-inline-end': theme('custom.components.btn.sm.px'),
      '&::file-selector-button': {
        'padding-inline-start': theme('custom.components.btn.sm.px'),
        'padding-inline-end': theme('custom.components.btn.sm.px'),
      },
    },
    '.file-input-lg': {
      'font-weight': theme('custom.components.btn.lg.fontWeight'),
      'font-size': theme('custom.components.btn.lg.fontSize'),
      'height': theme('custom.components.btn.lg.height'),
      'padding-inline-end': theme('custom.components.btn.lg.px'),
      '&::file-selector-button': {
        'padding-inline-start': theme('custom.components.btn.lg.px'),
        'padding-inline-end': theme('custom.components.btn.lg.px'),
      },
    },
  });
});
