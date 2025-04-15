import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents }) => {
  // Form input
  addComponents({
    '.input-group': {
      'display': 'flex',
      'align-items': 'stretch',
      '.btn': {
        'flex-shrink': '0',
      },
      '.input': {
        'flex-grow': '1',
      },
      '.input ~ .btn, .input ~ .dropdown > .btn': {
        'border-start-start-radius': '0',
        'border-end-start-radius': '0',
      },
      '.input + .btn, .input + .dropdown > .btn': {
        'border-inline-start': '0',
      },
      '.btn ~ .input, .btn ~ .btn, .input ~ .input': {
        'border-start-start-radius': '0',
        'border-end-start-radius': '0',
      },
      '.input:has(~ .btn), .input:has(~ .input), .input:has(~ .dropdown > .btn)': {
        'border-start-end-radius': '0',
        'border-end-end-radius': '0',
      },
      '.btn:has(~ .input, ~ .btn), .input:has(~ .input)': {
        'border-start-end-radius': '0',
        'border-end-end-radius': '0',
        'border-inline-end': '0',
      },
    },
  });
});
