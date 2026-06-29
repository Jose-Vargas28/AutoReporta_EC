import { Link } from "react-router"
import Logo from "../components/Logo"

const seccion = (numero, titulo, children) => (
    <div>
        <h2 className="text-base font-bold text-slate-800 mb-2">{numero}. {titulo}</h2>
        {children}
    </div>
)

const Terminos = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* Header */}
            <header className="bg-blue-900 text-white py-4 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Logo size="sm" light linkToHome />
                    <Link to="/"
                        className="text-blue-200 hover:text-white text-sm hover:underline transition-colors">
                        ← Volver al inicio
                    </Link>
                </div>
            </header>

            {/* Contenido */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">

                    <div className="mb-8 pb-6 border-b border-slate-100">
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">
                            Términos y Condiciones de Uso
                        </h1>
                        <p className="text-sm text-slate-500">AutoReporta EC · Última actualización: 2025</p>
                        <p className="text-sm text-slate-600 mt-3">
                            Bienvenido a <strong>AutoReporta EC</strong>, plataforma web colaborativa para el análisis
                            y recopilación de fallas y problemas mecánicos de vehículos comercializados en el mercado
                            ecuatoriano. Al registrarte y usar esta plataforma, aceptas los siguientes términos.
                        </p>
                    </div>

                    <div className="space-y-6 text-sm text-slate-700">

                        {seccion(1, "Descripción del servicio",
                            <p>AutoReporta EC es un sistema web colaborativo que permite a los usuarios registrar,
                            consultar y analizar reportes de fallas vehiculares. La información presentada tiene{" "}
                            <strong>carácter referencial</strong> y está basada en datos colaborativos y fuentes
                            externas disponibles públicamente. La plataforma no reemplaza inspecciones mecánicas
                            físicas, certificaciones oficiales, ni entidades gubernamentales de control.</p>
                        )}

                        {seccion(2, "Alcance y limitaciones",
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>El sistema no contempla la validación técnica directa de reportes mediante inspecciones físicas.</li>
                                <li>No gestiona procesos legales, reclamos formales ni sanciones a empresas o importadoras.</li>
                                <li>No incluye servicios de venta o compra de vehículos, repuestos ni servicios automotrices.</li>
                                <li>No posee integraciones con sistemas de fabricantes, importadoras o ensambladoras.</li>
                                <li>La información presentada tendrá carácter referencial y estará basada en datos colaborativos y fuentes externas disponibles públicamente.</li>
                            </ul>
                        )}

                        {seccion(3, "Obligaciones del usuario",
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Hacer un uso lícito y adecuado de la plataforma.</li>
                                <li>Proporcionar información veraz al registrar reportes de fallas vehiculares.</li>
                                <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de autor.</li>
                                <li>No suplantar la identidad de otras personas ni crear cuentas con fines fraudulentos.</li>
                                <li>Respetar los derechos de otros usuarios de la plataforma.</li>
                            </ul>
                        )}

                        {seccion(4, "Política de privacidad y datos personales",
                            <div className="space-y-2">
                                <p>AutoReporta EC recopila datos personales (nombre, apellido, correo electrónico,
                                región y provincia) con el único fin de gestionar tu cuenta y mejorar el servicio.</p>
                                <p>Tus datos no serán vendidos ni compartidos con terceros sin tu consentimiento.
                                Al registrarte, autorizas el uso de tu información conforme a las normativas de
                                protección de datos vigentes en Ecuador.</p>
                            </div>
                        )}

                        {seccion(5, "Propiedad intelectual",
                            <p>Todo el contenido de la plataforma (textos, logos, diseño, imágenes propias) es
                            propiedad de AutoReporta EC o cuenta con las licencias correspondientes. Los reportes
                            publicados por los usuarios son de su propia autoría; al publicarlos, el usuario concede
                            a la plataforma el derecho a mostrarlos con fines estadísticos y de análisis colectivo.</p>
                        )}

                        {seccion(6, "Limitación de responsabilidad",
                            <div className="space-y-2">
                                <p>AutoReporta EC no se responsabiliza por fallos técnicos, interrupciones del
                                servicio o daños indirectos derivados del uso de la plataforma.</p>
                                <p>La información publicada tiene carácter referencial y no constituye asesoría
                                técnica, legal ni comercial. Las decisiones que el usuario tome en base a la
                                información disponible son de su exclusiva responsabilidad.</p>
                            </div>
                        )}

                        {seccion(7, "Modificaciones del acuerdo",
                            <p>AutoReporta EC se reserva el derecho de modificar estos Términos y Condiciones
                            cuando sea necesario. El uso continuado de la plataforma tras la publicación de
                            actualizaciones implica la aceptación de las nuevas condiciones. Se notificará a
                            los usuarios registrados sobre cambios significativos.</p>
                        )}

                        {seccion(8, "Moderación y suspensión de cuentas",
                            <p>La administración se reserva el derecho de suspender o eliminar cuentas que
                            incumplan estos términos, publiquen información falsa de manera reiterada o hagan
                            un uso indebido de la plataforma.</p>
                        )}

                    </div>

                    {/* Pie */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                            AutoReporta EC — Sistema web colaborativo de análisis de fallas vehiculares · Ecuador · 2025
                        </p>
                        <Link to="/register"
                            className="text-sm text-blue-700 font-semibold hover:underline transition-colors">
                            Crear cuenta →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Terminos