 
import plugin from 'tailwindcss/plugin';

export default plugin(({addComponents}) => {
	addComponents({
		'.btn-group': {
			'display': 'flex',
			'align-items': 'stretch',
			'.btn + .btn': {
				'border-top-inline-start-radius': '0', 
				'border-bottom-inline-start-radius': '0',
				'border-inline-start': '0'
			},
			'.btn:has(+ .btn)': {
				'border-top-inline-end-radius': '0',
				'border-bottom-inline-end-radius': '0'
			}
		}
	});
});