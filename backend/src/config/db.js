import mongoose from "mongoose"

mongoose.set("strictQuery", true)

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB conectado correctamente")
    } catch (error) {
        console.error("Error al conectar MongoDB:", error)
        process.exit(1)
    }
}

export default connectDB
