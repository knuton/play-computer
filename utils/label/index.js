const PDFDocument = require('pdfkit')
const barcode = require('barcode')
const ipp = require('ipp')
const fs = require('fs')
const path = require('path')

async function createPdf (barcode, text, fineText1, fineText2) {
  return new Promise((resolve, reject) => {
    // make a PDF document
    var doc = new PDFDocument({
      margin: 0,
      // autoFirstPage: false,
      // Size is 57x32mm (Dymo 11354 labels)
      size: [160, 90]
    })

    // combine stream to a single buffer
    var buffers = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })

    // draw pdf
    doc.image(path.join(__dirname, 'logo-dividat-bw.jpg'), 60, 10, {width: 40})
    doc.image(barcode, 5, 25, {width: 150, height: 20})

    doc.font(path.join(__dirname, 'FiraSans-Light.ttf'))
       .fontSize(10)

    doc.text(text, 11, 48, {width: 140, align: 'center'})
    doc.fontSize(8).text(fineText1, 11, 62, {width: 140, align: 'right'}).fontSize(9)
    doc.fontSize(8).text(fineText2, 11, 72, {width: 140, align: 'right'}).fontSize(9)

    doc.end()
  })
}

function createBarcode (data) {
  return new Promise((resolve, reject) => {
    // create the barcode
    const code = barcode('code128', {
      data: data,
      width: 300,
      height: 30
    })

    // get base64 data uri
    code.getBase64((err, img) => {
      if (err) {
        return reject(err)
      }
      return resolve(img)
    })
  })
}

function print (url, pdf) {
  return new Promise((resolve, reject) => {
    const printer = ipp.Printer(url)

    const msg = {
      'operation-attributes-tag': {
        'requesting-user-name': 'play-computer',
        'job-name': 'label',
        'document-format': 'application/pdf'
      },
      data: pdf
    }

    printer.execute('Print-Job', msg, (err, res) => {
      if (err) {
        return reject(err)
      }

      if (res.statusCode === 'successful-ok') {
        return resolve()
      }
    })
  })
}

async function writeFile (file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) {
        return reject(err)
      }

      resolve(err)
    })
  })
}

async function main () {
  var argv = require('minimist')(process.argv.slice(2))

  const data = argv._[0] || 'What is my purpose?'
  const extra = argv._[1] || ''

  const fineText1 = argv._[2] || '' // 'MAC1: 80:EE:73:D2:21:8A'
  const fineText2 = argv._[3] || '' // 'MAC2: 80:EE:73:D2:21:8B'

  const code = await createBarcode(data)

  const text = extra ? data + '/' + extra : data
  const pdf = await createPdf(code, text, fineText1, fineText2)

  // const url = 'ipp://pinocchio.local:631/printers/DYMO_LabelWriter_450'
  if (argv.printer) {
    const n = argv.n || 1
    console.log('Printing ' + n + ' labels to ' + argv.printer + '...')

    for (var i = 0; i < n; i++) {
      await print(argv.printer, pdf)
    }
  }

  if (argv.file) {
    console.log('Writing pdf to ' + argv.file + '...')
    await writeFile(argv.file, pdf)
  }
}

main().catch((err) => {
  console.error('ERROR!')
  console.error(err)
}).then(() => {
  console.log('Done.')
})
