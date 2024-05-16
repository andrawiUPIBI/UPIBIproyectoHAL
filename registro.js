const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const PDFDocument = require('pdfkit');



const app = express();
const PORT = 3000;

app.use('/', express.static(__dirname ));

// Configuración de conexión a PostgreSQLs
const client = new Client({
    user: 'halin',
    host: 'localhost',
    database: 'halindb',
    password: "halin-pass",
    port: 5432, // Puerto predeterminado de PostgreSQL
});

// Middleware para parsear datos de formularios
app.use(bodyParser.urlencoded({ extended: false }));

async function conectar(){

    const c= await client.connect()
    console.log('Conectado a la base de datos')
    console.log(c)
    return c
}

//conectar()

// Ruta para manejar el envío del formulario
app.post('/submit-form', (req, res) => {
    const { Control, Area, Comentario } = req.body;
console.log(Control)
console.log(Area)
    // Conectar a la base de datos
    client.connect()
        .then(() => {
            // Consulta SQL para insertar datos en la tabla
            const insertDataQuery = `
                INSERT INTO formulario (control, area, comentario)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            
            // Ejecutar la consulta SQL
            return client.query(insertDataQuery, [Control, Area, Comentario]);
        })
        .then(result => {
            // Crear un nuevo documento PDF
            const doc = new PDFDocument();
            
            // Encabezado del documento
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="datos.pdf"');
            
            // Escribir los datos en el documento PDF
            doc.pipe(res);
            doc.fontSize(16).text('Datos del Formulario:', { underline: true }).moveDown();
            doc.fontSize(12).text(`No. de Control: ${Control}`).moveDown();
            doc.fontSize(12).text(`Área: ${Area}`).moveDown();
            doc.fontSize(12).text(`Comentarios: ${Comentario}`).moveDown();
            doc.end();
        })
        .catch(err => {
            // Enviar mensaje de error al cliente
            res.status(500).send('Ocurrió un error al procesar el formulario.');
            console.error('Error al insertar datos en la tabla', err);
        })
        .finally(() => {
            // Cerrar la conexión a PostgreSQL
            client.end();
        });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
