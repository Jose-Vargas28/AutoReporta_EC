// =============================================================
//  MODAL: ENCUADRAR FOTO DE PERFIL
//  Permite al usuario arrastrar/ajustar un área circular sobre
//  la imagen que seleccionó antes de subirla. Usa react-image-crop
//  (sin dependencias, <5KB comprimido) solo para la interacción
//  visual de recorte; el recorte real se genera con <canvas> nativo.
//  Requiere: npm install react-image-crop
// =============================================================
import { useState, useRef, useEffect } from "react"
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

const TAMANO_SALIDA = 400 // px — tamaño final cuadrado de la foto de perfil

// Dibuja el área seleccionada (en píxeles reales de la imagen) sobre un
// canvas de salida fijo, y lo exporta como Blob listo para subir.
function generarBlobRecortado(imagenElement, cropPixeles) {
    const canvas = document.createElement("canvas")
    const escalaX = imagenElement.naturalWidth / imagenElement.width
    const escalaY = imagenElement.naturalHeight / imagenElement.height

    canvas.width = TAMANO_SALIDA
    canvas.height = TAMANO_SALIDA

    const ctx = canvas.getContext("2d")
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(
        imagenElement,
        cropPixeles.x * escalaX,
        cropPixeles.y * escalaY,
        cropPixeles.width * escalaX,
        cropPixeles.height * escalaY,
        0, 0,
        TAMANO_SALIDA, TAMANO_SALIDA
    )

    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
}

// archivo: File seleccionado por el usuario (input type="file")
// onConfirmar(blob): se llama con la imagen ya recortada lista para subir
// onCancelar(): cierra el modal sin subir nada
const ModalRecortarFoto = ({ archivo, onConfirmar, onCancelar, subiendo }) => {
    const [imagenSrc, setImagenSrc] = useState(null)
    const [crop, setCrop] = useState()
    const [cropPixeles, setCropPixeles] = useState(null)
    const imgRef = useRef(null)

    // Crear y revocar la URL temporal dentro del MISMO efecto es importante:
    // en StrictMode (desarrollo), React monta → limpia → vuelve a montar este
    // componente intencionalmente. Si la URL se creara fuera del useEffect
    // (ej. en useState) y solo se revocara en la limpieza, la limpieza del
    // primer "montaje simulado" la revocaría dejando una URL rota antes de
    // que la imagen llegara a mostrarse. Creándola aquí, cada ciclo de
    // monta/limpia genera su propia URL nueva y válida.
    useEffect(() => {
        const url = URL.createObjectURL(archivo)
        setImagenSrc(url)
        return () => URL.revokeObjectURL(url)
    }, [archivo])

    const alCargarImagen = (e) => {
        const { width, height } = e.currentTarget
        const cropInicial = centerCrop(
            makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
            width,
            height
        )
        setCrop(cropInicial)
    }

    const confirmar = async () => {
        if (!cropPixeles || !imgRef.current) return
        const blob = await generarBlobRecortado(imgRef.current, cropPixeles)
        onConfirmar(blob)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-slate-700 mb-1">Encuadra tu foto</h3>
                <p className="text-slate-500 text-sm mb-4">Arrastra y ajusta el círculo sobre la parte de la imagen que quieres usar como foto de perfil.</p>

                <div className="flex justify-center items-center bg-slate-100 rounded-lg p-2 min-h-[200px]">
                    {!imagenSrc ? (
                        <p className="text-slate-400 text-sm py-10">Cargando imagen...</p>
                    ) : (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCropPixeles(c)}
                            aspect={1}
                            circularCrop
                            keepSelection
                        >
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <img ref={imgRef} src={imagenSrc} onLoad={alCargarImagen} style={{ maxHeight: "55vh" }} alt="Foto a recortar" />
                        </ReactCrop>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button type="button" onClick={confirmar} disabled={subiendo}
                        className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors">
                        {subiendo ? "Guardando..." : "Guardar foto"}
                    </button>
                    <button type="button" onClick={onCancelar} disabled={subiendo}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 font-semibold py-2 rounded-lg transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalRecortarFoto