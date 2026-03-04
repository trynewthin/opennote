import { Routes, Route } from "react-router-dom";
import { ProjectsPage } from "./pages/ProjectsPage";
import { GraphPage } from "./pages/GraphPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/project/:id" element={<GraphPage />} />
        </Routes>
    );
}

export default App;