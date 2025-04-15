import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents, theme }) => {
  // Fixed
  addComponents({
    '.container-fixed': {
      'flex-grow': '1',
      'width': '100%',
      'padding-inline-start': theme('custom.components.container.fixed.px.DEFAULT'), // Logical property for LTR/RTL
      'padding-inline-end': theme('custom.components.container.fixed.px.DEFAULT'),   // Logical property for LTR/RTL
    },
    [`@media (min-width: ${theme('screens.xl')})`]: {
      '.container-fixed': {
        'margin-inline-start': 'auto',  // Logical property for LTR/RTL
        'margin-inline-end': 'auto',    // Logical property for LTR/RTL
        'padding-inline-start': theme('custom.components.container.fixed.px.xl'),  // Logical property for LTR/RTL
        'padding-inline-end': theme('custom.components.container.fixed.px.xl'),    // Logical property for LTR/RTL
        'max-width': theme('custom.components.container.fixed')['max-width'],
      },
    },
  });

  // Fluid
  addComponents({
    '.container-fluid': {
      'width': '100%',
      'flex-grow': '1',
      'padding-inline-start': theme('custom.components.container.fluid.px.DEFAULT'), // Logical property for LTR/RTL
      'padding-inline-end': theme('custom.components.container.fluid.px.DEFAULT'),   // Logical property for LTR/RTL
    },
    [`@media (min-width: ${theme('screens.xl')})`]: {
      '.container-fluid': {
        'padding-inline-start': theme('custom.components.container.fluid.px.xl'),   // Logical property for LTR/RTL
        'padding-inline-end': theme('custom.components.container.fluid.px.xl'),     // Logical property for LTR/RTL
      },
    },
  });
});
