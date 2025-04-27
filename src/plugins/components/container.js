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

  // Full Width (모바일 지원 추가)
  addComponents({
    '.container-full-width': {
      'width': '100%',
      'flex-grow': '1',
      'padding-inline-start': '0.75rem', // 모바일에서 더 작은 패딩
      'padding-inline-end': '0.75rem',   // 모바일에서 더 작은 패딩
    },
    [`@media (min-width: ${theme('screens.md')})`]: {
      '.container-full-width': {
        'padding-inline-start': '1rem',   // 태블릿에서 패딩 증가
        'padding-inline-end': '1rem',     // 태블릿에서 패딩 증가
      },
    },
    [`@media (min-width: ${theme('screens.xl')})`]: {
      '.container-full-width': {
        'margin-inline-start': 'auto',    // 자동 마진 유지
        'margin-inline-end': 'auto',      // 자동 마진 유지
        'padding-inline-start': '1.25rem', // 큰 화면에서 여백 약간 증가
        'padding-inline-end': '1.25rem',   // 큰 화면에서 여백 약간 증가
        'max-width': '95%',               // 최대 너비 95%로 설정
      },
    },
  });
});
