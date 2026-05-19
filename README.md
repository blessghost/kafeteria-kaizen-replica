## Arquitectura Técnica y Patrones de Diseño

El sistema fue desarrollado bajo principios de robustez, consistencia de datos y optimización de recursos en el cliente:

### Reactividad y Sincronización en Tiempo Real
* **State Management Optimizada:** Control de flujos locales mediante hooks de React (`useState`, `useEffect`), manejando carritos de compra inmutables con identificadores unívocos basados en marcas de tiempo numéricas para operaciones de filtrado (`Array.prototype.filter`) en tiempo de ejecución O(1).
* **Consumo de Datos Basado en Eventos (Event-Driven):** Implementación de conexiones persistentes mediante WebSockets a través de la API `onSnapshot` de Firebase. Esto permite acoplar de forma reactiva el estado global de la aplicación (apertura/cierre de turnos) con la interfaz del cliente final de manera síncrona.
* **Inyección Dinámica de Contexto:** Parsing automatizado de parámetros de consulta URL (`URLSearchParams`) para la resolución y asignación dinámica de locaciones físicas (mesas/barra) sin generar sobrecarga en el enrutamiento.

### Motor de Reglas de Negocio (Business Logic Layer)
* **Validación Condicional de Atributos:** Arquitectura que intercepta las propiedades del modelo de datos (`producto`) para inhibir o permitir dinámicamente mutaciones en la comanda. 
* **Control de Modificadores con Impacto Financiero:** Filtros algorítmicos que aíslan recetas estáticas (bloqueando mutaciones de lácteos en productos basados en agua o espresso puro) y calculan sobrecostos de forma controlada en el cliente antes de la persistencia en la base de datos.

### Tolerancia a Fallos y Sanitización de Datos (Data Resilience)
* **Parser de Datos Defensivo:** Para contrarrestar la variabilidad en la captura de registros de Firestore, el frontend implementa un normalizador reflectivo basado en `Object.keys()` y expresiones regulares (`.replace(/\s+/g, '')`). Esto sanitiza llaves con espacios ocultos (`"nombre "`) y valores con caracteres de escape (`"\n"`), garantizando la integridad visual de la interfaz.
* **Manejo de Estados de Respaldo (Fallback Strategy):** Cortocircuitos lógicos en la desestructuración de objetos que evitan interrupciones catastróficas del sistema (Null Pointer Exceptions) inyectando placeholders y valores tipados por defecto en caso de inconsistencias en el backend.

### Infraestructura BaaS (Backend-as-a-Service) con Firebase
* **Cloud Firestore Descentralizado:** Arquitectura NoSQL basada en colecciones y documentos híbridos, optimizando el rendimiento de lectura y escritura en la capa de persistencia mediante consultas distribuidas de baja latencia.
* **Flujos de Mutación Atómicos (Atomic Writes):** Implementación de transacciones y operaciones en lote (`writeBatch`) en el panel de administración, asegurando la consistencia e integridad referencial de los datos al limpiar históricos del día anterior sin generar estados intermedios corruptos.
* **Seguridad y Control de Acceso Perimetral:** Configuración de Reglas de Seguridad de Firestore de forma granular para validar y mitigar vectores de escritura no autorizados, aislando los entornos de desarrollo de forma óptima durante el ciclo de vida del software.

Para probar el flujo de pedidos dinámicos en tiempo real, puedes escanear cualquiera de los siguientes códigos QR directamente con la cámara de tu celular, o hacer clic en los enlaces de simulación:

| Mesa 1 | Mesa 2 |
| :---: | :---: |
| ![Mesa 1](./QR's/KAIZEN.png) | ![Mesa 2](./QR's/Kaizen2.png) |
| [Simular Pedido desde Mesa 1](https://kaizenkafe-replica.web.app/?mesa=1) | [Simular Pedido desde Barra](https://kaizenkafe-replica.web.app/?mesa=2) |

*Nota: Al escanear el código, notarás que la interfaz del menú se adapta automáticamente capturando el número de mesa desde los parámetros de la URL.*