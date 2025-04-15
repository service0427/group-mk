import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  addComponents({
    '.rating': {
      'display': 'inline-flex',
      'align-items': 'stretch',
      'input': {
        'appearance': 'none',
        'position': 'absolute',
        'inset-inline-start': '9999px',  // Logical property for RTL/LTR
        '&[disabled]': {
          'display': 'none',
        },
      },
    },
    '.rating-on': {
      'color': 'var(--tw-warning)',
    },
    '.rating-off': {
      'color': 'var(--tw-gray-400)',
    },
    '.rating-label': {
      'display': 'inline-flex',
      'align-items': 'center',
      '.rating-on': {
        'display': 'none',
      },
      '.rating-off': {
        'display': 'inline-flex',
      },
    },
    '.rating:hover label.rating-label, label.rating-label, label.rating-label.checked, div.rating-label.checked': {
      '.rating-on': {
        'display': 'inline-flex',
      },
      '.rating-off': {
        'display': 'none',
      },
    },
    'label.rating-label:hover ~ label.rating-label, .rating-input:checked ~ .rating-label': {
      '.rating-on': {
        'display': 'none',
      },
      '.rating-off': {
        'display': 'inline-flex',
      },
    },
    '.rating-label.indeterminate': {
      'position': 'relative',
      '.rating-on': {
        'display': 'inline-flex',
        'position': 'absolute',
        'z-index': '1',
        'overflow': 'hidden',
        'inset-inline-start': '0',  // Logical property for RTL/LTR
      },
      '.rating-off': {
        'display': 'inline-flex',
      },
    },
    'label.rating-label': {
      'cursor': 'pointer',
    },
  });
});
