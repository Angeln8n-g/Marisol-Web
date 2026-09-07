---
name: Clínica Dra. Marisol García
description: Sistema de diseño clínico dental premium para la plataforma de la Dra. Marisol García
colors:
  primary: "#1B2A4A"
  primary-light: "#283D6A"
  accent: "#C5A059"
  accent-light: "#DFCA88"
  accent-dark: "#9E7D3B"
  neutral-bg: "#F8F5F0"
  surface: "#FFFFFF"
  surface-muted: "#F8FAFC"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
  text-primary: "#1B2A4A"
  text-secondary: "#64748B"
  text-muted: "#94A3B8"
  border: "#E2E8F0"
typography:
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Playfair Display, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  script:
    fontFamily: "Alex Brush, cursive"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-gold:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

## Overview

El sistema de diseño de la **Clínica Dra. Marisol García** proyecta sofisticación, confianza médica, calidez humana y excelencia técnica. Diseñado para un entorno de consultorio y gestión médica de alto nivel, equilibra superficies blancas inmaculadas con acentos en Azul Marino Real y Dorado Premium.

## Colors

- **Azul Marino Real (`#1B2A4A`):** Color primario institucional. Comunica seriedad médica, estabilidad y autoridad clínica. Utilizado en encabezados, botones primarios y la barra lateral de navegación.
- **Dorado Premium (`#C5A059` / `#D4AF37`):** Color de acento de lujo. Representa calidad estética dental, sellos de confianza y estados activos selectos.
- **Arena Suave / Nude (`#F8F5F0`):** Fondo neutro relajante que reduce la fatiga visual de la pantalla en consultorio.
- **Blanco Puro (`#FFFFFF`):** Fondo de tarjetas, tablas y ventanas modales, garantizando asepsia visual y alto contraste.
- **Esmeralda Clínico (`#10B981`):** Indicador de confirmación, citas al día y salud dental óptima.
- **Ámbar Cálido (`#F59E0B`) & Rosa Coral (`#EF4444`):** Alertas de seguimiento post-operatorio y citas pendientes.

## Typography

- **Playfair Display (Serif):** Tipografía de prestigio utilizada para encabezados (`h1`, `h2`), nombres de pacientes y cifras numéricas principales.
- **Montserrat (Sans-Serif):** Tipografía técnica y funcional utilizada para texto corrido, tablas de datos, etiquetas de formularios y controles de navegación.
- **Alex Brush (Cursive):** Firma y sello de autor de la Dra. García en la cabecera institucional.
- **Números Tabulares (`tabular-nums`):** Obligatorios en métricas, precios en DOP y horarios de agenda para alineación óptica vertical perfecta.

## Layout

- Cuadrícula modular flexible basada en Tailwind CSS con contenedores amplios de hasta 1600px.
- Separación generosa entre bloques principales (`gap-6` en desktop) y agrupaciones compactas dentro de cada tarjeta (`gap-2` a `gap-3`).
- Diseño responsivo adaptado a estaciones de trabajo de consultorio (1920x1080), laptops (1366x768), tablets clínicas (iPad) y móviles de recepción.

## Elevation & Depth

- Sombras sutiles con dispersión suave (`shadow-sm`, `shadow-md`), evitando bordes duros o sombras planas neobrutalistas sin desenfoque.
- Bordes finos de 1px (`border-gray-200/80` o `border-slate-100`) para separar contenedores sobre fondos claros.

## Shapes

- Esquinas suavemente redondeadas (`rounded-xl` a `rounded-2xl` en tarjetas principales y botones; `rounded-full` en pastillas e insignias de estado).
- Contenedores de iconos cuadrados redondeados (`w-10 h-10 rounded-xl` o `w-11 h-11 rounded-xl`) con fondos pastel suaves.

## Components

- **Tarjetas Métricas (KPI Cards):** Contenedor blanco, icono temático pastel con borde sutil, cifra destacada en Playfair y micrográfico de tendencia sparkline.
- **Gráficos Clínicos:** Gráficos de área spline suaves con gradiente vertical translúcido y ejes discretos sin saturación.
- **Insignias de Estado (Badges):** Pastillas de borde y fondo semánticos para estados de citas (Confirmada, Pendiente, En Progreso, Completada, Cancelada).
- **Botones de Acción:** Primarios en Azul Marino con texto blanco y acento dorado; secundarios en gris claro neutro con microinteracción hover y anillos de enfoque accesibles.

## Do's and Don'ts

### Do's
- Mantener contrastes de texto superiores a 4.5:1 para legibilidad clínica.
- Usar `tabular-nums` en todas las tablas numéricas y tarjetas de métricas.
- Incluir estados vacíos amables y descriptivos con acciones de recuperación claras.
- Utilizar iconos SVG consistentes de peso y trazo uniforme (1.75px a 2px).

### Don'ts
- No utilizar emojis en lugar de iconos vectoriales.
- No colocar kickers o cejas decorativas redundantes sobre los títulos.
- No aplicar bordes laterales gruesos de más de 1px en alertas o tarjetas.
- No emplear sombras duras sin desenfoque (`box-shadow: 4px 4px 0`).
