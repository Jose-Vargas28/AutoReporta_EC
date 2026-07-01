import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const FROM_NAME = "AutoReporta EC"
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "josemvargas.28@gmail.com"

// Envía un correo vía Brevo API HTTP — sin SDK, sin SMTP, funciona en Railway
const enviarCorreo = async ({ to, subject, html }) => {
    await axios.post("https://api.brevo.com/v3/smtp/email", {
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html
    }, {
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        }
    })
}

// Normalizar URL_FRONTEND: siempre con barra al final para construir enlaces en los correos.
const BASE_URL = (process.env.URL_FRONTEND || "http://localhost:5173").replace(/\/?$/, "/")

// Confirmación de cuenta
const sendMailToConfirm = async (userMail, token) => {
    try {
        await enviarCorreo({ to: userMail, subject: "Confirma tu cuenta - AutoReporta EC 🚗", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#1e293b;">Confirma tu cuenta</h2>
                    <p style="color:#475569;">Gracias por registrarte. Haz clic en el botón para activar tu cuenta:</p>
                    <div style="text-align:center; margin:32px 0;">
                        <a href="${BASE_URL}confirm/${token}"
                           style="background:#1e3a8a; color:white; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                            Confirmar mi cuenta
                        </a>
                    </div>
                    <p style="color:#94a3b8; font-size:12px;">Si no creaste esta cuenta, ignora este correo.</p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de confirmación:", error)
    }
}

// Recuperación de contraseña
const sendMailToRecovery = async (userMail, token) => {
    try {
        await enviarCorreo({ to: userMail, subject: "Recupera tu contraseña - AutoReporta EC 🔑", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#1e293b;">Restablecer contraseña</h2>
                    <p style="color:#475569;">Recibimos una solicitud para restablecer tu contraseña:</p>
                    <div style="text-align:center; margin:32px 0;">
                        <a href="${BASE_URL}reset/${token}"
                           style="background:#dc2626; color:white; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                            Restablecer contraseña
                        </a>
                    </div>
                    <p style="color:#94a3b8; font-size:12px;">Si no solicitaste esto, ignora este correo. El enlace expira en 1 hora.</p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de recuperación:", error)
        throw error
    }
}

// Reporte verificado
const sendMailReporteVerificado = async (userMail, userName, vehiculo, falla, reporteId) => {
    try {
        await enviarCorreo({ to: userMail, subject: "✅ Tu reporte fue validado - AutoReporta EC", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#16a34a;">✅ ¡Tu reporte fue validado!</h2>
                    <p style="color:#475569;">Hola <strong>${userName}</strong>,</p>
                    <p style="color:#475569;">Tu reporte ha sido revisado y validado por nuestro equipo. Ya es visible para todos los usuarios de la plataforma.</p>
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px; margin:24px 0;">
                        <p style="margin:0; color:#166534;"><strong>Vehículo:</strong> ${vehiculo}</p>
                        <p style="margin:8px 0 0; color:#166534;"><strong>Falla reportada:</strong> ${falla}</p>
                    </div>
                    <div style="text-align:center; margin:24px 0;">
                        <a href="${BASE_URL}dashboard/reporte/${reporteId}"
                           style="background:#1e3a8a; color:white; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                            Ver mi reporte
                        </a>
                    </div>
                    <p style="color:#475569;">Gracias por contribuir a la seguridad vehicular en Ecuador.</p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de verificación:", error)
    }
}

// Reporte invalidado
const sendMailReporteInvalidado = async (userMail, userName, vehiculo, falla, motivo) => {
    try {
        await enviarCorreo({ to: userMail, subject: "⚠️ La validación de tu reporte fue retirada - AutoReporta EC", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#d97706;">⚠️ Validación retirada</h2>
                    <p style="color:#475569;">Hola <strong>${userName}</strong>,</p>
                    <p style="color:#475569;">La validación de tu reporte ha sido retirada por nuestro equipo de revisión.</p>
                    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:16px; margin:24px 0;">
                        <p style="margin:0; color:#92400e;"><strong>Vehículo:</strong> ${vehiculo}</p>
                        <p style="margin:8px 0 0; color:#92400e;"><strong>Falla reportada:</strong> ${falla}</p>
                    </div>
                    <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:16px 0; border-radius:4px;">
                        <p style="margin:0; color:#78350f;"><strong>Motivo:</strong></p>
                        <p style="margin:8px 0 0; color:#78350f;">${motivo}</p>
                    </div>
                    <p style="color:#475569;">Tu reporte permanece en el sistema como pendiente. Si crees que hay un error, puedes contactar a nuestro equipo.</p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de invalidación:", error)
    }
}

// Reporte eliminado
const sendMailReporteEliminado = async (userMail, userName, vehiculo, falla, motivo) => {
    try {
        await enviarCorreo({ to: userMail, subject: "❌ Tu reporte fue eliminado - AutoReporta EC", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#dc2626;">❌ Reporte eliminado</h2>
                    <p style="color:#475569;">Hola <strong>${userName}</strong>,</p>
                    <p style="color:#475569;">Tu reporte ha sido eliminado por nuestro equipo de moderación.</p>
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin:24px 0;">
                        <p style="margin:0; color:#991b1b;"><strong>Vehículo:</strong> ${vehiculo}</p>
                        <p style="margin:8px 0 0; color:#991b1b;"><strong>Falla reportada:</strong> ${falla}</p>
                    </div>
                    <div style="background:#fee2e2; border-left:4px solid #dc2626; padding:16px; margin:16px 0; border-radius:4px;">
                        <p style="margin:0; color:#7f1d1d;"><strong>Motivo:</strong></p>
                        <p style="margin:8px 0 0; color:#7f1d1d;">${motivo}</p>
                    </div>
                    <p style="color:#475569;">Si consideras que esto fue un error, puedes crear un nuevo reporte con información más detallada o contactar a nuestro equipo.</p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de eliminación:", error)
    }
}

// Reporte devuelto con observación
const sendMailReporteDevuelto = async (userMail, userName, vehiculo, falla, observacion, reporteId) => {
    try {
        await enviarCorreo({ to: userMail, subject: "↩️ Tu reporte necesita correcciones - AutoReporta EC", html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#1e3a8a;">↩️ Tu reporte necesita correcciones</h2>
                    <p style="color:#475569;">Hola <strong>${userName}</strong>,</p>
                    <p style="color:#475569;">Hemos revisado tu reporte y necesita algunos ajustes antes de poder publicarse.</p>
                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px; margin:24px 0;">
                        <p style="margin:0; color:#1e3a8a;"><strong>Vehículo:</strong> ${vehiculo}</p>
                        <p style="margin:8px 0 0; color:#1e3a8a;"><strong>Falla reportada:</strong> ${falla}</p>
                    </div>
                    <div style="background:#f0f9ff; border-left:4px solid #1e3a8a; padding:16px; margin:16px 0; border-radius:4px;">
                        <p style="margin:0; color:#1e3a8a;"><strong>Observación del administrador:</strong></p>
                        <p style="margin:8px 0 0; color:#1e3a8a;">${observacion}</p>
                    </div>
                    <p style="color:#475569;">Por favor ingresa a tu cuenta, edita el reporte con las correcciones indicadas y lo revisaremos nuevamente.</p>
                    <p style="color:#94a3b8; font-size:12px;">⏱️ Recuerda que tienes <strong>48 horas desde que creaste el reporte</strong> para editarlo. Si ya pasó ese tiempo, contacta al administrador.</p>
                    <div style="text-align:center; margin:24px 0;">
                        <a href="${BASE_URL}dashboard/editar/${reporteId}"
                           style="background:#1e3a8a; color:white; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                            Editar mi reporte
                        </a>
                    </div>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>` })
        console.log('Correo enviado correctamente')
    } catch (error) {
        console.error("Error al enviar correo de devolución:", error)
    }
}

// Mensaje de contacto
const sendMailContacto = async ({ nombre, correo, asunto, mensaje }) => {
    try {
        await axios.post("https://api.brevo.com/v3/smtp/email", {
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: process.env.ADMIN_CORREO_CONTACTO || FROM_EMAIL }],
            replyTo: { email: correo, name: nombre },
            subject: `📬 Contacto: ${asunto} — AutoReporta EC`,
            htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background:#1e3a8a; padding:24px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px;">AutoReporta EC</h1>
                </div>
                <div style="padding:32px;">
                    <h2 style="color:#1e293b;">📬 Nuevo mensaje de contacto</h2>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:16px 0;">
                        <p style="margin:0; color:#475569;"><strong>De:</strong> ${nombre} &lt;${correo}&gt;</p>
                        <p style="margin:8px 0 0; color:#475569;"><strong>Asunto:</strong> ${asunto}</p>
                    </div>
                    <div style="background:#eff6ff; border-left:4px solid #1e3a8a; padding:16px; border-radius:4px;">
                        <p style="margin:0; color:#1e3a8a; white-space:pre-line;">${mensaje}</p>
                    </div>
                    <p style="color:#94a3b8; font-size:12px; margin-top:24px;">
                        Puedes responder directamente a este correo para contactar al usuario.
                    </p>
                </div>
                <div style="background:#f8fafc; padding:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    AutoReporta EC — Reportes vehiculares colaborativos del Ecuador
                </div>
            </div>`,
        }, {
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json"
            }
        })
        console.log('Correo de contacto enviado')
    } catch (error) {
        console.error("Error al enviar correo de contacto:", error)
        throw error
    }
}

export {
    sendMailToConfirm,
    sendMailToRecovery,
    sendMailReporteVerificado,
    sendMailReporteInvalidado,
    sendMailReporteEliminado,
    sendMailReporteDevuelto,
    sendMailContacto
}