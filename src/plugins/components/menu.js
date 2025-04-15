import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Menu dropdown
  addComponents({
    '.menu-dropdown': {
      'gap': '0.125rem',
      'border': 'var(--tw-dropdown-border)',
      'box-shadow': 'var(--tw-dropdown-box-shadow)',
      'background-color': 'var(--tw-dropdown-background-color)',
      'border-radius': theme('custom.components.common.borderRadius.dropdown'),
    },
  });

  // Menu default
  addComponents({
    '.menu-default': {
      'padding-top': theme('spacing')['2.5'],
      'padding-bottom': theme('spacing')['2.5'],
      '.menu-link, .menu-label': {
        'margin-inline-start': theme('spacing')['2.5'],
        'margin-inline-end': theme('spacing')['2.5'],
        'padding': theme('spacing')['2.5'],
        'border-radius': theme('borderRadius.md'),
      },
      '.menu-title': {
        'font-size': theme('fontSize.2sm'),
        'line-height': theme('fontSize.2sm.1.lineHeight'),
        'font-weight': theme('fontWeight.medium'),
      },
      '.menu-icon': {
        'margin-inline-end': theme('spacing')['2.5'],
        'i': {
          'font-size': theme('fontSize.lg'),
        },
      },
      '.menu-bullet': {
        'margin-inline-end': theme('spacing')['2.5'],
      },
      '.menu-arrow': {
        'margin-inline-start': theme('spacing')['2'],
        'i': {
          'font-size': theme('fontSize.2xs'),
        },
      },
      '.menu-badge': {
        'margin-inline-start': theme('spacing')['2.5'],
      },
      '.menu-separator': {
        'border-bottom': 'var(--tw-dropdown-border)',
        'margin-top': theme('spacing')['2.5'],
        'margin-bottom': theme('spacing')['2.5'],
      },
      '.menu-accordion:not(.menu-no-indent)': {
        '.menu-item > .menu-link, .menu-item > .menu-label': {
          'margin-inline-start': theme('spacing')['5'],
        },
        '.menu-item > .menu-accordion .menu-item > .menu-link, .menu-item > .menu-accordion .menu-item > .menu-label': {
          'margin-inline-start': theme('spacing')['8'],
        },
        '.menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-link, .menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-label': {
          'margin-inline-start': theme('spacing')['11'],
        },
        '.menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-link, .menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-accordion .menu-item > .menu-label': {
          'margin-inline-start': theme('spacing')['14'],
        }
      },
    },
    '.menu-fit': {
      'padding-top': '0',
      'padding-bottom': '0',
      '.menu-link, .menu-label': {
        'margin-inline-start': '0',
        'margin-inline-end': '0',
      },
    },
    '.menu-space': {
      'padding-top': theme('spacing')['2.5'],
      'padding-bottom': theme('spacing')['2.5'],
      '.menu-link, .menu-label': {
        'margin-inline-start': theme('spacing')['2.5'],
        'margin-inline-end': theme('spacing')['2.5'],
      },
    },
  });

  // Menu theming
  addComponents({
    '.menu-default': {
      '.menu-item': {
        '.menu-title': {
          'color': 'var(--tw-gray-800)',
        },
        '.menu-icon i': {
          'color': 'var(--tw-gray-500)',
        },
        '.menu-arrow i': {
          'color': 'var(--tw-gray-500)',
        },
        '.menu-link:hover, .menu-label:hover': {
          '.menu-title': {
            'color': 'var(--tw-gray-900)',
          },
          '.menu-icon i': {
            'color': 'var(--tw-primary)',
          },
        },
        '&.active, &.show, &.here, &.focus': {
          '> .menu-link, > .menu-label': {
            '.menu-title': {
              'color': 'var(--tw-gray-900)',
            },
            '.menu-icon i': {
              'color': 'var(--tw-primary)',
            },
          },
        },
        '&.active, &.here': {
          '> .menu-link, > .menu-label': {
            'background-color': 'var(--tw-gray-100)',
            '.dark &': {
              'background-color': 'var(--tw-coal-300)',
            },
          },
        },
        '& > .menu-link:hover, & > .menu-label:hover': {
          'background-color': 'var(--tw-gray-100)',
          '.dark &': {
            'background-color': 'var(--tw-coal-300)',
          },
        },
        '&.disabled': {
          '> .menu-link, > .menu-label': {
            'opacity': '0.5',
          },
        },
      },
    },
  });
});
