import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Base
  addComponents({
    '.card': {
      display: 'flex',
      'flex-direction': 'column',
      'box-shadow': 'var(--tw-card-box-shadow)',
      'background-color': 'var(--tw-card-background-color)',
      'border-radius': theme('custom.components.common.borderRadius.card'),
      border: 'var(--tw-card-border)',
    },
    '.card-title': {
      'font-size': theme('fontSize.base'),
      'line-height': theme('fontSize.base.1.lineHeight'),
      'font-weight': theme('fontWeight.semibold'),
      color: 'var(--tw-gray-900)',
    },
    '.card-header': {
      display: 'flex',
      'min-height': '56px',
      'align-items': 'center',
      'justify-content': 'space-between',
      'border-bottom': 'var(--tw-card-border)',
      'padding-inline-start': theme('custom.components.card.px'),
      'padding-inline-end': theme('custom.components.card.px'),
      'padding-top': theme('custom.components.card.py.header'),
      'padding-bottom': theme('custom.components.card.py.header'),
    },
    '.card-body': {
      'flex-grow': '1',
      'padding-inline-start': theme('custom.components.card.px'),
      'padding-inline-end': theme('custom.components.card.px'),
      'padding-top': theme('custom.components.card.py.body'),
      'padding-bottom': theme('custom.components.card.py.body'),
    },
    '.card-footer': {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'border-top': 'var(--tw-card-border)',
      'padding-inline-start': theme('custom.components.card.px'),
      'padding-inline-end': theme('custom.components.card.px'),
      'padding-top': theme('custom.components.card.py.footer'),
      'padding-bottom': theme('custom.components.card.py.footer'),
    },
    '.card-table': {
      table: {
        'th:first-child, td:first-child': {
          'padding-inline-start': theme('custom.components.card.px'),
        },
        'th:last-child, td:last-child': {
          'padding-inline-end': theme('custom.components.card.px'),
        },
        '&.table-border': {
          border: '0',
        },
      },
    },
    '.card-group': {
      'padding-inline-start': theme('custom.components.card.px'),
      'padding-inline-end': theme('custom.components.card.px'),
      'padding-top': theme('custom.components.card.py.group'),
      'padding-bottom': theme('custom.components.card.py.group'),
      'border-bottom': 'var(--tw-card-border)',
      '&:last-child': {
        'border-bottom': '0',
      },
      '& + .card-footer': {
        'border-top': '0',
      },
    },
  });

  // Border radius (Updated to logical properties)
  addComponents({
    '.table': {
      'th:first-child': {
        'border-start-start-radius': theme('custom.components.common.borderRadius.card'), // Logical property for top-left in LTR and top-right in RTL
      },
      'th:last-child': {
        'border-start-end-radius': theme('custom.components.common.borderRadius.card'), // Logical property for top-right in LTR and top-left in RTL
      },
    },
    '.card-header + .card-body, .card-header + .card-table': {
      table: {
        'th:first-child, th:last-child': {
          'border-radius': '0',
        },
      },
    },
  });

  // Grid
  addComponents({
    '.card-grid': {
      '.card-header, .card-footer': {
        'padding-inline-start': theme('custom.components.card.grid.px'),
        'padding-inline-end': theme('custom.components.card.grid.px'),
      },
      '.card-body': {
        padding: '0',
        '.table': {
          border: '0',
          'th:first-child, td:first-child': {
            'padding-inline-start': theme('custom.components.card.grid.px'),
            '&.table-cell-center': {
              'padding-inline-end': theme('custom.components.card.grid.px'),
            },
          },
          'th:last-child, td:last-child': {
            'padding-inline-end': theme('custom.components.card.grid.px'),
            '&.table-cell-center': {
              'padding-inline-start': theme('custom.components.card.grid.px'),
            },
          },
        },
      },
    },
  });

  // Utilities (Updated border-radius with logical properties)
  addComponents({
    '.card-border': {
      border: 'var(--tw-card-border)',
    },
    '.card-rounded': {
      'border-radius': theme('custom.components.common.borderRadius.card'),
      '&.table': {
        'border-collapse': 'separate',
        'border-spacing': '0',
      },
    },
    '.card-rounded-b': {
      'border-end-start-radius': theme('custom.components.common.borderRadius.card'), // Logical property for bottom-left in LTR and bottom-right in RTL
      'border-end-end-radius': theme('custom.components.common.borderRadius.card'), // Logical property for bottom-right in LTR and bottom-left in RTL
    },
    '.card-rounded-bs': {
      'border-end-start-radius': theme('custom.components.common.borderRadius.card'),
    },
    '.card-rounded-be': {
      'border-end-end-radius': theme('custom.components.common.borderRadius.card'),
    },
    '.card-rounded-t': {
      'border-start-start-radius': theme('custom.components.common.borderRadius.card'),
      'border-start-end-radius': theme('custom.components.common.borderRadius.card'),
    },
    '.card-rounded-ts': {
      'border-start-start-radius': theme('custom.components.common.borderRadius.card'),
    },
    '.card-rounded-te': {
      'border-start-end-radius': theme('custom.components.common.borderRadius.card'),
    },
  });
});
