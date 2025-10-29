import forge from 'node-forge'
import fs from 'fs'

console.log('🔐 Generando certificados SSL con node-forge...')

try {
  // Generar par de claves RSA
  const keys = forge.pki.rsa.generateKeyPair(2048)

  // Crear certificado
  const cert = forge.pki.createCertificate()

  // Establecer propiedades del certificado
  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

  // Atributos del certificado
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'State' },
    { name: 'localityName', value: 'City' },
    { name: 'organizationName', value: 'Development' },
    { name: 'organizationalUnitName', value: 'IT' }
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)

  // Extensiones del certificado
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'subjectAltName',
      altNames: [{
        type: 2, // DNS
        value: 'localhost'
      }, {
        type: 7, // IP
        ip: '127.0.0.1'
      }]
    }
  ])

  // Firmar el certificado con la clave privada
  cert.sign(keys.privateKey, forge.md.sha256.create())

  // Convertir a formato PEM
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)
  const certificatePem = forge.pki.certificateToPem(cert)

  // Guardar archivos
  fs.writeFileSync('key.pem', privateKeyPem)
  fs.writeFileSync('cert.pem', certificatePem)

  console.log('✅ Certificados generados exitosamente:')
  console.log('   📄 key.pem  (clave privada)')
  console.log('   📄 cert.pem (certificado)')
  console.log('   📅 Válido por 1 año')
  console.log('🎉 Ahora ejecuta: node server.js')
} catch (error) {
  console.error('❌ Error generando certificados:', error.message)
}
