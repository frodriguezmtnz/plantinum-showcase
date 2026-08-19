# Contribuir a Platinum Showcase

¡Primero que nada, gracias por considerar contribuir a Platinum Showcase! Son personas como tú las que hacen de esta una gran comunidad. Cada contribución es muy apreciada.

Este documento proporciona un conjunto de directrices para contribuir al proyecto.

## ¿Cómo puedo contribuir?

### Reportando Bugs

- Asegúrate de que el bug no haya sido reportado previamente buscando en los Issues de GitHub.
- Si no encuentras un issue abierto que aborde el problema, abre uno nuevo. Asegúrate de incluir un **título y una descripción clara**, tanta información relevante como sea posible y, si es posible, un fragmento de código o un caso de prueba ejecutable que demuestre el comportamiento esperado que no está ocurriendo.

### Sugiriendo Mejoras

- Asegúrate de que la mejora no haya sido sugerida previamente buscando en los Issues de GitHub.
- Si no encuentras un issue abierto, abre uno nuevo. Proporciona una descripción clara de la mejora y por qué sería beneficiosa.

### Pull Requests

1.  Haz un **fork** del repositorio y crea tu rama a partir de `main`.
2.  **Instala las dependencias** ejecutando `pnpm install`.
3.  **Realiza tus cambios** en una nueva rama de git.
4.  **Asegúrate de que tu código pase el linter** ejecutando `pnpm lint`.
5.  **Prueba tus cambios** ejecutando `pnpm typecheck` y `pnpm build` para asegurarte de que todo funciona.
6.  **Haz commit de tus cambios** usando un mensaje de commit descriptivo.
7.  **Sube tu rama** a tu fork.
8.  **Abre un Pull Request** a nuestra rama `main`. Proporciona un título y una descripción claros de tus cambios.

## Guías de Estilo

### Mensajes de Commit en Git

- Usa el tiempo presente ("Añade funcionalidad" no "Añadida funcionalidad").
- Usa el modo imperativo ("Mueve el cursor a..." no "Mueve el cursor a...").

### Estilo de Código

- Usamos Prettier para el formato del código, que debería ejecutarse automáticamente al hacer commit si tienes las extensiones adecuadas.
- Sigue el estilo de código existente. Priorizamos la claridad y la mantenibilidad.
- Usa TypeScript y sigue las mejores prácticas modernas de React (componentes funcionales, hooks).

¡Esperamos tus contribuciones! 🏆
