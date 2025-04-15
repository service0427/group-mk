import plugin from 'tailwindcss/plugin';

export default plugin(({ addComponents }) => {
  addComponents({
    '.drawer': {
      'transition': 'transform 300ms ease',
      'position': 'fixed',
      'background-color': 'var(--tw-drawer-background-color)', 
      '&.open': {			
        'box-shadow': 'var(--tw-drawer-box-shadow)', 
        'transition': 'transform 300ms ease'
      },
    },
    '.drawer-start': {
      'top': '0',
      'bottom': '0',
      'inset-inline-start': '0',
      'inset-inline-end': 'auto',
      'transform': 'translateX(-100%)',
      '&.drawer.open': {
        'transform': 'translateX(0)'
      }
    },
    '.drawer-end': {
      'top': '0',
      'bottom': '0',
      'inset-inline-end': '0',
      'inset-inline-start': 'auto',
      'transform': 'translateX(100%)',
      '&.drawer.open': {
        'transform': 'translateX(0)'
      }
    },
    '.drawer-top': {
      'top': '0',
      'bottom': 'auto',
      'inset-inline-start': '0',
      'inset-inline-end': '0',
      'transform': 'translateY(-100%)',
      '&.drawer.open': {
        'transform': 'translateY(0)'
      }
    },
    '.drawer-bottom': {
      'bottom': '0',
      'top': 'auto',
      'inset-inline-start': '0',
      'inset-inline-end': '0',
      'transform': 'translateY(100%)',
      '&.drawer.open': {
        'transform': 'translateY(0)'
      }
    },
    '.drawer-backdrop': {
      'position': 'fixed',
      'inset': 0,
      'background-color': 'var(--tw-backdrop-background-color)'
    }
  });
});
