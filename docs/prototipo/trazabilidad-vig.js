// Lote 4 · Vigilante de garita — trazabilidad HU → criterio → pantallas → cómo se cumple
window.JV_TRAZA_VIG = [
  ['HU-GAR-06','CA1','VIG-CON-01, VIG-CON-03','Placa, DNI o nombre; si la casa está al día: badge verde con texto "puede abrirle la reja" y botón "Abrir la reja y anotar la entrada".'],
  ['HU-GAR-06','CA2','VIG-CON-02','Badge rojo con texto "Vecino atrasado: no abrir"; no aparece el botón de apertura automática. Sin palabras como "moroso" o "deuda" y sin montos.'],
  ['HU-GAR-06','CA2 (salida humana)','VIG-CON-02, VIG-CON-04','El vecino abre a mano como cualquiera; botones "Llamar a la directiva" y "Es una emergencia: abrir igual", con confirmación y registro.'],
  ['HU-GAR-06','CA3','VIG-CON-02, VIG-BIT-01','"Ya le avisamos a su WhatsApp"; "Anotar que entró abriendo a mano" queda en la bitácora.'],
  ['HU-GAR-07','CA1','VIG-VIS-01, VIG-VIS-02','La visita anunciada por Carmen (Mis visitas, lote 1) aparece en la lista con sus datos; "Dejar pasar" avisa a la vecina.'],
  ['HU-GAR-07','CA2','VIG-VIS-03, VIG-VIS-04','Badge "No está en la lista de visitas"; "Preguntar a Carmen" envía el aviso que ve en su inicio y en VEC-GAR-05; también "Llamar a Carmen".'],
  ['HU-GAR-07','CA3','VIG-VIS-05, VIG-BIT-01','Con la respuesta de Carmen (en la app o por teléfono) se anota la entrada como "autorizó Carmen Huamán".'],
  ['HU-GAR-08','CA1','VIG-BIT-01','Cada fila: hora, placa o "a pie", persona, vivienda de destino y tipo de ingreso.'],
  ['HU-GAR-08','CA2','VIG-BIT-01, VIG-INI-01','Filtro "Dentro ahora" y alerta "LMN-908 lleva más de 6 horas dentro"; "Marcar salida".'],
  ['HU-GAR-08','CA3','VIG-BIT-01','Candado en cada fila y texto "No se pueden editar ni borrar"; no hay edición.'],
  ['HU-COB-06','CA2','VIG-CON-02','La tablet usa la lista de la garita del padrón: la casa con 8 semanas o más no tiene apertura automática.'],
  ['HU-COB-07','CA3','VIG-CON-01, VIG-CON-02','Si Marta pone al día a Julio (DIR-COB-17), la misma consulta pasa a verde: "Se puso al día hoy a las 10:52 a. m."'],
  ['HU-GAR-04','CA3','VIG-VIS-01, VIG-INI-01','Las visitas que registra el vecino entran solas a la lista.'],
  ['HU-GAR-05','CA2','VIG-VIS-01','Si Carmen anula la visita (VEC-GAR-04), desaparece de la lista de la garita.'],
  ['HU-GAR-09','CA2','VIG-CON-01','Miguel Paz, dado de baja por Ana (ADM-PAD-11): "Ya no está en el padrón de la garita. Trátelo como visita".'],
  ['Sin conexión','—','VIG-CON-03, todas','Siempre responde con la lista guardada; indica la hora del dato y que "puede estar desactualizado si hubo pagos o cambios después".'],
  ['WCAG 3.3.7','—','VIG-VIS-02, VIG-VIS-03','La visita anunciada no se vuelve a preguntar; en la no anunciada, el nombre buscado pasa al formulario.'],
  ['WCAG 3.3.8','—','VIG-ENT-01','Llave de acceso de la tablet; la clave admite pegar, autocompletar y mostrarse.'],
  ['HU-ACC-01, HU-ACC-09','—','Todas','Letra grande y Pedir ayuda en la misma posición; objetivos de 48 px o más; 4 destinos de navegación.']
];
window.JV_NO_CUBIERTAS_VIG = [
  ['Apertura real de la reja', 'El prototipo solo registra la acción; la conexión con el motor de la reja es de hardware (fuera de R2.3).'],
  ['Cambio de turno', 'Ninguna HU pide entregar el turno entre vigilantes. César Molina entraría con su propio acceso.'],
  ['Placa leída por cámara', 'No hay HU; la placa se escribe o se busca por nombre.']
];
