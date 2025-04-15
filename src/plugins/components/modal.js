import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Base
  addComponents({
    '.modal': {				
      'width': '100%',
      'display': 'none',
      'opacity': '0',
      'position': 'fixed',
      'overflow': 'auto',
      'inset': '0',
      'padding': theme('spacing.5'),
      'transition': 'opacity 300ms ease',
      '&.open': {
        'opacity': '1',
        'transition': 'opacity 300ms ease',
      },
    },
    '.modal-content': {		
      'position': 'relative',
      'margin-left': 'auto',
      'margin-right': 'auto',
      'border-radius': theme('custom.components.common.borderRadius.modal'),
      'box-shadow': 'var(--tw-modal-box-shadow)', 
      'background-color': 'var(--tw-modal-background-color)', 
      'display': 'flex',
      'flex-direction': 'column',
      'outline': 'none',
    },
    '.modal-header': {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'border-bottom': '1px solid var(--tw-gray-200)',
      'padding-inline-start': theme('spacing')['5'],
      'padding-inline-end': theme('spacing')['5'],
      'padding-block-start': theme('spacing')['2.5'],
      'padding-block-end': theme('spacing')['2.5'],
    },
    '.modal-title': {
      'font-size': theme('fontSize.sm'),
      'line-height': theme('fontSize.sm.1.lineHeight'),
      'font-weight': theme('fontWeight.semibold'),
      'color': 'var(--tw-gray-900)',
    },
    '.modal-body': {
      'padding-inline-start': theme('spacing')['5'],
      'padding-inline-end': theme('spacing')['5'],
      'padding-block-start': theme('spacing')['2.5'],
      'padding-block-end': theme('spacing')['2.5'],
      'outline': 'none',
    },
    '.modal-footer': {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'border-top': '1px solid var(--tw-gray-200)',
      'padding-inline-start': theme('spacing')['5'],
      'padding-inline-end': theme('spacing')['5'],
      'padding-block-start': theme('spacing')['2.5'],
      'padding-block-end': theme('spacing')['2.5'],
    },
    '.modal-table': {
      '.table': {
        'th:first-child, td:first-child': {
          'padding-inline-start': theme('spacing')['5'],
        },
        'th:last-child, td:last-child': {
          'padding-inline-end': theme('spacing')['5'],
        },
      },
    },
    '.modal-backdrop': {
      'position': 'fixed',
      'inset': 0,
      'background-color': 'var(--tw-backdrop-background-color)',
    },
  });

  // Utilities
  addComponents({
    '.modal-dialog': {
      'inset': 'auto',
    },
    '.modal-overlay': {
      'inset': '0',
      'height': '100%',
    },
    '.modal-center': {
      'left': '50%',
      'top': '50%',
      'margin-left': '0',
      'margin-right': '0',
      'transform': 'translate(-50%, -50%)',
    },
    '.modal-center-y': {
      'top': '50%',
      'transform': 'translateY(-50%)',
    },
    '.modal-center-x': {
      'inset-inline-start': '50%',
      'transform': 'translateX(-50%)',
    },
    '.modal-rounded-t': {
      'border-start-start-radius': theme('custom.components.common.borderRadius.modal'),
      'border-start-end-radius': theme('custom.components.common.borderRadius.modal'),
    },
    '.modal-rounded-b': {
      'border-end-start-radius': theme('custom.components.common.borderRadius.modal'),
      'border-end-end-radius': theme('custom.components.common.borderRadius.modal'),
    }
  });

  // RTL
  addComponents({
    '[dir=rtl]': {
      '.modal-center': {
        'left': 'auto',
        'right': '50%',
        'transform': 'translate(50%, -50%)',
      }
    }
  });
});
