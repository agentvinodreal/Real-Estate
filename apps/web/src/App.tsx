import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Construction from './pages/Construction'
import ConstructionDetail from './pages/ConstructionDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:slug" element={<PropertyDetail />} />
        <Route path="/construction" element={<Construction />} />
        <Route path="/construction/:slug" element={<ConstructionDetail />} />
      </Route>
    </Routes>
  )
}
