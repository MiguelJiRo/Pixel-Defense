# Pixel Defense

Un tower defense minimalista con estilo pixel/retro desarrollado con React y Canvas.

## Características

- **Estilo Visual Pixel/Retro**: Gráficos minimalistas con efectos de partículas y scanlines retro
- **Modo Endless**: Nivel único con paths aleatorios que cambian en cada oleada
- **Sistema de Dificultad**: 4 niveles de dificultad (Easy, Normal, Hard, Extreme)
- **Duración Personalizable**: Elige 20, 30, 40 rondas o configura una cantidad personalizada
- **Eventos Aleatorios**: Eventos especiales durante las oleadas que añaden variedad
  - Double Wave: El doble de enemigos
  - Speed Boost: Enemigos más rápidos
  - Armored: Enemigos con más vida
  - Boss Rush: Múltiples jefes
  - Swarm: Muchos enemigos débiles
  - Money Bonus: Doble recompensa
  - Air Raid: Enemigos voladores rápidos

## Torres Disponibles

### Basic Tower ($100)
- Daño: 10
- Alcance: 3
- Velocidad: Media
- Torre balanceada para defensa general

### Sniper Tower ($200)
- Daño: 50
- Alcance: 6
- Velocidad: Lenta
- Alto daño a larga distancia

### Rapid Tower ($150)
- Daño: 5
- Alcance: 2.5
- Velocidad: Muy rápida
- Muchos disparos por segundo

### Splash Tower ($250)
- Daño: 20
- Alcance: 3
- Velocidad: Media
- Daño en área de efecto

## Tipos de Enemigos

- **Basic**: Enemigo estándar con vida y velocidad balanceadas
- **Fast**: Enemigo rápido pero débil
- **Tank**: Enemigo lento pero con mucha vida
- **Boss**: Jefe con muchísima vida (aparece cada 5 rondas)

## Mecánicas del Juego

### Fase de Preparación
- Entre oleadas tienes 15 segundos para:
  - Construir nuevas torres
  - Mejorar torres existentes (hasta nivel 3)
  - Vender torres (recuperas el 70% del costo)

### Fase de Oleada
- Los enemigos siguen un path aleatorio
- Destruye enemigos para ganar dinero
- Si un enemigo llega al final, pierdes 1 vida
- El juego termina cuando tu vida llega a 0

### Sistema de Mejoras
- Las torres pueden mejorarse hasta nivel 3
- Cada mejora aumenta el daño y puede aumentar el alcance
- El costo de mejora varía según el tipo de torre

## Instalación y Ejecución

### Requisitos Previos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

```bash
# Clonar o descargar el proyecto
cd pixel-defense

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El juego estará disponible en http://localhost:5173
```

### Compilar para Producción

```bash
# Crear build de producción
npm run build

# Previsualizar build
npm run preview
```

## Controles

- **Click Izquierdo**: Colocar torre o seleccionar torre existente
- **Hover**: Ver preview de torre y alcance antes de colocar

## Tecnologías Utilizadas

- **React**: Framework de UI
- **Canvas 2D**: Rendering del juego
- **Vite**: Build tool y dev server
- **JavaScript ES6+**: Lógica del juego

## Estructura del Proyecto

```
pixel-defense/
├── src/
│   ├── components/
│   │   ├── Game.jsx           # Componente principal del juego
│   │   ├── Game.css           # Estilos del juego
│   │   ├── StartMenu.jsx      # Menú de inicio
│   │   └── StartMenu.css      # Estilos del menú
│   ├── game/
│   │   ├── GameManager.js     # Lógica principal del juego
│   │   ├── constants.js       # Constantes y configuración
│   │   ├── events.js          # Sistema de eventos aleatorios
│   │   └── ParticleSystem.js  # Sistema de partículas
│   ├── App.jsx                # Componente raíz
│   ├── App.css                # Estilos globales
│   └── main.jsx               # Punto de entrada
├── index.html                  # HTML principal
├── vite.config.js             # Configuración de Vite
└── package.json               # Dependencias y scripts
```

## Características Técnicas

- **Sistema de Pathfinding**: 5 paths predefinidos que se seleccionan aleatoriamente
- **Sistema de Oleadas**: Dificultad escalable basada en la ronda actual
- **Sistema de Partículas**: Efectos visuales para explosiones, impactos y recompensas
- **Rendering Optimizado**: Canvas con image-rendering pixelated para estética retro
- **Game Loop**: Actualización a 60 FPS con delta time para movimiento suave

## Consejos y Estrategias

1. **Economía Temprana**: Construye Basic Towers al inicio para ahorrar dinero
2. **Posicionamiento**: Coloca torres en lugares donde puedan cubrir múltiples secciones del path
3. **Balance**: Combina diferentes tipos de torres para manejar distintos enemigos
4. **Mejoras**: Mejorar una torre existente a veces es mejor que construir una nueva
5. **Eventos**: Adapta tu estrategia según el evento activo de cada oleada

## Créditos

Desarrollado con React + Canvas
Diseño minimalista pixel/retro

## Licencia

MIT
