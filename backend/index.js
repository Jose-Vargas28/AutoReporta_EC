import app from "./server.js"
import connectDB from "./src/config/db.js"

connectDB()

const PORT = app.get("port")
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
