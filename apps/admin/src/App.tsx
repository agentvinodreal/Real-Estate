import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Leads from './pages/Leads'
import Properties from './pages/Properties'
import PropertyForm from './pages/PropertyForm'
import Projects from './pages/Projects'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Leads />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:slug" element={<PropertyForm />} />
        <Route path="projects" element={<Projects />} />
      </Route>
    </Routes>
  )
}
