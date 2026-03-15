import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import App from "./App.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0f1923",
            color: "#ffffff",
            border: "1px solid rgba(0,255,180,0.25)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9rem",
          },
          success: {
            iconTheme: { primary: "#00ffb4", secondary: "#04110e" },
          },
          error: {
            iconTheme: { primary: "#ff3b5c", secondary: "#ffffff" },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
