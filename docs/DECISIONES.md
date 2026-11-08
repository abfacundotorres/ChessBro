# Decisiones y supuestos

## H0
- **Licencia GPL-3.0-or-later** desde el inicio, porque en H2 se empaqueta Stockfish (GPL-3).
- **Notación figurativa** (♘f3) en la UI: es la que se ve en Lichess y no depende del idioma
  (la española R/D/T/A/C no se usa online). Internamente se guarda SAN inglés y jugadas from/to.
- **Estado de partida = posición inicial + lista de jugadas**, y la vista se deriva con
  `replay()`. Así funcionan deshacer y la triple repetición (que necesita historia).
- **El tablero acepta clic-clic y arrastre.** Clic-clic es más cómodo con una mano en el celular.
- **Coronación con selector** (no se corona dama automáticamente: la subpromoción es parte de la táctica).
- **Colores del tablero gris azulado** (alto contraste, cómodo en claro y oscuro).
- **Tema claro/oscuro según el sistema**, sin selector manual por ahora.
- **CSP sin 'unsafe-inline'**: los estilos dinámicos del tablero se aplican por CSSOM (React),
  que la CSP no bloquea. Verificado en el build sin violaciones.
- **El SW pide confirmación para actualizar** (banner) en vez de recargar solo en medio de un ejercicio.
- **El usuario de Lichess es un ajuste opcional** (H2), no se escribe en el código.
