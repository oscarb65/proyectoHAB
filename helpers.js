const chalk = require('chalk');
const crypto = require('crypto');
const {format} = require('date-fns');
const { ensureDir } = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const uuid = require("uuid");
const sgMail = require('@sendgrid/mail');

// Configuro sendgrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


/**
 * Esta función guarda imagenes en el directorio determinado por la variable de entorno UPLOAD_DIRECTORY.
 * @param {Object} foto - Objeto imagen de Sharp.
 * @returns {string} - Nombre de la imagen.
 */
async function guardarImagenesExperiencia(foto) {
    const { UPLOAD_DIRECTORY } = process.env;
    const recursosDir = path.join(__dirname, UPLOAD_DIRECTORY);
    await ensureDir(recursosDir);                               //compruebo si hay en el directorio de recursos y sino lo creo 
    const imagen = sharp(foto.data);                            //leo el buffer (foto.data) con sharp
    imagen.resize(600);                                         //controlo el tamaño
    const nombreImagen = `${uuid.v4()}.jpg`;                    //genero un nombre para la foto con uuid sin controlar el formato
    await imagen.toFile(path.join(recursosDir, nombreImagen));  //guardo la imagen en mi directorio de recursos 
    return nombreImagen;                                         //devuelvo el nombre de la foto
}

/**
 * Genera y retorna una string aleatoria de 40 bytes de longitud.
 * @returns {string}
 */
function generateRandomString() {
    return crypto.randomBytes(40).toString("hex");
}

/**
* Formatea y estiliza mensajes de log.
* @param {string} message 
*/
function log(message) {
    console.log(chalk.green.bold('==> ') + message);
}

/**
 * Formatea y estiliza mensajes de error. Si la variable de entorno VERBOSE es true, muestra el stacktrace, de lo contrario sólo muestra el mensaje de error.
 * @param {Object} error 
 */
function logError(error) {

    if (process.env.VERBOSE === 'true') {
        console.error(chalk.red(error.stack));
    } else {
        console.error(chalk.red.bold(error));
    }
}

/**
 * Formatea una fecha de tipo Date para que esta pueda ser introducida en una columna DATA de MYSQL.
 * @param {Date} dateObject 
 * @returns {string}
 */
function formatearDateMysql(dateObject) {
    return format(dateObject, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Valida los datos introducidos en el body o query de las peticiones.
 * @param {Object} schema - Esquema de requisitos a analizar
 * @param {Object} data - Objeto que posee los datos a validar
 */
async function validate(schema, data) {
    try {
        await schema.validateAsync(data);
    } catch (error) {
        error.httpStatus = 400;
        throw error;
    }
}

/**
 *  Envia un email dede la dirección de correo estipulada en SENDGRID_FROM con los datos del objeto añadido como argumento.
 * @param {String} param0.to - Destinatario del email.
 * @param {String} param0.subject - Tema del email.
 * @param {String} param0.body - Cuerpo del email.
 */
async function sendMail({ to, subject, body }) {
    try {
        // https://www.npmjs.com/package/sendgrid
        const msg = {
            to,
            from: process.env.SENDGRID_FROM, //poner el mismo correo que pusimos en FROM de sendgrid
            subject,
            text: body,
            html: `
                    <div>
                    <h1>${subject}</h1>
                    <p>${body}</p>
                    </div>
                `,
        };
        await sgMail.send(msg);
    } catch (error) {
        throw new Error("Error enviando email");
    }
}



module.exports = {
    validate,
    guardarImagenesExperiencia,
    generateRandomString,
    log,
    logError,
    formatearDateMysql,
    sendMail
}