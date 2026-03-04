import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  compatibilityDate: '2026-01-25',
  // ESTE BLOQUE ES EL QUE ABRE LAS PUERTAS:
  devServer: {
    host: '0.0.0.0', // Permite conexiones desde fuera (tu celular)
    port: 3001       // Asegura que siempre sea el puerto 3001
  }
})