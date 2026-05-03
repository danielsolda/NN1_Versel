import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
					surface: {
						hover: 'hsl(var(--surface-hover))',
						'hover-foreground': 'hsl(var(--surface-hover-foreground))',
						'hover-border': 'hsl(var(--surface-hover-border))',
						active: 'hsl(var(--surface-active))',
						'active-foreground': 'hsl(var(--surface-active-foreground))',
						'active-border': 'hsl(var(--surface-active-border))'
					},
				palette: {
					blue: 'hsl(var(--palette-blue))',
					green: 'hsl(var(--palette-green))',
					red: 'hsl(var(--palette-red))',
					yellow: 'hsl(var(--palette-yellow))',
					amber: 'hsl(var(--palette-amber))',
					orange: 'hsl(var(--palette-orange))',
					purple: 'hsl(var(--palette-purple))',
					pink: 'hsl(var(--palette-pink))',
					slate: 'hsl(var(--palette-slate))',
					protein: 'hsl(var(--palette-protein))',
					carbs: 'hsl(var(--palette-carbs))',
					fat: 'hsl(var(--palette-fat))',
					calories: 'hsl(var(--palette-calories))',
					fiber: 'hsl(var(--palette-fiber))',
					sodium: 'hsl(var(--palette-sodium))',
					whatsapp: 'hsl(var(--palette-whatsapp))',
					'whatsapp-hover': 'hsl(var(--palette-whatsapp-hover))'
				},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Space Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		boxShadow: {
			DEFAULT: 'none',
			'2xs': 'none',
			xs: 'none',
			sm: 'none',
			md: 'none',
			lg: 'none',
			xl: 'none',
			'2xl': 'none'
  		}
  	}
  },
	plugins: [tailwindcssAnimate],
} satisfies Config;
